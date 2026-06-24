import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAuthContext } from '../context/AuthContext';
import { useFields } from '../hooks/useFields';
import { FieldCard } from '../components/FieldCard';
import { sharedStyles } from '../lib/styles';
import { FieldsStackParamList } from '../navigation/MainTabs';

type NavigationProp = StackNavigationProp<FieldsStackParamList, 'FieldsList'>;

export default function FieldsScreen() {
  const { token, logout } = useAuthContext();
  const navigation = useNavigation<NavigationProp>();
  const { fields, loading, fieldsError, handleLoadFields } = useFields(token);
  const [search, setSearch] = useState('');
  const [sportFilter, setSportFilter] = useState('all');
  const [availableOnly, setAvailableOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'priceAsc' | 'priceDesc'>('name');

  useFocusEffect(
    useCallback(() => {
      void handleLoadFields();
    }, [handleLoadFields]),
  );

  const sports = useMemo(() => {
    const unique = Array.from(new Set(fields.map((field) => field.sport).filter(Boolean)));
    return ['all', ...unique];
  }, [fields]);

  const filteredFields = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    const next = fields
      .filter((field) => {
        const matchesSearch =
          !normalizedSearch ||
          field.name.toLowerCase().includes(normalizedSearch) ||
          (field.location ?? '').toLowerCase().includes(normalizedSearch);

        const matchesSport = sportFilter === 'all' || field.sport === sportFilter;
        const matchesAvailability = !availableOnly || field.isAvailable;

        return matchesSearch && matchesSport && matchesAvailability;
      })
      .slice();

    if (sortBy === 'priceAsc') {
      next.sort((a, b) => a.pricePerHour - b.pricePerHour);
    } else if (sortBy === 'priceDesc') {
      next.sort((a, b) => b.pricePerHour - a.pricePerHour);
    } else {
      next.sort((a, b) => a.name.localeCompare(b.name));
    }

    return next;
  }, [fields, search, sportFilter, availableOnly, sortBy]);

  return (
    <SafeAreaView style={styles.container}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <Text style={styles.backText}>← Indietro</Text>
            </TouchableOpacity>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Campi disponibili</Text>
          <Text style={styles.subtitle}>Tocca un campo per prenotarlo</Text>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={() => void logout()}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <TextInput
        value={search}
        onChangeText={setSearch}
        placeholder="Cerca per nome o zona"
        style={sharedStyles.input}
      />

      <View style={styles.controlsRow}>
        <TouchableOpacity
          style={[styles.filterButton, availableOnly && styles.filterButtonActive]}
          onPress={() => setAvailableOnly((current) => !current)}
        >
          <Text style={[styles.filterButtonText, availableOnly && styles.filterButtonTextActive]}>
            Solo disponibili
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, sortBy === 'name' && styles.filterButtonActive]}
          onPress={() => setSortBy('name')}
        >
          <Text style={[styles.filterButtonText, sortBy === 'name' && styles.filterButtonTextActive]}>
            Nome
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, sortBy === 'priceAsc' && styles.filterButtonActive]}
          onPress={() => setSortBy('priceAsc')}
        >
          <Text style={[styles.filterButtonText, sortBy === 'priceAsc' && styles.filterButtonTextActive]}>
            Prezzo ↑
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, sortBy === 'priceDesc' && styles.filterButtonActive]}
          onPress={() => setSortBy('priceDesc')}
        >
          <Text style={[styles.filterButtonText, sortBy === 'priceDesc' && styles.filterButtonTextActive]}>
            Prezzo ↓
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        horizontal
        data={sports}
        keyExtractor={(item) => item}
        contentContainerStyle={styles.sportsList}
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => {
          const isActive = sportFilter === item;
          return (
            <TouchableOpacity
              style={[styles.sportChip, isActive && styles.sportChipActive]}
              onPress={() => setSportFilter(item)}
            >
              <Text style={[styles.sportChipText, isActive && styles.sportChipTextActive]}>
                {item === 'all' ? 'Tutti gli sport' : item}
              </Text>
            </TouchableOpacity>
          );
        }}
      />

      <TouchableOpacity style={sharedStyles.button} onPress={handleLoadFields} disabled={loading}>
        {loading
          ? <ActivityIndicator color="#FFFFFF" />
          : <Text style={sharedStyles.buttonText}>Carica campi</Text>
        }
      </TouchableOpacity>

      {fieldsError ? <Text style={sharedStyles.errorText}>{fieldsError}</Text> : null}

      <FlatList
        data={filteredFields}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={handleLoadFields} />}
        ListEmptyComponent={<Text style={styles.empty}>Nessun campo trovato con i filtri selezionati</Text>}
        renderItem={({ item }) => (
          <FieldCard
            field={item}
            isSelected={false}
            onPress={() => navigation.navigate('Booking', { fieldId: item.id, fieldName: item.name })}
          />
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0B1F33',
  },
  subtitle: {
    marginTop: 4,
    fontSize: 16,
    color: '#54677A',
  },
  logoutButton: {
    backgroundColor: '#EAF4FF',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  logoutText: {
    color: '#0A84FF',
    fontWeight: '700',
    fontSize: 13,
  },
  controlsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  filterButton: {
    borderWidth: 1,
    borderColor: '#D6DFE6',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#FFFFFF',
  },
  filterButtonActive: {
    borderColor: '#0A84FF',
    backgroundColor: '#EAF4FF',
  },
  filterButtonText: {
    color: '#54677A',
    fontSize: 12,
    fontWeight: '600',
  },
  filterButtonTextActive: {
    color: '#0A84FF',
  },
  sportsList: {
    paddingBottom: 6,
    gap: 8,
  },
  sportChip: {
    borderWidth: 1,
    borderColor: '#D6DFE6',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#FFFFFF',
  },
  sportChipActive: {
    borderColor: '#0A84FF',
    backgroundColor: '#EAF4FF',
  },
  sportChipText: {
    color: '#54677A',
    fontSize: 12,
    fontWeight: '600',
  },
  sportChipTextActive: {
    color: '#0A84FF',
  },
  list: {
    paddingBottom: 20,
  },
  empty: {
    textAlign: 'center',
    color: '#7A8C9E',
    marginTop: 40,
  },
  backButton: {
    marginBottom: 12,
  },
  backText: {
    color: '#0A84FF',
    fontWeight: '700',
    fontSize: 13,
  },
});
