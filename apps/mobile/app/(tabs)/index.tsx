import { SafeAreaView, Text, View } from 'react-native';

/**
 * Listings feed placeholder.
 * Phase 3: FlatList + ListingCard + infinite scroll will be implemented here.
 */
export default function FeedScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <Text style={{ fontSize: 22, fontWeight: '700', color: '#1a1a1a', marginBottom: 8 }}>
          İlanlar
        </Text>
        <Text style={{ color: '#888', textAlign: 'center', fontSize: 15 }}>
          İlan listesi yakında geliyor
        </Text>
        <Text style={{ color: '#bbb', textAlign: 'center', fontSize: 12, marginTop: 6 }}>
          Phase 3 — Listings Feed
        </Text>
      </View>
    </SafeAreaView>
  );
}
