import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useAuth } from '../../auth/AuthContext';
import { ApiError } from '../../api/client';

export function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; api?: string }>({});

  function validate(): boolean {
    const next: typeof errors = {};
    if (!email.trim()) next.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) next.email = 'Enter a valid email';
    if (!password) next.password = 'Password is required';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleLogin() {
    if (!validate()) return;
    setLoading(true);
    setErrors({});
    try {
      await login(email.trim(), password);
      // Navigation handled automatically by ConsultantNavigator re-render
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'Login failed. Check your connection.';
      setErrors({ api: msg });
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.card}>
        <Text style={styles.title}>Consultant Login</Text>
        <Text style={styles.subtitle}>Realty Tunax — Antalya Real Estate Platform</Text>

        {errors.api && <Text style={styles.apiError}>{errors.api}</Text>}

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={[styles.input, errors.email ? styles.inputError : null]}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="you@example.com"
          editable={!loading}
        />
        {errors.email && <Text style={styles.fieldError}>{errors.email}</Text>}

        <Text style={styles.label}>Password</Text>
        <TextInput
          style={[styles.input, errors.password ? styles.inputError : null]}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="••••••••"
          editable={!loading}
        />
        {errors.password && <Text style={styles.fieldError}>{errors.password}</Text>}

        <Pressable
          style={[styles.btn, loading && styles.btnDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnText}>Sign In</Text>
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', justifyContent: 'center', padding: 24 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 24, elevation: 2, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8 },
  title: { fontSize: 24, fontWeight: '800', color: '#1a1a1a', marginBottom: 4 },
  subtitle: { fontSize: 13, color: '#888', marginBottom: 24 },
  label: { fontSize: 13, fontWeight: '600', color: '#555', marginBottom: 4 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, fontSize: 15, marginBottom: 4, backgroundColor: '#fafafa' },
  inputError: { borderColor: '#c62828' },
  fieldError: { fontSize: 12, color: '#c62828', marginBottom: 8 },
  apiError: { backgroundColor: '#ffebee', borderRadius: 6, padding: 10, marginBottom: 16, color: '#c62828', fontSize: 13 },
  btn: { backgroundColor: '#1976d2', borderRadius: 8, padding: 14, alignItems: 'center', marginTop: 8 },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
