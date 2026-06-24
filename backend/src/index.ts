import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import authRoutes from './routes/auth.routes';
import fieldsRoutes from './routes/fields.routes';
import bookingsRoutes from './routes/bookings.routes';
import partiesRoutes from './routes/parties.routes';
import { setSocketServer } from './lib/socket';

const app = express();
const httpServer = createServer(app);

// Middleware
app.use(express.json());
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || '*',
  credentials: true,
}));

// Socket.IO per realtime (prenotazioni live, party updates)
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || '*',
  },
});
setSocketServer(io);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Route API
app.use('/auth', authRoutes);
app.use('/fields', fieldsRoutes);
app.use('/bookings', bookingsRoutes);
app.use('/parties', partiesRoutes);
// app.use('/users', usersRoutes);

// Socket.IO handlers
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
  });

  // Ascolta aggiornamenti prenotazioni
  socket.on('field:subscribe', (fieldId) => {
    socket.join(`field_${fieldId}`);
  });

  socket.on('field:unsubscribe', (fieldId) => {
    socket.leave(`field_${fieldId}`);
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

const PORT = process.env.PORT || 3000;

httpServer.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
});

export { app, io };

