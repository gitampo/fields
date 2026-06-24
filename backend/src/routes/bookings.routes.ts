import { Router } from 'express';
import {
  addBookingParticipantsHandler,
  createBookingHandler,
  deleteBookingHandler,
  getMyBookingsHandler,
} from '../controllers/bookings.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

router.get('/me', requireAuth, getMyBookingsHandler);
router.post('/', requireAuth, createBookingHandler);
router.post('/:id/participants', requireAuth, addBookingParticipantsHandler);
router.delete('/:id', requireAuth, deleteBookingHandler);

export default router;
