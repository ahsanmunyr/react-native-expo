/**
 * INTERVIEW DEMO — Audio Recording & Playback with expo-av
 *
 * Covers what CNTXT will almost certainly ask about:
 *  1. Permissions (iOS + Android)
 *  2. AVAudioSession configuration (iOS — critical)
 *  3. Recording with real-time metering → amplitude bars
 *  4. Stop + playback of the recorded file
 *  5. Cleanup (unload sound, reset)
 */

import { Audio, AVPlaybackStatus } from 'expo-av';
import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

// ─── Types ────────────────────────────────────────────────────────────────────

type RecordingState = 'idle' | 'recording' | 'stopped';
type PlaybackState = 'idle' | 'playing' | 'paused';

// ─── Constants ────────────────────────────────────────────────────────────────

const BAR_COUNT = 30;
const METER_UPDATE_MS = 100;

// ─── Component ────────────────────────────────────────────────────────────────

export default function AudioDemoScreen() {
  const [permission, setPermission] = useState<boolean | null>(null);
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [playbackState, setPlaybackState] = useState<PlaybackState>('idle');
  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [amplitude, setAmplitude] = useState(0); // 0–1 normalised from dBFS

  const recordingRef = useRef<Audio.Recording | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Animated bars for the metering visualiser
  const barAnims = useRef(
    Array.from({ length: BAR_COUNT }, () => new Animated.Value(0.05))
  ).current;

  // ── Permissions ─────────────────────────────────────────────────────────────

  useEffect(() => {
    (async () => {
      const { granted } = await Audio.requestPermissionsAsync();
      setPermission(granted);
    })();
  }, []);

  // ── Amplitude → bar animations ──────────────────────────────────────────────

  useEffect(() => {
    barAnims.forEach((anim, i) => {
      const randomVariance = 0.3 + Math.random() * 0.7;
      Animated.timing(anim, {
        toValue: recordingState === 'recording' ? amplitude * randomVariance : 0.05,
        duration: METER_UPDATE_MS,
        useNativeDriver: false,
      }).start();
    });
  }, [amplitude, recordingState]);

  // ── Cleanup on unmount ───────────────────────────────────────────────────────

  useEffect(() => {
    return () => {
      stopTimer();
      recordingRef.current?.stopAndUnloadAsync().catch(() => {});
      soundRef.current?.unloadAsync().catch(() => {});
    };
  }, []);

  // ── Timer helpers ────────────────────────────────────────────────────────────

  const startTimer = () => {
    setElapsedSec(0);
    timerRef.current = setInterval(() => setElapsedSec((s) => s + 1), 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  };

  // ── Recording ────────────────────────────────────────────────────────────────

  const startRecording = async () => {
    if (!permission) return;

    try {
      // CRITICAL on iOS: configure AVAudioSession before recording
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,     // record even when phone is on silent
        staysActiveInBackground: false,
      });

      const rec = new Audio.Recording();

      await rec.prepareToRecordAsync({
        ...Audio.RecordingOptionsPresets.HIGH_QUALITY,
        isMeteringEnabled: true,          // needed for amplitude data
      });

      // Real-time metering callback — fires every ~100ms
      rec.setOnRecordingStatusUpdate((status) => {
        if (!status.isRecording) return;
        if (status.metering !== undefined) {
          // metering is dBFS: -160 (silence) → 0 (max)
          const normalised = Math.max(0, (status.metering + 60) / 60); // useful range: -60→0
          setAmplitude(normalised);
        }
      });

      rec.setProgressUpdateInterval(METER_UPDATE_MS);

      await rec.startAsync();
      recordingRef.current = rec;
      setRecordingState('recording');
      setRecordingUri(null);
      startTimer();
    } catch (err) {
      console.error('startRecording error:', err);
    }
  };

  const stopRecording = async () => {
    try {
      stopTimer();
      const rec = recordingRef.current;
      if (!rec) return;

      await rec.stopAndUnloadAsync();
      const uri = rec.getURI();
      recordingRef.current = null;

      // Restore audio session for playback after recording
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
      });

      setRecordingUri(uri ?? null);
      setRecordingState('stopped');
      setAmplitude(0);
    } catch (err) {
      console.error('stopRecording error:', err);
    }
  };

  // ── Playback ─────────────────────────────────────────────────────────────────

  const startPlayback = async () => {
    if (!recordingUri) return;
    try {
      // Unload previous sound if any
      await soundRef.current?.unloadAsync();

      const { sound } = await Audio.Sound.createAsync(
        { uri: recordingUri },
        { shouldPlay: true }
      );
      soundRef.current = sound;
      setPlaybackState('playing');

      sound.setOnPlaybackStatusUpdate((status: AVPlaybackStatus) => {
        if (!status.isLoaded) return;
        if (status.didJustFinish) {
          setPlaybackState('idle');
          sound.unloadAsync();
        }
      });
    } catch (err) {
      console.error('playback error:', err);
    }
  };

  const togglePlayback = async () => {
    const sound = soundRef.current;
    if (!sound) { await startPlayback(); return; }

    const status = await sound.getStatusAsync();
    if (!status.isLoaded) { await startPlayback(); return; }

    if (status.isPlaying) {
      await sound.pauseAsync();
      setPlaybackState('paused');
    } else {
      await sound.playAsync();
      setPlaybackState('playing');
    }
  };

  const reset = async () => {
    stopTimer();
    await soundRef.current?.unloadAsync();
    soundRef.current = null;
    setRecordingState('idle');
    setPlaybackState('idle');
    setRecordingUri(null);
    setElapsedSec(0);
    setAmplitude(0);
  };

  // ── Helpers ──────────────────────────────────────────────────────────────────

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  // ── Render ───────────────────────────────────────────────────────────────────

  if (permission === false) {
    return (
      <View style={styles.center}>
        <Text style={styles.permissionText}>Microphone permission denied.</Text>
        <Text style={styles.permissionSub}>Enable it in Settings → Privacy → Microphone.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* ── Section Label ─────────────────────────────────────── */}
      <Text style={styles.sectionLabel}>expo-av · Recording + Playback</Text>

      {/* ── Amplitude Visualiser ──────────────────────────────── */}
      <View style={styles.meterContainer}>
        {barAnims.map((anim, i) => (
          <Animated.View
            key={i}
            style={[
              styles.bar,
              {
                height: anim.interpolate({ inputRange: [0, 1], outputRange: [4, 72] }),
                backgroundColor: recordingState === 'recording' ? '#FF3B30' : '#E0E5EC',
              },
            ]}
          />
        ))}
      </View>

      {/* ── Timer ────────────────────────────────────────────── */}
      <Text style={styles.timer}>{formatTime(elapsedSec)}</Text>
      <Text style={styles.timerSub}>
        {recordingState === 'recording'
          ? 'Recording…'
          : recordingState === 'stopped'
          ? 'Ready to play'
          : 'Press record to start'}
      </Text>

      {/* ── Record Button ─────────────────────────────────────── */}
      <Pressable
        style={[styles.recordBtn, recordingState === 'recording' && styles.recordBtnActive]}
        onPress={recordingState === 'recording' ? stopRecording : startRecording}
        disabled={recordingState === 'stopped'}>
        <View style={[styles.recordCore, recordingState === 'recording' && styles.recordCoreActive]} />
      </Pressable>

      {/* ── Playback Row (shown after recording) ─────────────── */}
      {recordingState === 'stopped' && (
        <View style={styles.playbackRow}>
          <Pressable style={styles.playBtn} onPress={togglePlayback}>
            <Text style={styles.playIcon}>
              {playbackState === 'playing' ? '⏸' : '▶'}
            </Text>
          </Pressable>
          <Text style={styles.playLabel}>
            {playbackState === 'playing' ? 'Playing…' : playbackState === 'paused' ? 'Paused' : 'Play recording'}
          </Text>
          <Pressable style={styles.resetBtn} onPress={reset}>
            <Text style={styles.resetLabel}>Reset</Text>
          </Pressable>
        </View>
      )}

      {/* ── Code Notes (interview reference) ─────────────────── */}
      <View style={styles.codeNotes}>
        <Text style={styles.codeNotesTitle}>Key API calls (study these)</Text>
        {[
          'Audio.requestPermissionsAsync()',
          'Audio.setAudioModeAsync({ allowsRecordingIOS: true })',
          'rec.prepareToRecordAsync({ isMeteringEnabled: true })',
          'rec.setOnRecordingStatusUpdate(cb)  ← amplitude here',
          'rec.stopAndUnloadAsync() → rec.getURI()',
          'Audio.Sound.createAsync({ uri })',
          'sound.setOnPlaybackStatusUpdate(cb)',
          'sound.unloadAsync()  ← always unload!',
        ].map((line, i) => (
          <Text key={i} style={styles.codeLine}>
            {line}
          </Text>
        ))}
      </View>
    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { padding: 24, alignItems: 'center', gap: 20, paddingBottom: 60 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  permissionText: { fontSize: 18, fontWeight: '600', color: '#111', textAlign: 'center' },
  permissionSub: { fontSize: 14, color: '#888', marginTop: 8, textAlign: 'center' },

  sectionLabel: { fontSize: 13, color: '#999', letterSpacing: 1, textTransform: 'uppercase' },

  meterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 72,
    gap: 3,
  },
  bar: { width: 6, borderRadius: 3 },

  timer: { fontSize: 48, fontWeight: '200', color: '#111', fontVariant: ['tabular-nums'] },
  timerSub: { fontSize: 14, color: '#999', marginTop: -12 },

  recordBtn: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#ddd',
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordBtnActive: { borderColor: '#FF3B30', backgroundColor: '#fff5f5' },
  recordCore: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#FF3B30' },
  recordCoreActive: { borderRadius: 6, width: 26, height: 26 },

  playbackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: '#f8f8fa',
    padding: 16,
    borderRadius: 16,
    alignSelf: 'stretch',
  },
  playBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playIcon: { fontSize: 18, color: '#fff' },
  playLabel: { flex: 1, fontSize: 15, color: '#333' },
  resetBtn: { padding: 8 },
  resetLabel: { fontSize: 14, color: '#aaa' },

  codeNotes: {
    alignSelf: 'stretch',
    backgroundColor: '#1a1a2e',
    borderRadius: 14,
    padding: 18,
    gap: 8,
  },
  codeNotesTitle: { fontSize: 12, color: '#7a8ba8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  codeLine: { fontSize: 13, color: '#a8d8ff', fontFamily: 'monospace', lineHeight: 22 },
});
