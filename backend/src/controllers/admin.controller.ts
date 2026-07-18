import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { getAdminOverview } from '../services/admin.service';

export const getAdminOverviewHandler = async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const overview = await getAdminOverview();
    return res.status(200).json(overview);
  } catch (error) {
    if (error instanceof Error) {
      return res.status(500).json({ message: error.message });
    }

    return res.status(500).json({ message: 'Internal server error' });
  }
};
