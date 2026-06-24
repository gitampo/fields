import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

type JwtPayload = {
  userId: string;
};

type AuthenticatedRequest = Request & {
  userId?: string;
};

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
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
    return next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

export type { AuthenticatedRequest };
