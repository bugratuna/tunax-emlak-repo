import { Alert, Pressable, SafeAreaView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/store/authStore';
import { logoutApi } from '../../src/services/auth';
import { ROLE_LABELS } from '@tunax/shared';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  async function handleLogout() {
    Alert.alert('Çıkış Yap', 'Hesabınızdan çıkmak istediğinize emin misiniz?', [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Çıkış Yap',
        style: 'destructive',
        onPress: async () => {
          await logoutApi(); // fire-and-forget to backend
          await logout(); // clear SecureStore + Zustand state
          // AuthGuard in _layout.tsx detects isAuthenticated = false and redirects
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
      <View style={{ flex: 1, padding: 24 }}>
        <Text style={{ fontSize: 22, fontWeight: '700', color: '#1a1a1a', marginBottom: 24 }}>
          Profil
        </Text>

        {user && (
          <View
            style={{
              backgroundColor: '#fff',
              borderRadius: 12,
              padding: 16,
              marginBottom: 24,
              elevation: 1,
            }}
          >
            <Text style={{ fontSize: 15, color: '#555', marginBottom: 6 }}>{user.email}</Text>
            <Text style={{ fontSize: 13, color: '#888' }}>
              Rol: {ROLE_LABELS[user.role] ?? user.role}
            </Text>
          </View>
        )}

        {user?.role === 'CONSULTANT' && (
          <Pressable
            onPress={() => router.push('/consultant')}
            style={{
              backgroundColor: '#1976d2',
              borderRadius: 8,
              padding: 14,
              alignItems: 'center',
              marginBottom: 12,
            }}
          >
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>
              Danışman Paneli
            </Text>
          </Pressable>
        )}

        {user?.role === 'ADMIN' && (
          <Pressable
            onPress={() => router.push('/admin')}
            style={{
              backgroundColor: '#7b1fa2',
              borderRadius: 8,
              padding: 14,
              alignItems: 'center',
              marginBottom: 12,
            }}
          >
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Admin Paneli</Text>
          </Pressable>
        )}

        <Pressable
          onPress={handleLogout}
          style={{
            backgroundColor: '#c62828',
            borderRadius: 8,
            padding: 14,
            alignItems: 'center',
            marginTop: 'auto',
          }}
        >
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Çıkış Yap</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
