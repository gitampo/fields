import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import authRoutes from './routes/auth.routes';
import fieldsRoutes from './routes/fields.routes';
import bookingsRoutes from './routes/bookings.routes';
import partiesRoutes from './routes/parties.routes';
import notificationsRoutes from './routes/notifications.routes';
import adminRoutes from './routes/admin.routes';
import { getUserRoom, setSocketServer } from './lib/socket';

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
app.use('/notifications', notificationsRoutes);
app.use('/admin', adminRoutes);
// app.use('/users', usersRoutes);

const extractSocketToken = (socket: Socket): string | null => {
  const auth = socket.handshake.auth as { token?: unknown } | undefined;
  if (auth?.token && typeof auth.token === 'string') {
    return auth.token;
  }

  const headerValue = socket.handshake.headers.authorization;
  if (typeof headerValue === 'string' && headerValue.startsWith('Bearer ')) {
    return headerValue.replace('Bearer ', '').trim();
  }

  return null;
};

const getUserIdFromSocket = (socket: Socket): string | null => {
  if (!process.env.JWT_SECRET) {
    return null;
  }

  const token = extractSocketToken(socket);
  if (!token) {
    return null;
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET) as { userId?: string };
    return typeof payload.userId === 'string' ? payload.userId : null;
  } catch {
    return null;
  }
};

// Socket.IO handlers
io.on('connection', (socket: Socket) => {
  const userId = getUserIdFromSocket(socket);
  if (userId) {
    socket.join(getUserRoom(userId));
  }

  console.log(`User connected: ${socket.id}`);

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
  });

  // Ascolta aggiornamenti prenotazioni
  socket.on('field:subscribe', (fieldId: string) => {
    socket.join(`field_${fieldId}`);
  });

  socket.on('field:unsubscribe', (fieldId: string) => {
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

