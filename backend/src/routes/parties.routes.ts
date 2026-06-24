import { Router } from 'express';
import {
  createPartyHandler,
  joinPartyHandler,
  listPartiesHandler,
} from '../controllers/parties.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

router.get('/', requireAuth, listPartiesHandler);
router.post('/', requireAuth, createPartyHandler);
router.post('/:id/join', requireAuth, joinPartyHandler);

export default router;
