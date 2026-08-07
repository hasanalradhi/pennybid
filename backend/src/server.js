require('dotenv').config();

const app = require('./app');
const { connectDatabase, disconnectDatabase } = require('./config/database');

const PORT = Number(process.env.PORT) || 3000;

async function startServer() {
  await connectDatabase();

  const server = app.listen(PORT, () => {
    console.log(`PennyBid API listening on http://localhost:${PORT}`);
  });

  async function shutdown(signal) {
    console.log(`${signal} received. Closing PennyBid API.`);
    server.close(async () => {
      await disconnectDatabase();
      process.exit(0);
    });
  }

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

startServer().catch((error) => {
  console.error('PennyBid API failed to start:', error.message);
  process.exit(1);
});
