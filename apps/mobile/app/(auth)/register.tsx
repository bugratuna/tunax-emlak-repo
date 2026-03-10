import { SafeAreaView, Text, View } from 'react-native';

/**
 * Register screen placeholder.
 * Phase 2A implementation: fields + pending-approval state.
 * NO role selection — backend enforces CONSULTANT role for all self-registrations.
 */
export default function RegisterScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: 8, color: '#1a1a1a' }}>
          Kayıt Ol
        </Text>
        <Text style={{ color: '#888', textAlign: 'center' }}>
          Phase 2A — Kayıt formu yakında geliyor
        </Text>
      </View>
    </SafeAreaView>
  );
}
