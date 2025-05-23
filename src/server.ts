import { Server } from 'http';
import app from './app';
import config from './app/config';

process.on('uncaughtException', (err) => {
  console.error(err);
  process.exit(1);
});

let server: Server | null = null;

async function startServer() {
  server = app.listen(config.port, () => {
    console.log(`🎯 Server listening on port: ${config.port}`);
  });

  process.on('unhandledRejection', (error) => {
    if (server) {
      server.close(() => {
        console.log(error);
        process.exit(1);
      });
    } else {
      process.exit(1);
    }
  });
}

startServer();

process.on('SIGTERM', () => {
  if (server) {
    server.close();
  }
});
