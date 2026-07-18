import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';

type Role = 'USER' | 'ADMIN';

type JwtPayload = {
  userId: string;
  role?: Role;
};

type AuthenticatedRequest = Request & {
  userId?: string;
  userRole?: Role;
};

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  const authReq = req as AuthenticatedRequest;
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Missing or invalid authorization header' });
  }

  if (!process.env.JWT_SECRET) {
    return res.status(500).json({ message: 'JWT_SECRET is not configured' });
  }

  const token = authHeader.replace('Bearer ', '').trim();

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET) as JwtPayload;

    if (!payload?.userId) {
      return res.status(401).json({ message: 'Invalid token payload' });
    }

    authReq.userId = payload.userId;
    if (payload.role === 'ADMIN' || payload.role === 'USER') {
      authReq.userRole = payload.role;
      return next();
    }

    // Supporto token legacy senza ruolo: recupero dal DB.
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { role: true },
    });

    if (!user) {
      return res.status(401).json({ message: 'Invalid token payload' });
    }

    authReq.userRole = user.role === 'ADMIN' ? 'ADMIN' : 'USER';
    return next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  const authReq = req as AuthenticatedRequest;

  if (authReq.userRole !== 'ADMIN') {
    return res.status(403).json({ message: 'Admin access required' });
  }

  return next();
};

export type { AuthenticatedRequest };
