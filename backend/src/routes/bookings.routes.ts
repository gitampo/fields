import { Router } from 'express';
import {
  addBookingParticipantsHandler,
  createBookingHandler,
  deleteBookingHandler,
  getFieldAvailabilityHandler,
  getMyBookingsHistoryHandler,
  getMyBookingsHandler,
  getMyCompletedBookingStatsHandler,
  getMyPendingInvitesHandler,
  leaveBookingHandler,
  respondToBookingInviteHandler,
} from '../controllers/bookings.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

router.get('/me', requireAuth, getMyBookingsHandler);
router.get('/me/history', requireAuth, getMyBookingsHistoryHandler);
router.get('/me/stats/completed', requireAuth, getMyCompletedBookingStatsHandler);
router.get('/invites/pending', requireAuth, getMyPendingInvitesHandler);
router.get('/availability', requireAuth, getFieldAvailabilityHandler);
router.post('/', requireAuth, createBookingHandler);
router.post('/:id/invites/respond', requireAuth, respondToBookingInviteHandler);
router.post('/:id/participants', requireAuth, addBookingParticipantsHandler);
router.post('/:id/leave', requireAuth, leaveBookingHandler);
router.delete('/:id', requireAuth, deleteBookingHandler);

export default router;
