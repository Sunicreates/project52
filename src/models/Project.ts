import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  techStack: {
    type: String,
    required: true
  },
  week: {
    type: Number,
    required: true,
    min: 1,
    max: 52
  },
  status: {
    type: String,
    enum: ['Not Started', 'Under Review', 'Approved'],
    default: 'Not Started'
  },
  githubRepo: {
    type: String
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userName: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt timestamp before saving
projectSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export const Project = mongoose.model('Project', projectSchema); 