import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { RootStackParamList } from '@/App';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

const DEMOS: { route: keyof Omit<RootStackParamList, 'Home'>; title: string; subtitle: string }[] = [
  { route: 'Transcription', title: 'Live Transcription', subtitle: 'Arabic & English — RTL support' },
  { route: 'AudioDemo', title: 'Record & Playback', subtitle: 'expo-av · metering · AVAudioSession' },
  { route: 'AudioPlayer', title: 'Audio Player UI', subtitle: 'Waveform, seek, playback speed' },
  { route: 'Explore', title: 'Search & List', subtitle: 'Pagination, real API, search' },
];

export default function HomeScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.logoAr}>مُنصت</Text>
        <Text style={styles.logoEn}>Munsit</Text>
        <Text style={styles.byLine}>Interview Demo · CNTXT</Text>
      </View>

      <View style={styles.list}>
        {DEMOS.map((demo, i) => (
          <Pressable
            key={demo.route}
            style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
            onPress={() => navigation.navigate(demo.route as any)}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{i + 1}</Text>
            </View>
            <View style={styles.cardBody}>
              <Text style={styles.cardTitle}>{demo.title}</Text>
              <Text style={styles.cardSub}>{demo.subtitle}</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 24 },

  hero: { paddingVertical: 44, alignItems: 'center', gap: 4 },
  logoAr: { fontSize: 42, fontWeight: '700', color: '#1a1a2e' },
  logoEn: { fontSize: 18, color: '#888', letterSpacing: 2 },
  byLine: { marginTop: 8, fontSize: 12, color: '#bbb', letterSpacing: 1 },

  list: { gap: 12 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderRadius: 16,
    backgroundColor: '#f8f8fa',
    gap: 14,
  },
  cardPressed: { opacity: 0.6 },
  badge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#1a1a2e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  cardBody: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#111' },
  cardSub: { fontSize: 13, color: '#999', marginTop: 2 },
  chevron: { fontSize: 22, color: '#ccc', fontWeight: '300' },
});
