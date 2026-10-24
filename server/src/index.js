import 'dotenv/config';
import { createApp } from './app.js';
import { connectDB, disconnectDB } from './config/db.js';

const PORT = process.env.PORT || 5000;

async function start() {
  if (!process.env.JWT_SECRET) {
    console.error('JWT_SECRET is not set. Add it to server/.env (see .env.example).');
    process.exit(1);
  }

  try {
    await connectDB(process.env.MONGODB_URI);
  } catch (err) {
    console.error(`Could not connect to MongoDB: ${err.message}`);
    process.exit(1);
  }

  const server = createApp().listen(PORT, () => {
    console.log(`API running on http://localhost:${PORT}`);
  });

  // Close the HTTP server and DB connection cleanly on Ctrl+C / container stop
  const shutdown = async (signal) => {
    console.log(`${signal} received, shutting down...`);
    server.close(async () => {
      await disconnectDB();
      process.exit(0);
    });
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

start();
