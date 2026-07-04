import React, { createContext, useContext } from 'react';
import { UserProfile } from '../types';

type AuthContextValue = {
  token: string;
  currentUser: UserProfile | null;
  logout: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue>({
  token: '',
  currentUser: null,
  logout: async () => {},
});

export const useAuthContext = () => useContext(AuthContext);
