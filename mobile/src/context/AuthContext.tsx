import React, { createContext, useContext } from 'react';

type AuthContextValue = {
  token: string;
  logout: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue>({
  token: '',
  logout: async () => {},
});

export const useAuthContext = () => useContext(AuthContext);
