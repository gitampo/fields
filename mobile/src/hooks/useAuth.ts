import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL, getApiErrorMessage } from '../lib/api';
import { ApiErrorBody, UserProfile } from '../types';

const JWT_STORAGE_KEY =
  ((globalThis as { process?: { env?: Record<string, string> } }).process?.env?.EXPO_PUBLIC_JWT_STORAGE_KEY as string | undefined) ||
  'fields.jwt.token';

export const useAuth = () => {
  const [token, setToken] = useState('');
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [nameError, setNameError] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [formError, setFormError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');

  useEffect(() => {
    const restoreToken = async () => {
      try {
        const storedToken = await AsyncStorage.getItem(JWT_STORAGE_KEY);
        if (storedToken) {
          setToken(storedToken);
        }
      } finally {
        setAuthReady(true);
      }
    };

    void restoreToken();
  }, []);

  useEffect(() => {
    const loadCurrentUser = async () => {
      if (!token) {
        setCurrentUser(null);
        return;
      }

      try {
        const response = await fetch(`${API_URL}/auth/me`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          setCurrentUser(null);
          return;
        }

        const profile = (await response.json()) as UserProfile;
        setCurrentUser(profile);
      } catch {
        setCurrentUser(null);
      }
    };

    void loadCurrentUser();
  }, [token]);

  const clearMessages = () => {
    setNameError('');
    setEmailError('');
    setUsernameError('');
    setPasswordError('');
    setFormError('');
    setAuthSuccess('');
  };

  const switchAuthMode = (mode: 'login' | 'register') => {
    setAuthMode(mode);
    clearMessages();
    setShowPassword(false);
  };

  const handleLogin = async () => {
    clearMessages();
    setShowPassword(false);

    const normalizedEmail = email.trim();
    const normalizedUsername = username.trim();

    if (!normalizedEmail && !normalizedUsername) {
      setEmailError("Inserisci un'email o username validi");
      return;
    }
    if (!password) {
      setPasswordError('Inserisci la password');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalizedEmail, username: normalizedUsername, password }),
      });

      let data: ApiErrorBody = {};
      try {
        data = (await response.json()) as ApiErrorBody;
      } catch {
        data = {};
      }

      if (!response.ok) {
        throw new Error(getApiErrorMessage(response.status, data));
      }

      const nextToken = (data as { token?: string }).token;
      if (!nextToken) {
        throw new Error('Token mancante nella risposta di login');
      }

      await AsyncStorage.setItem(JWT_STORAGE_KEY, nextToken);
      setToken(nextToken);
      setAuthSuccess('Accesso effettuato con successo');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Errore inatteso';
      if (message.toLowerCase().includes('email')) {
        setEmailError(message);
      } else if (message.toLowerCase().includes('password')) {
        setPasswordError(message);
      } else if (message.toLowerCase().includes('username')) {
        setUsernameError(message);
      } else {
        setFormError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    clearMessages();
    setShowPassword(false);

    const normalizedName = name.trim();
    const normalizedEmail = email.trim();
    const normalizedUsername = username.trim();

    if (!normalizedName) {
      setNameError('Inserisci il nome');
      return;
    }
    if (!normalizedEmail && !normalizedUsername) {
      setEmailError("Inserisci un'email o username validi");
      setUsernameError("Inserisci un'email o username validi");
      return;
    }
    if (!password) {
      setPasswordError('Inserisci la password');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: normalizedName, email: normalizedEmail, username: normalizedUsername, password }),
      });

      let data: ApiErrorBody & { token?: string } = {};
      try {
        data = (await response.json()) as ApiErrorBody & { token?: string };
      } catch {
        data = {};
      }

      if (!response.ok) {
        throw new Error(getApiErrorMessage(response.status, data));
      }

      if (data.token) {
        await AsyncStorage.setItem(JWT_STORAGE_KEY, data.token);
        setToken(data.token);
      }
      setAuthSuccess('Registrazione completata con successo');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Errore inatteso';
      if (message.toLowerCase().includes('nome')) {
        setNameError(message);
      } else if (message.toLowerCase().includes('email')) {
        setEmailError(message);
      } else if (message.toLowerCase().includes('password')) {
        setPasswordError(message);
      } else if (message.toLowerCase().includes('username')) {
        setUsernameError(message);
      } else {
        setFormError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    clearMessages();
    setShowPassword(false);
    setPassword('');
    try {
      await AsyncStorage.removeItem(JWT_STORAGE_KEY);
    } finally {
      setToken('');
      setCurrentUser(null);
      setAuthMode('login');
    }
  };

  return {
    authReady,
    token,
    currentUser,
    logout,
    authMode,
    switchAuthMode,
    name,
    setName,
    email,
    setEmail,
    username,
    setUsername,
    password,
    setPassword,
    showPassword,
    setShowPassword,
    loading,
    emailError,
    usernameError,
    nameError,
    passwordError,
    formError,
    authSuccess,
    clearMessages,
    handleLogin,
    handleRegister,
  };
};
