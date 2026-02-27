import React, { useState } from 'react';
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

import { createListing } from '../../api/listings';
import { ApiError } from '../../api/client';
import { useAuth } from '../../auth/AuthContext';
import {
  INITIAL_FORM,
  FormErrors,
  FormState,
  toDto,
  validateForm,
} from './ListingFormFields';
import { DISTRICTS, District } from '../../config';
import { Category, Currency, PropertyType } from '../../types';
import { ConsultantStackParamList } from '../../navigation';

type Props = NativeStackScreenProps<ConsultantStackParamList, 'CreateListing'>;

export function CreateListingScreen({ navigation }: Props) {
  const { user } = useAuth();
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  async function handleSaveDraft() {
    const errs = validateForm(form);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setSaving(true);
    setApiError(null);
    try {
      await createListing(toDto(form, user?.id));
      navigation.goBack();
    } catch (e) {
      setApiError(e instanceof ApiError ? e.message : 'Failed to save listing');
    } finally {
      setSaving(false);
    }
  }

  async function handleReviewAndSubmit() {
    const errs = validateForm(form);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setSaving(true);
    setApiError(null);
    try {
      const listing = await createListing(toDto(form, user?.id));
      navigation.replace('SubmitConfirm', { listingId: listing.id });
    } catch (e) {
      setApiError(e instanceof ApiError ? e.message : 'Failed to save listing');
    } finally {
      setSaving(false);
    }
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
          <TextInput style={[styles.textarea, errors.description && styles.inputError]} value={form.description} onChangeText={(v) => set('description', v)} placeholder="Min 50 characters" multiline numberOfLines={5} maxLength={5000} />
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
          <TextInput style={[styles.input, errors.priceAmount && styles.inputError]} value={form.priceAmount} onChangeText={(v) => set('priceAmount', v)} keyboardType="numeric" placeholder="0" />
        </Field>
        <Field label="Currency">
          <OptionPicker options={['TRY', 'USD', 'EUR']} labels={['₺ TRY', '$ USD', '€ EUR']} value={form.priceCurrency} onChange={(v) => set('priceCurrency', v as Currency)} />
        </Field>
        <Field label="Negotiable">
          <Switch value={form.priceNegotiable} onValueChange={(v) => set('priceNegotiable', v)} />
        </Field>

        <SectionHeader title="Specifications" />
        <Field label="Area m² *" error={errors.squareMeters}>
          <TextInput style={[styles.input, errors.squareMeters && styles.inputError]} value={form.squareMeters} onChangeText={(v) => set('squareMeters', v)} keyboardType="numeric" placeholder="0" />
        </Field>
        <Field label="Rooms *" error={errors.roomCount}>
          <TextInput style={[styles.input, errors.roomCount && styles.inputError]} value={form.roomCount} onChangeText={(v) => set('roomCount', v)} keyboardType="numeric" placeholder="0" />
        </Field>
        <Field label="Bathrooms *" error={errors.bathroomCount}>
          <TextInput style={[styles.input, errors.bathroomCount && styles.inputError]} value={form.bathroomCount} onChangeText={(v) => set('bathroomCount', v)} keyboardType="numeric" placeholder="0" />
        </Field>

        <SectionHeader title="Location" />
        <Field label="District *" error={errors.district}>
          <DistrictPicker value={form.district} onChange={(v) => set('district', v as District | '')} />
        </Field>
        <Field label="Neighborhood *" error={errors.neighborhood}>
          <TextInput style={[styles.input, errors.neighborhood && styles.inputError]} value={form.neighborhood} onChangeText={(v) => set('neighborhood', v)} placeholder="Mahalle" />
        </Field>

        <SectionHeader title="Contact (optional)" />
        <Field label="Phone">
          <TextInput style={styles.input} value={form.contactPhone} onChangeText={(v) => set('contactPhone', v)} keyboardType="phone-pad" placeholder="+90 555 000 0000" />
        </Field>
        <Field label="WhatsApp">
          <TextInput style={styles.input} value={form.contactWhatsapp} onChangeText={(v) => set('contactWhatsapp', v)} keyboardType="phone-pad" placeholder="+90 555 000 0000" />
        </Field>
        <Field label="Email">
          <TextInput style={styles.input} value={form.contactEmail} onChangeText={(v) => set('contactEmail', v)} keyboardType="email-address" autoCapitalize="none" placeholder="contact@example.com" />
        </Field>

        <View style={styles.actions}>
          <Pressable style={[styles.btnSecondary, saving && styles.btnDisabled]} onPress={handleSaveDraft} disabled={saving}>
            {saving ? <ActivityIndicator color="#1976d2" /> : <Text style={styles.btnSecondaryText}>Save Draft</Text>}
          </Pressable>
          <Pressable style={[styles.btnPrimary, saving && styles.btnDisabled]} onPress={handleReviewAndSubmit} disabled={saving}>
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnPrimaryText}>Review & Submit</Text>}
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ─── Shared UI sub-components ─────────────────────────────────────────────────

export function SectionHeader({ title }: { title: string }) {
  return <Text style={styles.sectionHeader}>{title}</Text>;
}

export function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {children}
      {error && <Text style={styles.fieldError}>{error}</Text>}
    </View>
  );
}

export function OptionPicker({ options, labels, value, onChange }: { options: string[]; labels?: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <View style={styles.optionRow}>
      {options.map((opt, i) => (
        <Pressable key={opt || 'empty'} style={[styles.optionChip, value === opt && styles.optionChipActive]} onPress={() => onChange(opt)}>
          <Text style={[styles.optionText, value === opt && styles.optionTextActive]}>{(labels?.[i] ?? opt) || 'All'}</Text>
        </Pressable>
      ))}
    </View>
  );
}

export function DistrictPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <View>
      <Pressable style={styles.selectBtn} onPress={() => setOpen((o) => !o)}>
        <Text style={styles.selectBtnText}>{value || 'Select district…'} ▾</Text>
      </Pressable>
      {open && (
        <View style={styles.dropdown}>
          <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled>
            {DISTRICTS.map((d) => (
              <Pressable key={d} style={styles.dropdownItem} onPress={() => { onChange(d); setOpen(false); }}>
                <Text>{d}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { padding: 16, paddingBottom: 40 },
  apiError: { backgroundColor: '#ffebee', borderRadius: 6, padding: 10, marginBottom: 12, color: '#c62828', fontSize: 13 },
  sectionHeader: { fontSize: 12, fontWeight: '700', color: '#888', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 20, marginBottom: 8 },
  field: { marginBottom: 12 },
  label: { fontSize: 13, fontWeight: '600', color: '#555', marginBottom: 4 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10, fontSize: 14, backgroundColor: '#fff' },
  textarea: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10, fontSize: 14, backgroundColor: '#fff', minHeight: 100, textAlignVertical: 'top' },
  inputError: { borderColor: '#c62828' },
  fieldError: { fontSize: 12, color: '#c62828', marginTop: 2 },
  optionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  optionChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: '#e0e0e0', borderWidth: 1, borderColor: 'transparent' },
  optionChipActive: { backgroundColor: '#e3f2fd', borderColor: '#1976d2' },
  optionText: { fontSize: 13, color: '#333' },
  optionTextActive: { color: '#1976d2', fontWeight: '700' },
  selectBtn: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10, backgroundColor: '#fff' },
  selectBtnText: { fontSize: 14, color: '#333' },
  dropdown: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, backgroundColor: '#fff', overflow: 'hidden', marginTop: 2 },
  dropdownItem: { padding: 12, borderBottomWidth: 1, borderColor: '#f0f0f0' },
  actions: { flexDirection: 'row', gap: 10, marginTop: 24 },
  btnPrimary: { flex: 1, backgroundColor: '#1976d2', borderRadius: 8, padding: 14, alignItems: 'center' },
  btnPrimaryText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  btnSecondary: { flex: 1, borderWidth: 2, borderColor: '#1976d2', borderRadius: 8, padding: 14, alignItems: 'center' },
  btnSecondaryText: { color: '#1976d2', fontSize: 15, fontWeight: '700' },
  btnDisabled: { opacity: 0.5 },
});
