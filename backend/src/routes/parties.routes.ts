import { Router } from 'express';
import {
  createPartyHandler,
  deletePartyHandler,
  joinPartyHandler,
  listPartiesHandler,
} from '../controllers/parties.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

router.get('/', requireAuth, listPartiesHandler);
router.post('/', requireAuth, createPartyHandler);
router.post('/:id/join', requireAuth, joinPartyHandler);
router.delete('/:id', requireAuth, deletePartyHandler);

export default router;
