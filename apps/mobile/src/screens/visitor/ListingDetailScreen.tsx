import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { getListing } from '../../api/listings';
import { ApiError } from '../../api/client';
import { Listing } from '../../types';
import { ListingsStackParamList } from '../../navigation';

type Props = NativeStackScreenProps<ListingsStackParamList, 'ListingDetail'>;

const CURRENCY_SYMBOL: Record<string, string> = { TRY: '₺', USD: '$', EUR: '€' };

export function ListingDetailScreen({ route, navigation }: Props) {
  const { listingId } = route.params;
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getListing(listingId)
      .then((l) => {
        setListing(l);
        navigation.setOptions({ title: l.title });
      })
      .catch((e) => {
        const msg = e instanceof ApiError ? e.message : 'Failed to load listing';
        setError(msg);
      })
      .finally(() => setLoading(false));
  }, [listingId, navigation]);

  if (loading) return <ActivityIndicator style={styles.centered} size="large" />;

  if (error || !listing) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error ?? 'Listing not found'}</Text>
      </View>
    );
  }

  const { price, specifications: specs, location, contact } = listing;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Title + Category + Type */}
      <Text style={styles.title}>{listing.title}</Text>
      <View style={styles.row}>
        {listing.category && <Chip text={listing.category} color="#1976d2" />}
        {listing.propertyType && <Chip text={listing.propertyType} color="#6a1a7a" />}
        <Chip text={listing.status.replace('_', ' ')} color="#455a64" />
      </View>

      {/* Price */}
      {price && (
        <View style={styles.section}>
          <Text style={styles.priceText}>
            {CURRENCY_SYMBOL[price.currency] ?? price.currency}{' '}
            {price.amount.toLocaleString()}
            {price.isNegotiable ? '  (negotiable)' : ''}
          </Text>
        </View>
      )}

      {/* Location */}
      {location && (
        <View style={styles.section}>
          <SectionTitle>Location</SectionTitle>
          <InfoRow label="District" value={location.district} />
          <InfoRow label="Neighborhood" value={location.neighborhood} />
          {location.address && <InfoRow label="Address" value={location.address} />}
          {location.lat !== undefined && (
            <InfoRow label="Coordinates" value={`${location.lat}, ${location.lng}`} />
          )}
        </View>
      )}

      {/* Specifications */}
      {specs && (
        <View style={styles.section}>
          <SectionTitle>Specifications</SectionTitle>
          <InfoRow label="Area" value={`${specs.squareMeters} m²`} />
          <InfoRow label="Rooms" value={String(specs.roomCount)} />
          <InfoRow label="Bathrooms" value={String(specs.bathroomCount)} />
          {specs.floorNumber !== undefined && (
            <InfoRow label="Floor" value={`${specs.floorNumber}${specs.totalFloors ? ` / ${specs.totalFloors}` : ''}`} />
          )}
          {specs.buildYear && <InfoRow label="Build Year" value={String(specs.buildYear)} />}
          <FeatureRow label="Furnished" value={specs.furnished} />
          <FeatureRow label="Balcony" value={specs.balcony} />
          <FeatureRow label="Parking" value={specs.parking} />
          <FeatureRow label="Elevator" value={specs.elevator} />
          <FeatureRow label="Pool" value={specs.pool} />
          <FeatureRow label="Sea View" value={specs.seaView} />
        </View>
      )}

      {/* Description */}
      {listing.description && (
        <View style={styles.section}>
          <SectionTitle>Description</SectionTitle>
          <Text style={styles.description}>{listing.description}</Text>
        </View>
      )}

      {/* Images count */}
      {listing.images && listing.images.length > 0 && (
        <View style={styles.section}>
          <SectionTitle>Photos</SectionTitle>
          <Text style={styles.infoValue}>{listing.images.length} photo(s) available</Text>
        </View>
      )}

      {/* Contact */}
      {contact && (
        <View style={styles.section}>
          <SectionTitle>Contact</SectionTitle>
          {contact.phone && <InfoRow label="Phone" value={contact.phone} />}
          {contact.whatsapp && <InfoRow label="WhatsApp" value={contact.whatsapp} />}
          {contact.email && <InfoRow label="Email" value={contact.email} />}
        </View>
      )}
    </ScrollView>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <Text style={styles.sectionTitle}>{children}</Text>;
}

function InfoRow({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function FeatureRow({ label, value }: { label: string; value?: boolean }) {
  if (value !== true) return null;
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, { color: '#2e7d32' }]}>Yes</Text>
    </View>
  );
}

function Chip({ text, color }: { text: string; color: string }) {
  return (
    <View style={[styles.chip, { backgroundColor: color }]}>
      <Text style={styles.chipText}>{text}</Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { padding: 16, paddingBottom: 40 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { color: '#c62828', fontSize: 16, textAlign: 'center' },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 8, color: '#1a1a1a' },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  chip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  chipText: { fontSize: 11, color: '#fff', fontWeight: '700' },
  priceText: { fontSize: 22, fontWeight: '800', color: '#1976d2' },
  section: {
    backgroundColor: '#fff', borderRadius: 8, padding: 12,
    marginBottom: 10, elevation: 1,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4,
  },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#888', textTransform: 'uppercase', marginBottom: 8, letterSpacing: 0.5 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4, borderBottomWidth: 1, borderColor: '#f0f0f0' },
  infoLabel: { fontSize: 14, color: '#555' },
  infoValue: { fontSize: 14, fontWeight: '600', color: '#1a1a1a' },
  description: { fontSize: 14, color: '#333', lineHeight: 22 },
});
