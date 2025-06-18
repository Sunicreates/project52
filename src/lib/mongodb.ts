import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/52projects';

export const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
  } catch (error) {
    process.exit(1);
  }
};

export const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
  } catch (error) {
  }
}; 