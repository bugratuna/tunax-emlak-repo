import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { getListings } from '../../api/listings';
import { ApiError } from '../../api/client';
import { Category, Listing, PropertyType } from '../../types';
import { DISTRICTS, District } from '../../config';
import { ListingsStackParamList } from '../../navigation';

type Props = NativeStackScreenProps<ListingsStackParamList, 'ListingList'>;

const PROPERTY_TYPES: PropertyType[] = [
  'APARTMENT', 'VILLA', 'HOUSE', 'LAND', 'COMMERCIAL', 'OTHER',
];

const STATUS_COLOR: Record<string, string> = {
  PUBLISHED: '#2e7d32',
  DRAFT: '#757575',
  PENDING_REVIEW: '#f57c00',
  NEEDS_CHANGES: '#c62828',
  REJECTED: '#6a1a1a',
  ARCHIVED: '#455a64',
};

function StatusBadge({ status }: { status: string }) {
  return (
    <View style={[styles.badge, { backgroundColor: STATUS_COLOR[status] ?? '#757575' }]}>
      <Text style={styles.badgeText}>{status.replace('_', ' ')}</Text>
    </View>
  );
}

export function ListingListScreen({ navigation }: Props) {
  const [listings, setListings] = useState<Listing[]>([]);
  const [nextCursor, setNextCursor] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [category, setCategory] = useState<Category | ''>('');
  const [propertyType, setPropertyType] = useState<PropertyType | ''>('');
  const [district, setDistrict] = useState<District | ''>('');

  const loadListings = useCallback(
    async (cursor?: string) => {
      try {
        const res = await getListings({
          status: 'PUBLISHED',
          category: category || undefined,
          propertyType: propertyType || undefined,
          district: district || undefined,
          cursor,
          limit: 20,
        });
        if (cursor) {
          setListings((prev) => [...prev, ...res.items]);
        } else {
          setListings(res.items);
        }
        setNextCursor(res.nextCursor);
        setError(null);
      } catch (e) {
        const msg = e instanceof ApiError ? e.message : 'Failed to load listings';
        setError(msg);
      }
    },
    [category, propertyType, district],
  );

  useEffect(() => {
    setLoading(true);
    loadListings().finally(() => setLoading(false));
  }, [loadListings]);

  const handleLoadMore = async () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    await loadListings(nextCursor);
    setLoadingMore(false);
  };

  const renderItem = ({ item }: { item: Listing }) => (
    <Pressable
      style={styles.card}
      onPress={() => navigation.push('ListingDetail', { listingId: item.id })}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <StatusBadge status={item.status} />
      </View>

      {item.price && (
        <Text style={styles.cardPrice}>
          {item.price.currency} {item.price.amount.toLocaleString()}
          {item.price.isNegotiable ? ' (neg.)' : ''}
        </Text>
      )}

      <View style={styles.cardMeta}>
        {item.location?.district && (
          <Text style={styles.metaText}>{item.location.district}</Text>
        )}
        {item.propertyType && (
          <Text style={styles.metaText}>{item.propertyType}</Text>
        )}
        {item.specifications?.squareMeters && (
          <Text style={styles.metaText}>{item.specifications.squareMeters} m²</Text>
        )}
        {item.specifications?.roomCount !== undefined && (
          <Text style={styles.metaText}>{item.specifications.roomCount} rooms</Text>
        )}
      </View>
    </Pressable>
  );

  return (
    <View style={styles.container}>
      {/* Filter bar */}
      <View style={styles.filters}>
        <FilterChips
          label="Category"
          options={['', 'RENT', 'SALE']}
          value={category}
          onChange={(v) => setCategory(v as Category | '')}
        />
        <FilterChips
          label="Type"
          options={['', ...PROPERTY_TYPES]}
          value={propertyType}
          onChange={(v) => setPropertyType(v as PropertyType | '')}
        />
        <DistrictPicker value={district} onChange={(v) => setDistrict(v as District | '')} />
      </View>

      {loading && <ActivityIndicator style={styles.centered} size="large" />}

      {!loading && error && (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable style={styles.retryBtn} onPress={() => loadListings()}>
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
          ListEmptyComponent={<Text style={styles.emptyText}>No listings found.</Text>}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            loadingMore ? <ActivityIndicator style={{ margin: 16 }} /> : null
          }
        />
      )}
    </View>
  );
}

// ─── Small sub-components ─────────────────────────────────────────────────────

function FilterChips({
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <View style={styles.chipRow}>
      {options.map((opt) => (
        <Pressable
          key={opt || 'all'}
          style={[styles.chip, value === opt && styles.chipActive]}
          onPress={() => onChange(opt)}
        >
          <Text style={[styles.chipText, value === opt && styles.chipTextActive]}>
            {opt || 'All'}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

function DistrictPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <View>
      <Pressable style={styles.districtBtn} onPress={() => setOpen((o) => !o)}>
        <Text style={styles.districtBtnText}>{value || 'All Districts'} ▾</Text>
      </Pressable>
      {open && (
        <View style={styles.districtDropdown}>
          {['', ...DISTRICTS].map((d) => (
            <Pressable
              key={d || 'all'}
              style={styles.districtItem}
              onPress={() => {
                onChange(d);
                setOpen(false);
              }}
            >
              <Text>{d || 'All Districts'}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  filters: { backgroundColor: '#fff', padding: 8, borderBottomWidth: 1, borderColor: '#e0e0e0' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginBottom: 4 },
  chip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, backgroundColor: '#e0e0e0' },
  chipActive: { backgroundColor: '#1976d2' },
  chipText: { fontSize: 12, color: '#333' },
  chipTextActive: { color: '#fff' },
  districtBtn: { paddingHorizontal: 10, paddingVertical: 6, backgroundColor: '#e0e0e0', borderRadius: 6 },
  districtBtnText: { fontSize: 12 },
  districtDropdown: {
    position: 'absolute', top: 32, left: 0, right: 0, zIndex: 10,
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#ccc', borderRadius: 6,
    maxHeight: 200, overflow: 'scroll',
  },
  districtItem: { padding: 10, borderBottomWidth: 1, borderColor: '#eee' },
  list: { padding: 8 },
  card: {
    backgroundColor: '#fff', borderRadius: 8, padding: 12,
    marginBottom: 8, elevation: 1,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
  cardTitle: { flex: 1, fontSize: 15, fontWeight: '600', marginRight: 8 },
  cardPrice: { fontSize: 14, color: '#1976d2', fontWeight: '700', marginBottom: 4 },
  cardMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  metaText: { fontSize: 12, color: '#666', backgroundColor: '#f0f0f0', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  badge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  badgeText: { fontSize: 10, color: '#fff', fontWeight: '700' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { color: '#c62828', textAlign: 'center', marginBottom: 12 },
  retryBtn: { backgroundColor: '#1976d2', paddingHorizontal: 20, paddingVertical: 8, borderRadius: 6 },
  retryText: { color: '#fff', fontWeight: '600' },
  emptyText: { color: '#888', fontSize: 16 },
});
