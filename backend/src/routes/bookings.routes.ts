import { Router } from 'express';
import {
  addBookingParticipantsHandler,
  createBookingHandler,
  deleteBookingHandler,
  getFieldAvailabilityHandler,
  getMyBookingsHandler,
  leaveBookingHandler,
} from '../controllers/bookings.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

router.get('/me', requireAuth, getMyBookingsHandler);
router.get('/availability', requireAuth, getFieldAvailabilityHandler);
router.post('/', requireAuth, createBookingHandler);
router.post('/:id/participants', requireAuth, addBookingParticipantsHandler);
router.post('/:id/leave', requireAuth, leaveBookingHandler);
router.delete('/:id', requireAuth, deleteBookingHandler);

export default router;
