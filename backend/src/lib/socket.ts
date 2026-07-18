import { Server } from 'socket.io';

let socketServer: Server | null = null;

const getUserRoom = (userId: string) => `user_${userId}`;

export const setSocketServer = (io: Server) => {
  socketServer = io;
};

export const getSocketServer = () => socketServer;

export const emitToUser = (userId: string, event: string, payload: unknown) => {
  const io = getSocketServer();
  if (!io) {
    return;
  }

  io.to(getUserRoom(userId)).emit(event, payload);
};

export { getUserRoom };
