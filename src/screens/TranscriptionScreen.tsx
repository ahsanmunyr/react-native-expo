import { useEffect, useRef } from 'react';
import { Animated, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Language, Segment, useTranscriptionStore } from '@/store/useTranscriptionStore';

// In production: replace simulation with real Socket.IO/SSE
// const socket = io(MUNSIT_API_URL);
// socket.on('transcript_word', appendWord);
// socket.on('transcript_flush', flushLive);

const PHRASES: Record<Language, string[]> = {
  en: [
    'Hello welcome to Munsit your AI transcription assistant',
    'The meeting is scheduled for tomorrow at three PM please confirm',
    'We need to finalize the project deliverables by end of this week',
    'Real time transcription is now available in Arabic and English',
    'Thank you for using our speech AI service powered by CNTXT',
  ],
  ar: [
    'مرحباً بك في مُنصت مساعدك الذكي للنسخ الصوتي',
    'تم جدولة الاجتماع غداً الساعة الثالثة مساءً يرجى التأكيد',
    'نحتاج إلى إنهاء مخرجات المشروع بنهاية هذا الأسبوع',
    'النسخ الفوري متاح الآن باللغتين العربية والإنجليزية',
    'شكراً لاستخدامك خدمة الذكاء الاصطناعي الصوتي من سي إن تي إكس تي',
  ],
};

const WORD_DELAY_MS = 280;
const PHRASE_GAP_MS = 1400;

export default function TranscriptionScreen() {
  const {
    segments, liveText, isRecording, language,
    appendWord, flushLive, setRecording, setLanguage, clear,
  } = useTranscriptionStore();

  const isRTL = language === 'ar';
  const listRef = useRef<FlatList>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const streamRef = useRef({ phraseIdx: 0, wordIdx: 0 });
  const languageRef = useRef(language);

  useEffect(() => { languageRef.current = language; }, [language]);

  // Pulsing red ring when recording
  useEffect(() => {
    if (!isRecording) { pulseAnim.setValue(1); return; }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.25, duration: 700, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [isRecording]);

  // Word-by-word streaming (simulates Socket.IO 'transcript_word' events)
  useEffect(() => {
    if (!isRecording) return;
    streamRef.current = { phraseIdx: 0, wordIdx: 0 };

    let timeout: ReturnType<typeof setTimeout>;

    const tick = () => {
      const lang = languageRef.current;
      const phrases = PHRASES[lang];
      const words = phrases[streamRef.current.phraseIdx % phrases.length].split(' ');

      if (streamRef.current.wordIdx < words.length) {
        appendWord(words[streamRef.current.wordIdx]);
        streamRef.current.wordIdx++;
        timeout = setTimeout(tick, WORD_DELAY_MS);
      } else {
        flushLive();
        streamRef.current.wordIdx = 0;
        streamRef.current.phraseIdx++;
        timeout = setTimeout(tick, PHRASE_GAP_MS);
      }
    };

    timeout = setTimeout(tick, 300);
    return () => clearTimeout(timeout);
  }, [isRecording]);

  // Auto-scroll to latest segment
  useEffect(() => {
    if (segments.length) listRef.current?.scrollToEnd({ animated: true });
  }, [segments.length, liveText]);

  // Flush on unmount
  useEffect(() => () => { flushLive(); setRecording(false); }, []);

  const toggleRecording = () => {
    if (isRecording) { flushLive(); setRecording(false); }
    else setRecording(true);
  };

  const renderSegment = ({ item }: { item: Segment }) => {
    const rtl = item.language === 'ar';
    return (
      <View style={[styles.segment, rtl && styles.segmentRTL]}>
        <Text style={[styles.segmentText, rtl && styles.textRTL]}>{item.text}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Language Toggle */}
      <View style={styles.header}>
        {(['en', 'ar'] as Language[]).map((lang) => (
          <Pressable
            key={lang}
            style={[styles.langBtn, language === lang && styles.langBtnActive]}
            onPress={() => setLanguage(lang)}>
            <Text style={[styles.langLabel, language === lang && styles.langLabelActive]}>
              {lang === 'en' ? 'English' : 'عربي'}
            </Text>
          </Pressable>
        ))}
        <Pressable style={styles.clearBtn} onPress={clear}>
          <Text style={styles.clearLabel}>Clear</Text>
        </Pressable>
      </View>

      {/* Transcript Area */}
      <FlatList
        ref={listRef}
        data={segments}
        keyExtractor={(item) => item.id}
        renderItem={renderSegment}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
              {isRTL ? 'اضغط على زر التسجيل للبدء' : 'Tap the button below to start'}
            </Text>
          </View>
        }
        ListFooterComponent={
          liveText ? (
            <View style={[styles.segment, styles.liveRow, isRTL && styles.segmentRTL]}>
              <Text style={[styles.segmentText, styles.liveText, isRTL && styles.textRTL]}>
                {liveText}
              </Text>
              <Text style={styles.cursor}>|</Text>
            </View>
          ) : null
        }
      />

      {/* Record Control */}
      <View style={styles.footer}>
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <Pressable
            style={[styles.recordBtn, isRecording && styles.recordBtnActive]}
            onPress={toggleRecording}>
            <View style={[styles.recordCore, isRecording && styles.recordCoreActive]} />
          </Pressable>
        </Animated.View>
        <Text style={styles.recordLabel}>
          {isRecording
            ? (isRTL ? 'جارٍ التسجيل...' : 'Recording...')
            : (isRTL ? 'اضغط للتسجيل' : 'Tap to record')}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e5e5e5',
  },
  langBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  langBtnActive: { backgroundColor: '#1a1a2e', borderColor: '#1a1a2e' },
  langLabel: { fontSize: 14, color: '#666' },
  langLabelActive: { color: '#fff', fontWeight: '600' },
  clearBtn: { marginLeft: 'auto', padding: 8 },
  clearLabel: { fontSize: 14, color: '#aaa' },

  listContent: { padding: 20, flexGrow: 1 },
  empty: { flex: 1, alignItems: 'center', paddingTop: 80 },
  emptyText: { color: '#bbb', fontSize: 16 },

  segment: { marginBottom: 14 },
  segmentRTL: { alignItems: 'flex-end' },
  segmentText: { fontSize: 18, color: '#111', lineHeight: 28 },
  textRTL: { textAlign: 'right', writingDirection: 'rtl' },

  liveRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  liveText: { color: '#555' },
  cursor: { color: '#007AFF', fontSize: 18, marginLeft: 1 },

  footer: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e5e5e5',
  },
  recordBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#f5f5f5',
    borderWidth: 3,
    borderColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordBtnActive: { borderColor: '#FF3B30', backgroundColor: '#fff5f5' },
  recordCore: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#FF3B30' },
  recordCoreActive: { borderRadius: 6 },
  recordLabel: { fontSize: 13, color: '#888' },
});
