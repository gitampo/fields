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

const isOnFullHour = (date: Date) => (
  date.getMinutes() === 0 && date.getSeconds() === 0 && date.getMilliseconds() === 0
);

const isOnHalfHourSlot = (date: Date) => (
  (date.getMinutes() === 0 || date.getMinutes() === 30)
  && date.getSeconds() === 0
  && date.getMilliseconds() === 0
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
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [availabilityError, setAvailabilityError] = useState('');
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);

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

    if (!isOnHalfHourSlot(startDate) || !isOnHalfHourSlot(endDate)) {
      setBookingError('La prenotazione deve essere su slot da 30 minuti (es. 17:00 o 17:30)');
      return;
    }

    const durationMs = endDate.getTime() - startDate.getTime();
    const oneHourMs = 60 * 60 * 1000;
    const ninetyMinutesMs = 90 * 60 * 1000;

    if (durationMs !== oneHourMs && durationMs !== ninetyMinutesMs) {
      setBookingError('La prenotazione deve durare 1 ora o 1 ora e 30 minuti');
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
      return false;
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
      return true;
    } catch (error) {
      setBookingsError(error instanceof Error ? error.message : 'Errore inatteso');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveBooking = async (bookingId: string) => {
    if (!token) {
      setBookingsError('Devi avere un account per modificare prenotazioni');
      return false;
    }

    setBookingsError('');
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/bookings/${bookingId}/leave`, {
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

      await handleLoadMyBookings();
      return true;
    } catch (error) {
      setBookingsError(error instanceof Error ? error.message : 'Errore inatteso');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleAddParticipants = async (bookingId: string, participantIdsInput: string) => {
    if (!token) {
      setBookingsError('Devi avere un account per modificare prenotazioni');
      return false;
    }

    const participantUserIds = parseParticipantIds(participantIdsInput);
    if (participantUserIds.length === 0) {
      setBookingsError('Inserisci almeno un partecipante');
      return false;
    }

    setBookingsError('');
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/bookings/${bookingId}/participants`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ participantUserIds }),
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
      return true;
    } catch (error) {
      setBookingsError(error instanceof Error ? error.message : 'Errore inatteso');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleFindAvailableSlots = async (fieldId: string, date: Date) => {
    if (!token) {
      setAvailabilityError('Devi avere un account per cercare orari disponibili');
      return;
    }

    setAvailabilityError('');
    setAvailableSlots([]);

    const dateKey = [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, '0'),
      String(date.getDate()).padStart(2, '0'),
    ].join('-');

    try {
      setAvailabilityLoading(true);
      const response = await fetch(`${API_URL}/bookings/availability?fieldId=${encodeURIComponent(fieldId)}&date=${encodeURIComponent(dateKey)}`, {
        method: 'GET',
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

      const slots = Array.isArray((data as { availableSlots?: unknown[] }).availableSlots)
        ? ((data as { availableSlots: unknown[] }).availableSlots.filter((item): item is string => typeof item === 'string'))
        : [];

      setAvailableSlots(slots);
    } catch (error) {
      setAvailabilityError(error instanceof Error ? error.message : 'Errore inatteso');
    } finally {
      setAvailabilityLoading(false);
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
    availabilityLoading,
    availabilityError,
    availableSlots,
    handleLoadMyBookings,
    handleCreateBooking,
    handleDeleteBooking,
    handleLeaveBooking,
    handleAddParticipants,
    handleFindAvailableSlots,
  };
};
