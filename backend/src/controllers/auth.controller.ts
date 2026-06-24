// Controller per l'autenticazione degli utenti

import { Request, Response } from 'express';
import { validateLogin, validateRegister } from '../validators/auth.validator';
import { AuthServiceError, loginUser, registerUser } from '../services/auth.service';

// Funzione per registrare un nuovo utente
export const register = async (req: Request, res: Response) => {
  const { email, password, name } = req.body;

  // Validazione input
  const validationErrors = validateRegister({ email, password, name });
  if (validationErrors.length > 0) {
    return res.status(400).json({ errors: validationErrors });
  }

  try {
    const { token } = await registerUser({ email, password, name });

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
  const { email, password } = req.body;

  // Funzione validateLogin restituisce un array di errori, se ci sono
  const validationErrors = validateLogin({ email, password });
  if (validationErrors.length > 0) {
    return res.status(400).json({ errors: validationErrors });
  }

  try {
    const { token } = await loginUser({ email, password });

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
