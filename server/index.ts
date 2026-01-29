import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { plansRouter } from './routes/plans';
import { commentsRouter, sectionsRouter } from './routes/comments';
import { FileWatcherService } from './services/file-watcher-service';

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/plans', plansRouter);
app.use('/api/comments', commentsRouter);
app.use('/api/sections', sectionsRouter);

// Health check
app.get('/api/health', (_, res) => {
  res.json({ status: 'ok' });
});

// File watcher
const fileWatcher = new FileWatcherService();

// Broadcast to all connected clients
function broadcast(data: object) {
  const message = JSON.stringify(data);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

// Wire up file watcher events to WebSocket
fileWatcher.on('plan:changed', (data) => broadcast({ type: 'plan:changed', data }));
fileWatcher.on('plan:added', (data) => broadcast({ type: 'plan:added', data }));
fileWatcher.on('plan:removed', (data) => broadcast({ type: 'plan:removed', data }));
fileWatcher.on('comments:changed', (data) => broadcast({ type: 'comments:changed', data }));

// Start file watcher
fileWatcher.start();

// WebSocket connection handling
wss.on('connection', (ws) => {
  console.log('Client connected');

  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

const PORT = process.env.PORT || 3335;

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`WebSocket available at ws://localhost:${PORT}/ws`);
});
