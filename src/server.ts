import app from './app';
import { connectDB } from './config/db';
import dotenv from 'dotenv';
import chalk from 'chalk';
import transporter from './services/emailService';

dotenv.config();

const PORT = process.env.PORT || 5002;
const ENV = process.env.NODE_ENV || 'development';

// Pretty startup logs
const startServer = async () => {
  console.clear();
  console.log(chalk.cyan.bold('==========================================='));
  console.log(chalk.cyan.bold('🚀 Starting Server...'));
  console.log(chalk.cyan(`🌍 Environment: ${ENV}`));
  console.log(chalk.cyan(`📦 Port: ${PORT}`));
  console.log(chalk.cyan.bold('===========================================\n'));

  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(chalk.greenBright(`✅ Server is running at http://localhost:${PORT}`));
      console.log(chalk.gray(`🕒 Started at: ${new Date().toLocaleString()}\n`));
    });
  } catch (err) {
    console.log(chalk.redBright('❌ Failed to start the server'));
    console.error(err);
    process.exit(1);
  }

  process.on('SIGINT', () => {
    console.log(chalk.yellow('\n🛑 Server shutting down (SIGINT)...'));
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.log(chalk.yellow('\n🛑 Server shutting down (SIGTERM)...'));
    process.exit(0);
  });

  // Handle unhandled rejections
  process.on('unhandledRejection', (reason: any) => {
    console.log(chalk.red('❗ Unhandled Rejection:'), reason);
    process.exit(1);
  });

  // Handle uncaught exceptions
  process.on('uncaughtException', (error: Error) => {
    console.log(chalk.red('💥 Uncaught Exception:'), error.message);
    process.exit(1);
  });

  // SMTP verification
  transporter.verify((error, success) => {
    if (error) console.error('SMTP Error:', error);
    else console.log('SMTP Connected:', success);
  });
};

startServer();
