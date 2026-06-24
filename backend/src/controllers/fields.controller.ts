import { Request, Response } from 'express';
import { getAllFields } from '../services/fields.service';

export const listFields = async (_req: Request, res: Response) => {
  try {
    const fields = await getAllFields();
    return res.status(200).json(fields);
  } catch (error) {
    if (error instanceof Error) {
      return res.status(500).json({ message: error.message });
    }

    return res.status(500).json({ message: 'Internal server error' });
  }
};
