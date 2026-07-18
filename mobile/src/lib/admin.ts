import { UserProfile } from '../types';

export const isAdminUser = (user: UserProfile | null) => {
  return user?.role === 'ADMIN';
};
