import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

const [,, userIdentifier, newPassword] = process.argv;

if (!userIdentifier || !newPassword) {
  console.error('Usage: node scripts/updateUserPassword.js <email|userId> <newPassword>');
  process.exit(1);
}

async function run() {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI is not defined');
    }

    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    const query = userIdentifier.includes('@')
      ? { email: userIdentifier.toLowerCase() }
      : { _id: userIdentifier };

    const user = await User.findOne(query);
    if (!user) {
      console.error('User not found for identifier:', userIdentifier);
      process.exit(1);
    }

    user.password = newPassword;
    user.markModified('password');
    await user.save();

    console.log(`Password updated successfully for user ${user.email || user._id}`);
  } catch (err) {
    console.error('Error updating password:', err.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

run();

