import connectDB from './mongodb';
import User from '@/models/User';

export async function initializeAdmin() {
  try {
    await connectDB();
    await User.createInitialAdmin();
  } catch (error) {
    console.error('Error initializing admin:', error);
  }
}
