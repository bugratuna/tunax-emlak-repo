import { SafeAreaView, Text, View } from 'react-native';

/**
 * Map view placeholder.
 * Phase 5: react-native-maps + bbox filter will be implemented here.
 */
export default function MapScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <Text style={{ fontSize: 22, fontWeight: '700', color: '#1a1a1a', marginBottom: 8 }}>
          Harita
        </Text>
        <Text style={{ color: '#888', textAlign: 'center', fontSize: 15 }}>
          Harita görünümü yakında geliyor
        </Text>
        <Text style={{ color: '#bbb', textAlign: 'center', fontSize: 12, marginTop: 6 }}>
          Phase 5 — Map View
        </Text>
      </View>
    </SafeAreaView>
  );
}
