import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { login } from '../../src/services/auth';
import { useAuthStore } from '../../src/store/authStore';
import { parseJwt } from '../../src/lib/jwt';
import { extractApiError } from '../../src/services/client';

export default function LoginScreen() {
  const router = useRouter();
  const setUserFromJwt = useAuthStore((s) => s.setUserFromJwt);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin() {
    if (!email.trim() || !password) {
      setError('E-posta ve şifre zorunludur.');
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const res = await login(email.trim().toLowerCase(), password);
      const payload = parseJwt(res.accessToken);

      if (!payload) {
        setError('Sunucu yanıtı geçersiz. Lütfen tekrar deneyin.');
        return;
      }

      setUserFromJwt(payload);
      // AuthGuard in _layout.tsx will handle the redirect to /(tabs)
    } catch (e) {
      const err = extractApiError(e);
      if (err.status === 403) {
        // PENDING_APPROVAL or SUSPENDED — show backend message verbatim
        setError(err.message);
      } else if (err.status === 401) {
        setError('E-posta veya şifre hatalı.');
      } else {
        setError('Bağlantı hatası, lütfen tekrar deneyin.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
      <KeyboardAvoidingView
        style={{ flex: 1, justifyContent: 'center', padding: 24 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 24, elevation: 2 }}>
          <Text style={{ fontSize: 26, fontWeight: '800', color: '#1a1a1a', marginBottom: 4 }}>
            Realty Tunax
          </Text>
          <Text style={{ color: '#888', marginBottom: 28, fontSize: 14 }}>
            Hesabınıza giriş yapın
          </Text>

          {error && (
            <View
              style={{
                backgroundColor: '#ffebee',
                borderRadius: 8,
                padding: 12,
                marginBottom: 16,
              }}
            >
              <Text style={{ color: '#c62828', fontSize: 13, lineHeight: 18 }}>{error}</Text>
            </View>
          )}

          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="E-posta adresi"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!loading}
            style={{
              borderWidth: 1,
              borderColor: '#ddd',
              borderRadius: 8,
              padding: 13,
              fontSize: 15,
              marginBottom: 12,
              backgroundColor: '#fafafa',
            }}
          />

          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Şifre"
            secureTextEntry
            editable={!loading}
            onSubmitEditing={handleLogin}
            returnKeyType="done"
            style={{
              borderWidth: 1,
              borderColor: '#ddd',
              borderRadius: 8,
              padding: 13,
              fontSize: 15,
              marginBottom: 22,
              backgroundColor: '#fafafa',
            }}
          />

          <Pressable
            onPress={handleLogin}
            disabled={loading}
            style={{
              backgroundColor: '#1976d2',
              borderRadius: 8,
              padding: 15,
              alignItems: 'center',
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>Giriş Yap</Text>
            )}
          </Pressable>

          <Pressable
            onPress={() => router.push('/(auth)/register')}
            style={{ marginTop: 16, alignItems: 'center' }}
          >
            <Text style={{ color: '#1976d2', fontSize: 14 }}>
              Hesabınız yok mu? Kayıt olun
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
