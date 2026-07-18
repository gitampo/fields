import React, { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import Screen from '../components/Screen';
import { useAuthContext } from '../context/AuthContext';
import { isAdminUser } from '../lib/admin';
import { API_URL, getApiErrorMessage } from '../lib/api';
import { sharedStyles } from '../lib/styles';
import { ApiErrorBody } from '../types';

type AdminOverview = {
  totalUsers: number;
  totalFields: number;
  totalBookings: number;
  upcomingBookings: number;
  activeOpenParties: number;
  pendingInvites: number;
};

export default function AdminPanelScreen() {
  const navigation = useNavigation<any>();
  const { token, currentUser } = useAuthContext();
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isAdmin = isAdminUser(currentUser);

  const loadOverview = useCallback(async () => {
    if (!token || !isAdmin) {
      setOverview(null);
      return;
    }

    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/admin/overview`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
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

      setOverview(data as AdminOverview);
    } catch (nextError) {
      setOverview(null);
      setError(nextError instanceof Error ? nextError.message : 'Errore inatteso');
    } finally {
      setLoading(false);
    }
  }, [isAdmin, token]);

  useFocusEffect(
    useCallback(() => {
      if (!isAdmin) {
        return;
      }

      void loadOverview();
    }, [isAdmin, loadOverview]),
  );

  if (!isAdmin) {
    return (
      <Screen>
        <View style={styles.lockedCard}>
          <Text style={styles.lockedTitle}>Pannello amministratore</Text>
          <Text style={styles.lockedText}>Accesso negato: questo account non e abilitato come admin.</Text>
          <Text style={styles.lockedHint}>Serve ruolo ADMIN lato backend (configurabile tramite ADMIN_EMAILS).</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Pannello amministratore</Text>
        <Text style={styles.subtitle}>Panoramica rapida e accessi operativi.</Text>

        {loading ? <ActivityIndicator style={styles.loader} color="#1E5FAF" /> : null}

        {error ? <Text style={sharedStyles.errorText}>{error}</Text> : null}

        <View style={styles.grid}>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Utenti</Text>
            <Text style={styles.metricValue}>{overview?.totalUsers ?? '-'}</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Campi</Text>
            <Text style={styles.metricValue}>{overview?.totalFields ?? '-'}</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Prenotazioni totali</Text>
            <Text style={styles.metricValue}>{overview?.totalBookings ?? '-'}</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Prenotazioni future</Text>
            <Text style={styles.metricValue}>{overview?.upcomingBookings ?? '-'}</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Partite aperte</Text>
            <Text style={styles.metricValue}>{overview?.activeOpenParties ?? '-'}</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Inviti in attesa</Text>
            <Text style={styles.metricValue}>{overview?.pendingInvites ?? '-'}</Text>
          </View>
        </View>

        <View style={styles.actionsCard}>
          <Text style={styles.actionsTitle}>Azioni rapide</Text>

          <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('Prenotazioni')}>
            <Text style={styles.actionButtonText}>Vai a Prenotazioni</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('Notifiche')}>
            <Text style={styles.actionButtonText}>Vai a Notifiche</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('Home')}>
            <Text style={styles.actionButtonText}>Vai a Home</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={() => { void loadOverview(); }}>
            <Text style={styles.actionButtonText}>Aggiorna statistiche</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1E5FAF',
  },
  subtitle: {
    marginTop: 4,
    marginBottom: 12,
    color: '#54677A',
    fontSize: 14,
  },
  loader: {
    marginBottom: 10,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  metricCard: {
    width: '48%',
    borderWidth: 1,
    borderColor: '#D7E2EC',
    borderRadius: 12,
    backgroundColor: '#F8FBFF',
    padding: 12,
  },
  metricLabel: {
    color: '#5C6F82',
    fontSize: 12,
    fontWeight: '600',
  },
  metricValue: {
    marginTop: 8,
    color: '#1E5FAF',
    fontSize: 24,
    fontWeight: '800',
  },
  actionsCard: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#D7E2EC',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    padding: 12,
  },
  actionsTitle: {
    color: '#1E5FAF',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
  },
  actionButton: {
    marginBottom: 8,
    borderRadius: 10,
    backgroundColor: '#1E5FAF',
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  lockedCard: {
    borderWidth: 1,
    borderColor: '#E3EAF0',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    padding: 14,
  },
  lockedTitle: {
    color: '#1E5FAF',
    fontSize: 18,
    fontWeight: '700',
  },
  lockedText: {
    marginTop: 6,
    color: '#5C6F82',
    fontSize: 13,
  },
  lockedHint: {
    marginTop: 8,
    color: '#5C6F82',
    fontSize: 12,
  },
});
