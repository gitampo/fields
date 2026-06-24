import { useCallback, useEffect, useMemo, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { API_URL, getApiErrorMessage } from '../lib/api';
import { ApiErrorBody, Booking } from '../types';

const SOCKET_URL =
  ((globalThis as { process?: { env?: Record<string, string> } }).process?.env?.EXPO_PUBLIC_SOCKET_URL as string | undefined) ||
  API_URL;

const parseParticipantIds = (value: string) => (
  Array.from(new Set(value.split(',').map((item) => item.trim()).filter(Boolean)))
);

export const useBookings = (token: string) => {
  const [myBookings, setMyBookings] = useState<Booking[]>([]);
  const [selectedFieldId, setSelectedFieldId] = useState('');
  const [bookingStart, setBookingStart] = useState('');
  const [bookingEnd, setBookingEnd] = useState('');
  const [participantUserIdsInput, setParticipantUserIdsInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState('');
  const [bookingsError, setBookingsError] = useState('');

  const authHeaders = useMemo(
    () => ({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    }),
    [token],
  );

  const handleLoadMyBookings = useCallback(async () => {
    if (!token) {
      setMyBookings([]);
      return;
    }

    setBookingsError('');
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/bookings/me`, {
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

      setMyBookings(Array.isArray(data) ? (data as Booking[]) : []);
    } catch (error) {
      setBookingsError(error instanceof Error ? error.message : 'Errore inatteso');
    } finally {
      setLoading(false);
    }
  }, [authHeaders, token]);

  useEffect(() => {
    if (!token) {
      return;
    }

    const socket: Socket = io(SOCKET_URL, {
      transports: ['websocket'],
    });

    const onBookingsChanged = () => {
      void handleLoadMyBookings();
    };

    socket.on('bookings:changed', onBookingsChanged);

    return () => {
      socket.off('bookings:changed', onBookingsChanged);
      socket.disconnect();
    };
  }, [handleLoadMyBookings, token]);

  const handleCreateBooking = async () => {
    setBookingError('');
    setBookingSuccess('');

    if (!token) {
      setBookingError('Devi avere un account per prenotare');
      return;
    }

    if (!selectedFieldId) {
      setBookingError('Seleziona un campo');
      return;
    }
    if (!bookingStart || !bookingEnd) {
      setBookingError('Inserisci data/ora di inizio e fine');
      return;
    }

    const startDate = new Date(bookingStart);
    const endDate = new Date(bookingEnd);
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      setBookingError('Formato data non valido');
      return;
    }
    if (startDate >= endDate) {
      setBookingError("L'orario di fine deve essere successivo all'inizio");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/bookings`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          fieldId: selectedFieldId,
          startTime: bookingStart,
          endTime: bookingEnd,
          participantUserIds: parseParticipantIds(participantUserIdsInput),
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

      setBookingSuccess('Prenotazione creata con successo');
      setBookingStart('');
      setBookingEnd('');
      setParticipantUserIdsInput('');
      await handleLoadMyBookings();
    } catch (error) {
      setBookingError(error instanceof Error ? error.message : 'Errore inatteso');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBooking = async (bookingId: string) => {
    if (!token) {
      setBookingsError('Devi avere un account per modificare prenotazioni');
      return;
    }

    setBookingsError('');
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/bookings/${bookingId}`, {
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

      await handleLoadMyBookings();
    } catch (error) {
      setBookingsError(error instanceof Error ? error.message : 'Errore inatteso');
    } finally {
      setLoading(false);
    }
  };

  return {
    myBookings,
    selectedFieldId,
    setSelectedFieldId,
    bookingStart,
    setBookingStart,
    bookingEnd,
    setBookingEnd,
    participantUserIdsInput,
    setParticipantUserIdsInput,
    loading,
    bookingError,
    bookingSuccess,
    bookingsError,
    handleLoadMyBookings,
    handleCreateBooking,
    handleDeleteBooking,
  };
};
