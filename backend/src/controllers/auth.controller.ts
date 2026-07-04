// Controller per l'autenticazione degli utenti

import { Request, Response } from 'express';
import { validateLogin, validateRegister } from '../validators/auth.validator';
import {
  AuthServiceError,
  deleteUserAccount,
  getUserProfile,
  loginUser,
  registerUser,
} from '../services/auth.service';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

// Funzione per registrare un nuovo utente
export const register = async (req: Request, res: Response) => {
  const { email, password, name, username } = req.body;

  // Validazione input
  const validationErrors = validateRegister({ email, password, name, username });
  if (validationErrors.length > 0) {
    return res.status(400).json({ errors: validationErrors });
  }

  try {
    const { token } = await registerUser({ email, password, name, username });

    res.status(201).json({ token });
  } catch (error) {
    if (error instanceof AuthServiceError) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    if (error instanceof Error) {
      return res.status(500).json({ message: error.message });
    }

    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Funzione per il login dell'utente

export const login = async (req: Request, res: Response) => {
  const { email, password, username } = req.body;

  // Funzione validateLogin restituisce un array di errori, se ci sono
  const validationErrors = validateLogin({ email, password, username });
  if (validationErrors.length > 0) {
    return res.status(400).json({ errors: validationErrors });
  }

  try {
    const { token } = await loginUser({ email, password, username });

    return res.status(200).json({ token });
  } catch (error) {
    if (error instanceof AuthServiceError) {
      return res.status(error.statusCode).json({ message: error.message });
    }

    if (error instanceof Error) {
      return res.status(500).json({ message: error.message });
    }

    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const me = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const profile = await getUserProfile(req.userId);

    if (!profile) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json(profile);
  } catch (error) {
    if (error instanceof Error) {
      return res.status(500).json({ message: error.message });
    }

    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const removeMe = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const deleted = await deleteUserAccount(req.userId);

    if (!deleted) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    if (error instanceof Error) {
      return res.status(500).json({ message: error.message });
    }

    return res.status(500).json({ message: 'Internal server error' });
  }
};
