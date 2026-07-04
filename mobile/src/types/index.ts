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
  points: number;
  createdAt: string;
};

export type BookingParticipant = {
  id: string;
  userId: string;
  user?: BasicUser;
};

export type Booking = {
  id: string;
  fieldId: string;
  ownerId: string;
  startTime: string;
  endTime: string;
  status: string;
  field?: Field;
  owner?: BasicUser;
  participants?: BookingParticipant[];
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
  title: string;
  startTime: string;
  endTime: string;
  isPublic: boolean;
  maxPlayers: number;
  joinedCount?: number;
  remainingSlots?: number;
  owner?: BasicUser;
  members?: PartyMember[];
};

export type ApiErrorBody = {
  message?: string;
  errors?: string[];
};
