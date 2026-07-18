export type Field = {
  id: string;
  name: string;
  sport: string;
  location?: string;
  capacity: number;
  pricePerHour: number;
  isAvailable: boolean;
};

export type BasicUser = {
  id: string;
  name: string;
  email: string;
};

export type UserProfile = {
  id: string;
  name: string;
  email: string;
  username: string;
  role: 'USER' | 'ADMIN';
  points: number;
  notifyOnFieldBooked: boolean;
  notifyOnOpenParty: boolean;
  createdAt: string;
};

export type NotificationItem = {
  id: string;
  userId: string;
  message: string;
  isRead: boolean;
  createdAt: string;
};

export type BookingParticipant = {
  id: string;
  userId: string;
  status?: 'pending' | 'accepted' | 'rejected';
  user?: BasicUser;
};

export type Booking = {
  id: string;
  fieldId: string;
  ownerId: string;
  bookingRole?: 'owner' | 'participant' | 'invitee';
  createdAt?: string;
  startTime: string;
  endTime: string;
  status: string;
  field?: Field;
  owner?: BasicUser;
  participants?: BookingParticipant[];
};

export type BookingInvite = {
  inviteId: string;
  status: 'pending';
  invitedAt: string;
  booking: Booking;
};

export type PartyMember = {
  id: string;
  userId?: string;
  displayName?: string;
  isGuest: boolean;
  joinedAt: string;
  user?: BasicUser;
};

export type Party = {
  id: string;
  ownerId: string;
  bookingId?: string;
  booking?: {
    field?: Field;
  };
  title: string;
  startTime: string;
  endTime: string;
  isPublic: boolean;
  maxPlayers: number;
  joinedCount?: number;
  remainingSlots?: number;
  isJoinedByMe?: boolean;
  owner?: BasicUser;
  members?: PartyMember[];
};

export type ApiErrorBody = {
  message?: string;
  errors?: string[];
};
