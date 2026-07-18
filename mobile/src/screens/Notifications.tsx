import React from 'react';
import {
	ActivityIndicator,
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Screen from '../components/Screen';
import { useAuthContext } from '../context/AuthContext';
import { useNotifications } from '../hooks/useNotifications';
import { sharedStyles } from '../lib/styles';
import { NotificationItem } from '../types';

const formatDateTime = (isoDate: string) => {
	const date = new Date(isoDate);
	if (Number.isNaN(date.getTime())) {
		return '-';
	}

	return date.toLocaleString('it-IT', {
		day: '2-digit',
		month: '2-digit',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
	});
};

export default function NotificationsScreen() {
	const { token } = useAuthContext();
	const {
		notifications,
		loading,
		error,
		unreadCount,
		loadNotifications,
		markAsRead,
		markAllAsRead,
	} = useNotifications(token);

	useFocusEffect(
		React.useCallback(() => {
			void loadNotifications();
		}, [loadNotifications]),
	);

	return (
		<Screen>
			<ScrollView contentContainerStyle={styles.content}>
				<Text style={styles.title}>Notifiche</Text>
				<Text style={styles.subtitle}>
					{unreadCount > 0 ? `${unreadCount} non lette` : 'Tutto aggiornato'}
				</Text>

				{loading ? <ActivityIndicator style={styles.loader} color="#2A7DE1" /> : null}
				{error ? <Text style={sharedStyles.errorText}>{error}</Text> : null}

				<TouchableOpacity
					style={[styles.markAllButton, unreadCount === 0 && styles.markAllButtonDisabled]}
					onPress={() => {
						void markAllAsRead();
					}}
					disabled={unreadCount === 0}
				>
					<Text style={styles.markAllButtonText}>Segna tutte come lette</Text>
				</TouchableOpacity>

				{notifications.length === 0 ? (
					<View style={styles.emptyCard}>
						<Text style={styles.emptyTitle}>Nessuna notifica</Text>
						<Text style={styles.emptyText}>Quando ci saranno novita, le troverai qui.</Text>
					</View>
				) : (
					notifications.map((item: NotificationItem) => (
						<TouchableOpacity
							key={item.id}
							style={[styles.notificationCard, !item.isRead && styles.notificationCardUnread]}
							onPress={() => {
								if (!item.isRead) {
									void markAsRead(item.id);
								}
							}}
						>
							<Text style={styles.notificationMessage}>{item.message}</Text>
							<Text style={styles.notificationMeta}>{formatDateTime(item.createdAt)}</Text>
						</TouchableOpacity>
					))
				)}
			</ScrollView>
		</Screen>
	);
}

const styles = StyleSheet.create({
	content: {
		paddingTop: 12,
		paddingBottom: 24,
	},
	title: {
		fontSize: 28,
		fontWeight: '700',
		color: '#1E5FAF',
	},
	subtitle: {
		marginTop: 4,
		marginBottom: 16,
		color: '#5C6F82',
		fontSize: 16,
	},
	loader: {
		marginVertical: 8,
	},
	markAllButton: {
		alignSelf: 'flex-start',
		borderRadius: 999,
		backgroundColor: '#1E5FAF',
		paddingHorizontal: 12,
		paddingVertical: 8,
		marginBottom: 12,
	},
	markAllButtonDisabled: {
		opacity: 0.4,
	},
	markAllButtonText: {
		color: '#FFFFFF',
		fontSize: 12,
		fontWeight: '700',
	},
	emptyCard: {
		borderRadius: 12,
		borderWidth: 1,
		borderColor: '#E2EAF2',
		backgroundColor: '#FFFFFF',
		padding: 14,
	},
	emptyTitle: {
		color: '#1E5FAF',
		fontSize: 16,
		fontWeight: '700',
	},
	emptyText: {
		marginTop: 4,
		color: '#4E6480',
		fontSize: 13,
	},
	notificationCard: {
		borderRadius: 12,
		borderWidth: 1,
		borderColor: '#E2EAF2',
		backgroundColor: '#FFFFFF',
		padding: 12,
		marginBottom: 10,
	},
	notificationCardUnread: {
		borderColor: '#7AA7DD',
		backgroundColor: '#F3F8FF',
	},
	notificationMessage: {
		color: '#1E5FAF',
		fontSize: 14,
		fontWeight: '600',
		lineHeight: 19,
	},
	notificationMeta: {
		marginTop: 6,
		color: '#6E7F91',
		fontSize: 12,
	},
});
