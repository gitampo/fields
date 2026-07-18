import { useCallback, useEffect, useMemo, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { API_URL, getApiErrorMessage } from '../lib/api';
import { ApiErrorBody, NotificationItem } from '../types';

const SOCKET_URL =
	((globalThis as { process?: { env?: Record<string, string> } }).process?.env?.EXPO_PUBLIC_SOCKET_URL as string | undefined) ||
	API_URL;

export const useNotifications = (token: string) => {
	const [notifications, setNotifications] = useState<NotificationItem[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');

	const authHeaders = useMemo(
		() => ({
			'Content-Type': 'application/json',
			Authorization: `Bearer ${token}`,
		}),
		[token],
	);

	const loadNotifications = useCallback(async () => {
		if (!token) {
			setNotifications([]);
			return;
		}

		setError('');
		setLoading(true);

		try {
			const response = await fetch(`${API_URL}/notifications`, {
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

			setNotifications(Array.isArray(data) ? (data as NotificationItem[]) : []);
		} catch (nextError) {
			setError(nextError instanceof Error ? nextError.message : 'Errore inatteso');
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
			auth: {
				token,
			},
		});

		const onNewNotification = (incoming: NotificationItem) => {
			setNotifications((prev) => {
				if (prev.some((item) => item.id === incoming.id)) {
					return prev;
				}

				return [incoming, ...prev];
			});
		};

		socket.on('notifications:new', onNewNotification);

		return () => {
			socket.off('notifications:new', onNewNotification);
			socket.disconnect();
		};
	}, [token]);

	const markAsRead = useCallback(async (notificationId: string) => {
		if (!token) {
			return false;
		}

		try {
			const response = await fetch(`${API_URL}/notifications/${notificationId}/read`, {
				method: 'PATCH',
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

			setNotifications((prev) => prev.map((item) => (
				item.id === notificationId ? { ...item, isRead: true } : item
			)));
			return true;
		} catch (nextError) {
			setError(nextError instanceof Error ? nextError.message : 'Errore inatteso');
			return false;
		}
	}, [authHeaders, token]);

	const markAllAsRead = useCallback(async () => {
		if (!token) {
			return false;
		}

		try {
			const response = await fetch(`${API_URL}/notifications/read-all`, {
				method: 'PATCH',
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

			setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));
			return true;
		} catch (nextError) {
			setError(nextError instanceof Error ? nextError.message : 'Errore inatteso');
			return false;
		}
	}, [authHeaders, token]);

	const unreadCount = useMemo(
		() => notifications.reduce((count, item) => count + (item.isRead ? 0 : 1), 0),
		[notifications],
	);

	return {
		notifications,
		loading,
		error,
		unreadCount,
		loadNotifications,
		markAsRead,
		markAllAsRead,
	};
};
