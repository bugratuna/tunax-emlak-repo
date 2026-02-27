import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { getListing, resubmitListing, submitListing } from '../../api/listings';
import { ApiError } from '../../api/client';
import { Listing } from '../../types';
import { ConsultantStackParamList } from '../../navigation';

type Props = NativeStackScreenProps<ConsultantStackParamList, 'SubmitConfirm'>;

const CURRENCY_SYMBOL: Record<string, string> = { TRY: '₺', USD: '$', EUR: '€' };

export function SubmitConfirmScreen({ route, navigation }: Props) {
  const { listingId } = route.params;
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    getListing(listingId)
      .then(setListing)
      .catch((e) => setLoadError(e instanceof ApiError ? e.message : 'Failed to load listing'))
      .finally(() => setLoading(false));
  }, [listingId]);

  async function handleSubmit() {
    if (!listing) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      // Use resubmit for NEEDS_CHANGES; submit for DRAFT
      if (listing.status === 'NEEDS_CHANGES') {
        await resubmitListing(listingId);
      } else {
        await submitListing(listingId);
      }
      // Go back to MyListings (pop the whole stack to root)
      navigation.popToTop();
    } catch (e) {
      setSubmitError(e instanceof ApiError ? e.message : 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <ActivityIndicator style={styles.centered} size="large" />;

  if (loadError || !listing) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{loadError ?? 'Listing not found'}</Text>
      </View>
    );
  }

  const isResubmission = listing.status === 'NEEDS_CHANGES';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>
        {isResubmission ? 'Confirm Resubmission' : 'Confirm Submission'}
      </Text>
      <Text style={styles.subheading}>
        {isResubmission
          ? 'Review your changes and resubmit for Admin review.'
          : 'Review your listing details before submitting for Admin review.'}
      </Text>

      {/* Summary card */}
      <View style={styles.card}>
        <Row label="Title" value={listing.title} />
        {listing.category && <Row label="Category" value={listing.category} />}
        {listing.propertyType && <Row label="Type" value={listing.propertyType} />}
        {listing.price && (
          <Row
            label="Price"
            value={`${CURRENCY_SYMBOL[listing.price.currency] ?? listing.price.currency} ${listing.price.amount.toLocaleString()}${listing.price.isNegotiable ? ' (neg.)' : ''}`}
          />
        )}
        {listing.specifications && (
          <>
            <Row label="Area" value={`${listing.specifications.squareMeters} m²`} />
            <Row label="Rooms" value={String(listing.specifications.roomCount)} />
          </>
        )}
        {listing.location && (
          <>
            <Row label="District" value={listing.location.district} />
            <Row label="Neighborhood" value={listing.location.neighborhood} />
          </>
        )}
      </View>

      {isResubmission && listing.moderationFeedback && (
        <View style={styles.feedbackBox}>
          <Text style={styles.feedbackLabel}>Previous admin feedback (now addressed):</Text>
          <Text style={styles.feedbackText}>{listing.moderationFeedback}</Text>
        </View>
      )}

      <View style={styles.infoBox}>
        <Text style={styles.infoText}>
          Once submitted, your listing will be locked for editing until the Admin completes
          their review.
        </Text>
      </View>

      {submitError && <Text style={styles.errorText}>{submitError}</Text>}

      <View style={styles.actions}>
        <Pressable
          style={[styles.btnSecondary, submitting && styles.btnDisabled]}
          onPress={() => navigation.goBack()}
          disabled={submitting}
        >
          <Text style={styles.btnSecondaryText}>Go Back</Text>
        </Pressable>
        <Pressable
          style={[styles.btnPrimary, submitting && styles.btnDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnPrimaryText}>
              {isResubmission ? 'Resubmit' : 'Submit for Review'}
            </Text>
          )}
        </Pressable>
      </View>
    </ScrollView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { padding: 20, paddingBottom: 40 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  heading: { fontSize: 22, fontWeight: '800', color: '#1a1a1a', marginBottom: 6 },
  subheading: { fontSize: 14, color: '#666', marginBottom: 20, lineHeight: 20 },
  card: {
    backgroundColor: '#fff', borderRadius: 10, padding: 14,
    marginBottom: 14, elevation: 1,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderColor: '#f0f0f0' },
  rowLabel: { fontSize: 14, color: '#666' },
  rowValue: { fontSize: 14, fontWeight: '600', color: '#1a1a1a', maxWidth: '65%', textAlign: 'right' },
  feedbackBox: { backgroundColor: '#fff3e0', borderRadius: 8, padding: 12, marginBottom: 14 },
  feedbackLabel: { fontSize: 12, fontWeight: '700', color: '#e65100', marginBottom: 4 },
  feedbackText: { fontSize: 13, color: '#bf360c', lineHeight: 18 },
  infoBox: { backgroundColor: '#e3f2fd', borderRadius: 8, padding: 12, marginBottom: 14 },
  infoText: { fontSize: 13, color: '#1565c0', lineHeight: 18 },
  errorText: { color: '#c62828', marginBottom: 12, fontSize: 13 },
  actions: { flexDirection: 'row', gap: 10 },
  btnPrimary: { flex: 1, backgroundColor: '#1976d2', borderRadius: 8, padding: 14, alignItems: 'center' },
  btnPrimaryText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  btnSecondary: { flex: 1, borderWidth: 2, borderColor: '#9e9e9e', borderRadius: 8, padding: 14, alignItems: 'center' },
  btnSecondaryText: { color: '#555', fontSize: 15, fontWeight: '600' },
  btnDisabled: { opacity: 0.5 },
});
