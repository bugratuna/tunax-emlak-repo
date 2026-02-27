import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { getListings } from '../../api/listings';
import { ApiError } from '../../api/client';
import { Listing, ListingStatus } from '../../types';
import { useAuth } from '../../auth/AuthContext';
import { ConsultantStackParamList } from '../../navigation';

type Props = NativeStackScreenProps<ConsultantStackParamList, 'MyListings'>;

const STATUS_COLOR: Record<ListingStatus, string> = {
  DRAFT: '#757575',
  PENDING_REVIEW: '#f57c00',
  NEEDS_CHANGES: '#c62828',
  PUBLISHED: '#2e7d32',
  REJECTED: '#6a1a1a',
  ARCHIVED: '#455a64',
};

const EDITABLE_STATUSES: ListingStatus[] = ['DRAFT', 'NEEDS_CHANGES'];

export function MyListingsScreen({ navigation }: Props) {
  const { user, logout } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await getListings({ consultantId: user?.id });
      setListings(res.items);
      setError(null);
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'Failed to load listings';
      setError(msg);
    }
  }, [user?.id]);

  useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
  }, [load]);

  // Refresh when returning to this screen
  useEffect(() => {
    const unsub = navigation.addListener('focus', () => {
      load();
    });
    return unsub;
  }, [navigation, load]);

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable onPress={logout} style={{ marginRight: 4 }}>
          <Text style={{ color: '#c62828', fontWeight: '600' }}>Logout</Text>
        </Pressable>
      ),
    });
  }, [navigation, logout]);

  function canEdit(status: ListingStatus): boolean {
    return EDITABLE_STATUSES.includes(status);
  }

  const renderItem = ({ item }: { item: Listing }) => (
    <Pressable
      style={[styles.card, !canEdit(item.status) && styles.cardReadOnly]}
      onPress={() => {
        if (canEdit(item.status)) {
          navigation.push('EditListing', { listingId: item.id });
        }
      }}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <View style={[styles.badge, { backgroundColor: STATUS_COLOR[item.status] }]}>
          <Text style={styles.badgeText}>{item.status.replace('_', ' ')}</Text>
        </View>
      </View>

      {item.price && (
        <Text style={styles.cardPrice}>
          {item.price.currency} {item.price.amount.toLocaleString()}
        </Text>
      )}

      {item.status === 'NEEDS_CHANGES' && item.moderationFeedback && (
        <View style={styles.feedbackBox}>
          <Text style={styles.feedbackLabel}>Admin feedback:</Text>
          <Text style={styles.feedbackText} numberOfLines={3}>
            {item.moderationFeedback}
          </Text>
        </View>
      )}

      {canEdit(item.status) && (
        <Text style={styles.tapHint}>Tap to edit →</Text>
      )}
    </Pressable>
  );

  return (
    <View style={styles.container}>
      {loading && <ActivityIndicator style={styles.centered} size="large" />}

      {!loading && error && (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable style={styles.retryBtn} onPress={load}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      )}

      {!loading && !error && (
        <FlatList
          data={listings}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={listings.length === 0 ? styles.centered : styles.list}
          ListEmptyComponent={<Text style={styles.emptyText}>No listings yet.</Text>}
        />
      )}

      {/* FAB */}
      <Pressable style={styles.fab} onPress={() => navigation.push('CreateListing')}>
        <Text style={styles.fabText}>+</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: 8, paddingBottom: 80 },
  card: {
    backgroundColor: '#fff', borderRadius: 8, padding: 12,
    marginBottom: 8, elevation: 1,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4,
  },
  cardReadOnly: { opacity: 0.75 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
  cardTitle: { flex: 1, fontSize: 15, fontWeight: '600', marginRight: 8 },
  cardPrice: { fontSize: 14, color: '#1976d2', fontWeight: '700', marginBottom: 4 },
  badge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  badgeText: { fontSize: 10, color: '#fff', fontWeight: '700' },
  feedbackBox: { backgroundColor: '#fff3e0', borderRadius: 6, padding: 8, marginTop: 6 },
  feedbackLabel: { fontSize: 11, fontWeight: '700', color: '#e65100', marginBottom: 2 },
  feedbackText: { fontSize: 12, color: '#bf360c' },
  tapHint: { fontSize: 11, color: '#1976d2', marginTop: 4, textAlign: 'right' },
  errorText: { color: '#c62828', textAlign: 'center', marginBottom: 12 },
  retryBtn: { backgroundColor: '#1976d2', paddingHorizontal: 20, paddingVertical: 8, borderRadius: 6 },
  retryText: { color: '#fff', fontWeight: '600' },
  emptyText: { color: '#888', fontSize: 16 },
  fab: {
    position: 'absolute', bottom: 24, right: 24,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: '#1976d2', alignItems: 'center', justifyContent: 'center',
    elevation: 4, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 6,
  },
  fabText: { fontSize: 28, color: '#fff', lineHeight: 30 },
});
