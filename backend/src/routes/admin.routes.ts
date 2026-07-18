import { Router } from 'express';
import { getAdminOverviewHandler } from '../controllers/admin.controller';
import { requireAdmin, requireAuth } from '../middleware/auth.middleware';

const router = Router();

router.get('/overview', requireAuth, requireAdmin, getAdminOverviewHandler);

export default router;
