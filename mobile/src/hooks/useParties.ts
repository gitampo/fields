import { useCallback, useEffect, useMemo, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { API_URL, getApiErrorMessage } from '../lib/api';
import { ApiErrorBody, Party } from '../types';

const SOCKET_URL =
  ((globalThis as { process?: { env?: Record<string, string> } }).process?.env?.EXPO_PUBLIC_SOCKET_URL as string | undefined) ||
  API_URL;

export const useParties = (token: string) => {
  const [parties, setParties] = useState<Party[]>([]);
  const [partiesLoading, setPartiesLoading] = useState(false);
  const [partiesError, setPartiesError] = useState('');

  const [title, setTitle] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [maxPlayers, setMaxPlayers] = useState('10');
  const [bookingId, setBookingId] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [partySuccess, setPartySuccess] = useState('');

  const authHeaders = useMemo(
    () => ({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    }),
    [token],
  );

  const handleLoadParties = useCallback(async () => {
    if (!token) {
      setParties([]);
      return;
    }

    setPartiesError('');
    try {
      setPartiesLoading(true);
      const response = await fetch(`${API_URL}/parties`, {
        method: 'GET',
        headers: authHeaders,
      });

      let data: unknown = [];
      try {
        data = await response.json();
      } catch {
        data = [];
      }

      if (!response.ok) {
        throw new Error(getApiErrorMessage(response.status, (data as ApiErrorBody) || {}));
      }

      setParties(Array.isArray(data) ? (data as Party[]) : []);
    } catch (error) {
      setPartiesError(error instanceof Error ? error.message : 'Errore inatteso');
    } finally {
      setPartiesLoading(false);
    }
  }, [authHeaders, token]);

  useEffect(() => {
    if (!token) {
      return;
    }

    const socket: Socket = io(SOCKET_URL, {
      transports: ['websocket'],
    });

    const onPartiesChanged = () => {
      void handleLoadParties();
    };

    socket.on('parties:changed', onPartiesChanged);

    return () => {
      socket.off('parties:changed', onPartiesChanged);
      socket.disconnect();
    };
  }, [handleLoadParties, token]);

  const handleCreateParty = async () => {
    setPartySuccess('');
    setPartiesError('');

    if (!title.trim()) {
      setPartiesError('Inserisci un titolo party');
      return;
    }

    if (!startTime || !endTime) {
      setPartiesError('Inserisci inizio e fine party (ISO)');
      return;
    }

    try {
      setPartiesLoading(true);
      const response = await fetch(`${API_URL}/parties`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          title: title.trim(),
          startTime,
          endTime,
          isPublic,
          maxPlayers: Number(maxPlayers),
          bookingId: bookingId.trim() || undefined,
        }),
      });

      let data: unknown = {};
      try {
        data = await response.json();
      } catch {
        data = {};
      }

      if (!response.ok) {
        throw new Error(getApiErrorMessage(response.status, (data as ApiErrorBody) || {}));
      }

      setPartySuccess('Party creato con successo');
      setTitle('');
      setBookingId('');
      await handleLoadParties();
    } catch (error) {
      setPartiesError(error instanceof Error ? error.message : 'Errore inatteso');
    } finally {
      setPartiesLoading(false);
    }
  };

  const handleJoinParty = async (partyId: string) => {
    setPartiesError('');

    try {
      setPartiesLoading(true);
      const response = await fetch(`${API_URL}/parties/${partyId}/join`, {
        method: 'POST',
        headers: authHeaders,
      });

      let data: unknown = {};
      try {
        data = await response.json();
      } catch {
        data = {};
      }

      if (!response.ok) {
        throw new Error(getApiErrorMessage(response.status, (data as ApiErrorBody) || {}));
      }

      await handleLoadParties();
    } catch (error) {
      setPartiesError(error instanceof Error ? error.message : 'Errore inatteso');
    } finally {
      setPartiesLoading(false);
    }
  };

  const handleDeleteParty = async (partyId: string) => {
    setPartiesError('');

    try {
      setPartiesLoading(true);
      const response = await fetch(`${API_URL}/parties/${partyId}`, {
        method: 'DELETE',
        headers: authHeaders,
      });

      let data: unknown = {};
      try {
        data = await response.json();
      } catch {
        data = {};
      }

      if (!response.ok) {
        throw new Error(getApiErrorMessage(response.status, (data as ApiErrorBody) || {}));
      }

      await handleLoadParties();
      return true;
    } catch (error) {
      setPartiesError(error instanceof Error ? error.message : 'Errore inatteso');
      return false;
    } finally {
      setPartiesLoading(false);
    }
  };

  return {
    parties,
    partiesLoading,
    partiesError,
    title,
    setTitle,
    startTime,
    setStartTime,
    endTime,
    setEndTime,
    maxPlayers,
    setMaxPlayers,
    bookingId,
    setBookingId,
    isPublic,
    setIsPublic,
    partySuccess,
    handleLoadParties,
    handleCreateParty,
    handleJoinParty,
    handleDeleteParty,
  };
};
