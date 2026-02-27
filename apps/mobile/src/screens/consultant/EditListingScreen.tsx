import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { getListing, updateListing } from '../../api/listings';
import { ApiError } from '../../api/client';
import { Listing } from '../../types';
import { useAuth } from '../../auth/AuthContext';
import {
  INITIAL_FORM,
  FormErrors,
  FormState,
  toDto,
  validateForm,
} from './ListingFormFields';
import {
  SectionHeader,
  Field,
  OptionPicker,
  DistrictPicker,
} from './CreateListingScreen';
import { District } from '../../config';
import { Category, Currency, PropertyType } from '../../types';
import { ConsultantStackParamList } from '../../navigation';

type Props = NativeStackScreenProps<ConsultantStackParamList, 'EditListing'>;

function listingToForm(l: Listing): FormState {
  return {
    title: l.title ?? '',
    description: l.description ?? '',
    category: (l.category ?? '') as Category | '',
    propertyType: (l.propertyType ?? '') as PropertyType | '',
    priceAmount: l.price?.amount !== undefined ? String(l.price.amount) : '',
    priceCurrency: (l.price?.currency ?? 'TRY') as Currency,
    priceNegotiable: l.price?.isNegotiable ?? false,
    squareMeters: l.specifications?.squareMeters !== undefined ? String(l.specifications.squareMeters) : '',
    roomCount: l.specifications?.roomCount !== undefined ? String(l.specifications.roomCount) : '',
    bathroomCount: l.specifications?.bathroomCount !== undefined ? String(l.specifications.bathroomCount) : '',
    district: (l.location?.district ?? '') as District | '',
    neighborhood: l.location?.neighborhood ?? '',
    contactPhone: l.contact?.phone ?? '',
    contactWhatsapp: l.contact?.whatsapp ?? '',
    contactEmail: l.contact?.email ?? '',
  };
}

export function EditListingScreen({ route, navigation }: Props) {
  const { listingId } = route.params;
  const { user } = useAuth();

  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getListing(listingId)
      .then((l) => {
        setForm(listingToForm(l));
        navigation.setOptions({ title: `Edit: ${l.title.slice(0, 30)}` });
      })
      .catch((e) => {
        setLoadError(e instanceof ApiError ? e.message : 'Failed to load listing');
      })
      .finally(() => setLoading(false));
  }, [listingId, navigation]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  async function handleSave() {
    const errs = validateForm(form);
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setSaving(true);
    setApiError(null);
    try {
      await updateListing(listingId, toDto(form, user?.id));
      navigation.goBack();
    } catch (e) {
      setApiError(e instanceof ApiError ? e.message : 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  }

  async function handleReviewAndSubmit() {
    const errs = validateForm(form);
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setSaving(true);
    setApiError(null);
    try {
      await updateListing(listingId, toDto(form, user?.id));
      navigation.replace('SubmitConfirm', { listingId });
    } catch (e) {
      setApiError(e instanceof ApiError ? e.message : 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <ActivityIndicator style={styles.centered} size="large" />;

  if (loadError) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{loadError}</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {apiError && <Text style={styles.apiError}>{apiError}</Text>}

        <SectionHeader title="Basic Info" />
        <Field label="Title *" error={errors.title}>
          <TextInput style={[styles.input, errors.title && styles.inputError]} value={form.title} onChangeText={(v) => set('title', v)} placeholder="Min 10 characters" maxLength={200} />
        </Field>
        <Field label="Description *" error={errors.description}>
          <TextInput style={[styles.textarea, errors.description && styles.inputError]} value={form.description} onChangeText={(v) => set('description', v)} multiline numberOfLines={5} maxLength={5000} />
        </Field>

        <SectionHeader title="Classification" />
        <Field label="Category *" error={errors.category}>
          <OptionPicker options={['', 'RENT', 'SALE']} labels={['Select…', 'Rent', 'Sale']} value={form.category} onChange={(v) => set('category', v as Category | '')} />
        </Field>
        <Field label="Property Type *" error={errors.propertyType}>
          <OptionPicker
            options={['', 'APARTMENT', 'VILLA', 'HOUSE', 'LAND', 'COMMERCIAL', 'OTHER']}
            labels={['Select…', 'Apartment', 'Villa', 'House', 'Land', 'Commercial', 'Other']}
            value={form.propertyType}
            onChange={(v) => set('propertyType', v as PropertyType | '')}
          />
        </Field>

        <SectionHeader title="Price" />
        <Field label="Amount *" error={errors.priceAmount}>
          <TextInput style={[styles.input, errors.priceAmount && styles.inputError]} value={form.priceAmount} onChangeText={(v) => set('priceAmount', v)} keyboardType="numeric" />
        </Field>
        <Field label="Currency">
          <OptionPicker options={['TRY', 'USD', 'EUR']} labels={['₺ TRY', '$ USD', '€ EUR']} value={form.priceCurrency} onChange={(v) => set('priceCurrency', v as Currency)} />
        </Field>
        <Field label="Negotiable">
          <Switch value={form.priceNegotiable} onValueChange={(v) => set('priceNegotiable', v)} />
        </Field>

        <SectionHeader title="Specifications" />
        <Field label="Area m² *" error={errors.squareMeters}>
          <TextInput style={[styles.input, errors.squareMeters && styles.inputError]} value={form.squareMeters} onChangeText={(v) => set('squareMeters', v)} keyboardType="numeric" />
        </Field>
        <Field label="Rooms *" error={errors.roomCount}>
          <TextInput style={[styles.input, errors.roomCount && styles.inputError]} value={form.roomCount} onChangeText={(v) => set('roomCount', v)} keyboardType="numeric" />
        </Field>
        <Field label="Bathrooms *" error={errors.bathroomCount}>
          <TextInput style={[styles.input, errors.bathroomCount && styles.inputError]} value={form.bathroomCount} onChangeText={(v) => set('bathroomCount', v)} keyboardType="numeric" />
        </Field>

        <SectionHeader title="Location" />
        <Field label="District *" error={errors.district}>
          <DistrictPicker value={form.district} onChange={(v) => set('district', v as District | '')} />
        </Field>
        <Field label="Neighborhood *" error={errors.neighborhood}>
          <TextInput style={[styles.input, errors.neighborhood && styles.inputError]} value={form.neighborhood} onChangeText={(v) => set('neighborhood', v)} />
        </Field>

        <SectionHeader title="Contact (optional)" />
        <Field label="Phone">
          <TextInput style={styles.input} value={form.contactPhone} onChangeText={(v) => set('contactPhone', v)} keyboardType="phone-pad" />
        </Field>
        <Field label="WhatsApp">
          <TextInput style={styles.input} value={form.contactWhatsapp} onChangeText={(v) => set('contactWhatsapp', v)} keyboardType="phone-pad" />
        </Field>
        <Field label="Email">
          <TextInput style={styles.input} value={form.contactEmail} onChangeText={(v) => set('contactEmail', v)} keyboardType="email-address" autoCapitalize="none" />
        </Field>

        <View style={styles.actions}>
          <Pressable style={[styles.btnSecondary, saving && styles.btnDisabled]} onPress={handleSave} disabled={saving}>
            {saving ? <ActivityIndicator color="#1976d2" /> : <Text style={styles.btnSecondaryText}>Save Changes</Text>}
          </Pressable>
          <Pressable style={[styles.btnPrimary, saving && styles.btnDisabled]} onPress={handleReviewAndSubmit} disabled={saving}>
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnPrimaryText}>Review & Submit</Text>}
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { padding: 16, paddingBottom: 40 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  apiError: { backgroundColor: '#ffebee', borderRadius: 6, padding: 10, marginBottom: 12, color: '#c62828', fontSize: 13 },
  errorText: { color: '#c62828', fontSize: 16 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10, fontSize: 14, backgroundColor: '#fff' },
  textarea: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10, fontSize: 14, backgroundColor: '#fff', minHeight: 100, textAlignVertical: 'top' },
  inputError: { borderColor: '#c62828' },
  actions: { flexDirection: 'row', gap: 10, marginTop: 24 },
  btnPrimary: { flex: 1, backgroundColor: '#1976d2', borderRadius: 8, padding: 14, alignItems: 'center' },
  btnPrimaryText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  btnSecondary: { flex: 1, borderWidth: 2, borderColor: '#1976d2', borderRadius: 8, padding: 14, alignItems: 'center' },
  btnSecondaryText: { color: '#1976d2', fontSize: 15, fontWeight: '700' },
  btnDisabled: { opacity: 0.5 },
});
