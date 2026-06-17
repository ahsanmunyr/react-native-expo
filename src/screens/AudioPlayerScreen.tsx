import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';

const DURATION = 183; // 3:03
const BAR_COUNT = 40;

// Fixed waveform shape — random but stable across renders
const WAVEFORM_HEIGHTS = Array.from({ length: BAR_COUNT }, (_, i) => {
  const base = Math.sin(i * 0.4) * 0.3 + 0.5;
  const noise = ((i * 13 + 7) % 10) / 10 * 0.4;
  return Math.min(1, Math.max(0.08, base + noise));
});

function formatTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

export default function AudioPlayerScreen() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

  const barAnims = useRef(WAVEFORM_HEIGHTS.map((h) => new Animated.Value(h))).current;
  const animLoopRef = useRef<Animated.CompositeAnimation | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startWaveAnimation = () => {
    const animations = barAnims.map((anim, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: 0.15 + Math.random() * 0.85,
            duration: 150 + (i % 7) * 60,
            useNativeDriver: false,
          }),
          Animated.timing(anim, {
            toValue: WAVEFORM_HEIGHTS[i],
            duration: 150 + (i % 5) * 70,
            useNativeDriver: false,
          }),
        ])
      )
    );
    animLoopRef.current = Animated.parallel(animations);
    animLoopRef.current.start();
  };

  const stopWaveAnimation = () => {
    animLoopRef.current?.stop();
    barAnims.forEach((anim, i) =>
      Animated.timing(anim, { toValue: WAVEFORM_HEIGHTS[i], duration: 300, useNativeDriver: false }).start()
    );
  };

  useEffect(() => {
    if (isPlaying) {
      startWaveAnimation();
      intervalRef.current = setInterval(() => {
        setCurrentTime((t) => {
          if (t >= DURATION) { setIsPlaying(false); return DURATION; }
          return t + 1;
        });
      }, 1000);
    } else {
      stopWaveAnimation();
      if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isPlaying]);

  const seek = (delta: number) =>
    setCurrentTime((t) => Math.min(DURATION, Math.max(0, t + delta)));

  const progress = currentTime / DURATION;

  return (
    <View style={styles.container}>
      {/* Track Info */}
      <View style={styles.trackCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>م</Text>
        </View>
        <Text style={styles.trackTitle}>Team Meeting Recording</Text>
        <Text style={styles.trackMeta}>اجتماع الفريق — 17 يونيو 2026</Text>
      </View>

      {/* Waveform */}
      <View style={styles.waveformContainer}>
        {barAnims.map((anim, i) => {
          const isPast = i / BAR_COUNT <= progress;
          return (
            <Animated.View
              key={i}
              style={[
                styles.bar,
                {
                  height: anim.interpolate({ inputRange: [0, 1], outputRange: [3, 72] }),
                  backgroundColor: isPast ? '#007AFF' : '#E0E5EC',
                },
              ]}
            />
          );
        })}
      </View>

      {/* Time Row */}
      <View style={styles.timeRow}>
        <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
        <Text style={styles.timeText}>{formatTime(DURATION)}</Text>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { flex: progress }]} />
        <View style={{ flex: 1 - progress }} />
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <Pressable style={styles.secondaryBtn} onPress={() => seek(-15)}>
          <Text style={styles.secondaryBtnText}>−15s</Text>
        </Pressable>

        <Pressable
          style={[styles.playBtn, currentTime >= DURATION && styles.playBtnDisabled]}
          onPress={() => { if (currentTime >= DURATION) { setCurrentTime(0); } setIsPlaying((p) => !p); }}>
          <Text style={styles.playIcon}>{isPlaying ? '⏸' : '▶'}</Text>
        </Pressable>

        <Pressable style={styles.secondaryBtn} onPress={() => seek(15)}>
          <Text style={styles.secondaryBtnText}>+15s</Text>
        </Pressable>
      </View>

      {/* Speed & options row */}
      <View style={styles.optionsRow}>
        {['0.75×', '1×', '1.5×', '2×'].map((speed) => (
          <Pressable key={speed} style={[styles.speedBtn, speed === '1×' && styles.speedBtnActive]}>
            <Text style={[styles.speedText, speed === '1×' && styles.speedTextActive]}>{speed}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', paddingHorizontal: 28, justifyContent: 'center', gap: 20 },

  trackCard: { alignItems: 'center', gap: 10 },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#1a1a2e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { fontSize: 36, color: '#fff' },
  trackTitle: { fontSize: 20, fontWeight: '700', color: '#111' },
  trackMeta: { fontSize: 14, color: '#999' },

  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 72,
    gap: 2.5,
    justifyContent: 'center',
  },
  bar: { width: 4.5, borderRadius: 3 },

  timeRow: { flexDirection: 'row', justifyContent: 'space-between' },
  timeText: { fontSize: 13, color: '#999', fontVariant: ['tabular-nums'] },

  progressTrack: { height: 3, borderRadius: 2, backgroundColor: '#E0E5EC', flexDirection: 'row', overflow: 'hidden' },
  progressFill: { backgroundColor: '#007AFF', minWidth: 0 },

  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 28 },
  secondaryBtn: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryBtnText: { fontSize: 12, fontWeight: '600', color: '#444' },
  playBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playBtnDisabled: { backgroundColor: '#aaa' },
  playIcon: { fontSize: 26, color: '#fff' },

  optionsRow: { flexDirection: 'row', justifyContent: 'center', gap: 10 },
  speedBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
    backgroundColor: '#f5f5f5',
  },
  speedBtnActive: { backgroundColor: '#1a1a2e' },
  speedText: { fontSize: 13, color: '#666' },
  speedTextActive: { color: '#fff', fontWeight: '600' },
});
