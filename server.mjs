import express from 'express';
import cors from 'cors';
import axios from 'axios';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import multer from 'multer';
import path from 'path';
import { User } from './src/models/User.js';
import { Project } from './src/models/Project.js';
import { Chat } from './src/models/Chat.js';

dotenv.config();

const app = express();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

app.use(cors({
  origin: 'http://localhost:5173', // Vite's default port
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/52projects';
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    // Recreate indexes
    return User.collection.dropIndexes();
  })
  .then(() => {
    console.log('Dropped existing indexes');
    return User.createIndexes();
  })
  .then(() => {
    console.log('Created new indexes');
    // Create admin user after indexes are set up
    return createAdminUser();
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
  });

// Create admin user if it doesn't exist
const createAdminUser = async () => {
  try {
    const adminExists = await User.findOne({ email: 'admin@52projects.com' });
    if (!adminExists) {
      const admin = new User({
        name: 'Admin',
        email: 'admin@52projects.com',
        password: 'admin123',
        role: 'admin',
        provider: 'local'
      });
      await admin.save();
      console.log('Admin user created successfully');
    } else {
      console.log('Admin user already exists');
    }
  } catch (error) {
    console.error('Error creating admin user:', error);
  }
};

// Authentication Middleware
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
   
    
    const token = authHeader && authHeader.split(' ')[1];
   
    
    if (!token) {
      console.log('No token provided');
      return res.status(401).json({ error: 'Authentication required' });
    }

    // For now, we'll just check if the token exists
    // In a production environment, you should verify the JWT token
    const user = await User.findOne({ authToken: token });
 
    
    if (!user) {
      console.log('Invalid token - no user found');
      return res.status(401).json({ error: 'Invalid token' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
};

// GitHub OAuth Configuration
const GITHUB_CLIENT_ID = process.env.VITE_GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = process.env.VITE_GITHUB_CLIENT_SECRET;
const GITHUB_REDIRECT_URI = process.env.VITE_GITHUB_REDIRECT_URI;

// GitHub Token Exchange Endpoint
app.post('/api/github/token', async (req, res) => {
  try {
    const { code } = req.body;
    console.log('Received code for token exchange:', code);
    console.log('GitHub OAuth config:', {
      clientId: GITHUB_CLIENT_ID ? 'Set' : 'Not set',
      clientSecret: GITHUB_CLIENT_SECRET ? 'Set' : 'Not set',
      redirectUri: GITHUB_REDIRECT_URI
    });
    
    console.log('Exchanging code for GitHub access token...');
    const response = await axios.post('https://github.com/login/oauth/access_token', {
      client_id: GITHUB_CLIENT_ID,
      client_secret: GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: GITHUB_REDIRECT_URI,
    }, {
      headers: {
        Accept: 'application/json',
      },
    });

    console.log('GitHub token exchange response:', response.data);
    const accessToken = response.data.access_token;
    
    // Fetch GitHub user data
    console.log('Fetching GitHub user data...');
    const githubUserResponse = await axios.get('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    const githubUser = githubUserResponse.data;
    console.log('GitHub user data:', githubUser);

    // Fetch user's email from GitHub
    console.log('Fetching GitHub user emails...');
    const emailResponse = await axios.get('https://api.github.com/user/emails', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    const primaryEmail = emailResponse.data.find(email => email.primary)?.email;
    console.log('Primary email:', primaryEmail);
    
    if (!primaryEmail) {
      console.error('No primary email found for GitHub user');
      throw new Error('No primary email found for GitHub user');
    }
    
    // First try to find user by GitHub ID
    console.log('Looking for existing user by GitHub ID:', githubUser.id);
    let user = await User.findOne({ githubId: githubUser.id.toString() });
    
    if (!user) {
      console.log('User not found by GitHub ID, checking by email...');
      // If not found by GitHub ID, check if user exists with the same email
      user = await User.findOne({ email: primaryEmail });
      
      if (user) {
        console.log('Found existing user by email, updating GitHub info');
        // If user exists with email but no GitHub ID, update their GitHub info
        user.githubId = githubUser.id.toString();
        user.provider = 'github';
        user.avatar = githubUser.avatar_url;
      } else {
        console.log('Creating new user from GitHub data');
        // Create new user
        user = new User({
          name: githubUser.name || githubUser.login,
          email: primaryEmail,
          githubId: githubUser.id.toString(),
          provider: 'github',
          avatar: githubUser.avatar_url,
          role: 'user'
        });
      }
    }

    // Generate new auth token
    const token = Buffer.from(`${githubUser.id}-${Date.now()}`).toString('base64');
    user.authToken = token;
    await user.save();
    console.log('Saved user with new auth token');

    res.json({
      access_token: user.authToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        provider: 'github'
      }
    });
  } catch (error) {
    console.error('Error exchanging code for token:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to exchange code for token' });
  }
});

// User Routes
app.post('/api/users/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const user = new User({ name, email, password });
    await user.save();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/users/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    
    if (!user || user.password !== password) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate and store token (same as GitHub flow)
    const token = Buffer.from(`${user._id}-${Date.now()}`).toString('base64');
    user.authToken = token;  // Store in authToken field
    await user.save();

    res.json({ 
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role || 'user'
      },
      token 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Project Routes
app.get('/api/projects', authenticateToken, async (req, res) => {
  try {
    const projects = await Project.find({ userId: req.user._id });
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/projects', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const project = new Project({
      ...req.body,
      userId: req.user._id,
      userName: user.name || user.email.split('@')[0] // Use name or email username as fallback
    });
    await project.save();
    res.status(201).json(project);
  } catch (error) {
    console.error('Project creation error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/projects/:id', authenticateToken, async (req, res) => {
  try {
    const projectId = req.params.id;
    if (!projectId || !mongoose.Types.ObjectId.isValid(projectId)) {
      console.log('Invalid project ID:', projectId);
      return res.status(400).json({ error: 'Invalid project ID' });
    }

    console.log('Updating project:', { id: projectId, body: req.body });
    
    // First find the existing project to preserve required fields
    const existingProject = await Project.findOne({ _id: projectId, userId: req.user._id });
    if (!existingProject) {
      console.log('Project not found:', projectId);
      return res.status(404).json({ error: 'Project not found' });
    }

    // Merge the update data with existing project data
    const updateData = {
      ...req.body,
      userId: existingProject.userId, // Ensure userId cannot be changed
      userName: existingProject.userName, // Preserve userName
      techStack: req.body.techStack || existingProject.techStack // Preserve techStack if not provided
    };

    console.log('Merged update data:', updateData);

    const project = await Project.findOneAndUpdate(
      { _id: projectId, userId: req.user._id },
      updateData,
      { new: true, runValidators: true }
    );

    if (!project) {
      console.log('Project update failed:', projectId);
      return res.status(404).json({ error: 'Project not found or update failed' });
    }

    console.log('Project updated successfully:', project);
    res.json(project);
  } catch (error) {
    console.error('Project update error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/projects/:id', authenticateToken, async (req, res) => {
  try {
    const project = await Project.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id
    });
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Chat Routes
app.post('/api/chat', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    const chatData = {
      ...req.body,
      senderId: req.user._id,
      senderName: req.user.name || req.user.email.split('@')[0]
    };

    // Handle file upload if present
    if (req.file) {
      chatData.fileUrl = `/uploads/${req.file.filename}`;
      chatData.fileName = req.file.originalname;
      chatData.fileType = req.file.mimetype;
      chatData.fileSize = req.file.size;
    }

    const chat = new Chat(chatData);
    await chat.save();
    res.status(201).json(chat);
  } catch (error) {
    console.error('Chat message creation error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/chat', authenticateToken, async (req, res) => {
  try {
    let messages;
    if (req.user.role === 'admin') {
      // Admin can see all messages
      messages = await Chat.find().sort({ timestamp: 1 });
    } else {
      // Regular users can only see their messages and admin messages
      messages = await Chat.find({
        $or: [
          { senderId: req.user._id },
          { isAdmin: true }
        ]
      }).sort({ timestamp: 1 });
    }
    // Map MongoDB _id to id in the response
    const mappedMessages = messages.map(msg => ({
      ...msg.toObject(),
      id: msg._id.toString()
    }));
    res.json({ messages: mappedMessages });
  } catch (error) {
    console.error('Error fetching chat messages:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete chat message
app.delete('/api/chat/:id', authenticateToken, async (req, res) => {
  try {
    const message = await Chat.findById(req.params.id);
    
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // Check if user is admin or the message sender
    if (req.user.role !== 'admin' && message.senderId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to delete this message' });
    }

    await Chat.findByIdAndDelete(req.params.id);
    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Error deleting chat message:', error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 