import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';
import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

type RecordingState = 'idle' | 'recording' | 'stopped';

const BAR_COUNT = 30;
const METER_INTERVAL_MS = 100;

export default function AudioDemoScreen() {
  const [permission, setPermission] = useState<boolean | null>(null);
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [playbackState, setPlaybackState] = useState<'idle' | 'playing' | 'paused'>('idle');

  // expo-audio hooks (SDK 56 — replaces expo-av)
  const recorder = useAudioRecorder({ ...RecordingPresets.HIGH_QUALITY, isMeteringEnabled: true });
  const recorderState = useAudioRecorderState(recorder, METER_INTERVAL_MS);
  const player = useAudioPlayer(null); // starts with no source; replace() after recording
  const playerStatus = useAudioPlayerStatus(player);

  // Animated bars for the metering visualiser
  const barAnims = useRef(
    Array.from({ length: BAR_COUNT }, () => new Animated.Value(0.05))
  ).current;

  // ── Permissions ────────────────────────────────────────────────────────────

  useEffect(() => {
    requestRecordingPermissionsAsync().then(({ granted }) => setPermission(granted));
  }, []);

  // ── Metering → bar animations ──────────────────────────────────────────────

  const amplitude =
    recorderState.metering !== undefined
      ? Math.max(0, (recorderState.metering + 60) / 60)
      : 0;

  useEffect(() => {
    barAnims.forEach((anim) => {
      const variance = 0.3 + Math.random() * 0.7;
      Animated.timing(anim, {
        toValue: recordingState === 'recording' ? amplitude * variance : 0.05,
        duration: METER_INTERVAL_MS,
        useNativeDriver: false,
      }).start();
    });
  }, [amplitude, recordingState]);

  // ── Load recorded file into player after stop ──────────────────────────────

  useEffect(() => {
    if (recordingState === 'stopped' && recorder.uri) {
      player.replace({ uri: recorder.uri });
    }
  }, [recordingState]);

  // ── Track playback completion ──────────────────────────────────────────────

  useEffect(() => {
    if (
      playerStatus.isLoaded &&
      playerStatus.currentTime > 0 &&
      playerStatus.currentTime >= playerStatus.duration
    ) {
      setPlaybackState('idle');
    }
  }, [playerStatus.currentTime, playerStatus.duration]);

  // ── Recording ──────────────────────────────────────────────────────────────

  const startRecording = async () => {
    if (!permission) return;
    try {
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      recorder.record();
      setRecordingState('recording');
    } catch (err) {
      console.error('startRecording error:', err);
    }
  };

  const stopRecording = async () => {
    try {
      await recorder.stop();
      await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
      setRecordingState('stopped');
    } catch (err) {
      console.error('stopRecording error:', err);
    }
  };

  // ── Playback ───────────────────────────────────────────────────────────────

  const togglePlayback = () => {
    if (player.playing) {
      player.pause();
      setPlaybackState('paused');
    } else {
      player.play();
      setPlaybackState('playing');
    }
  };

  const reset = () => {
    player.pause();
    setRecordingState('idle');
    setPlaybackState('idle');
  };

  // ── Helpers ────────────────────────────────────────────────────────────────

  const formatTime = (s: number) =>
    `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, '0')}`;

  const elapsedSec = Math.floor(recorderState.durationMillis / 1000);

  // ── Render ─────────────────────────────────────────────────────────────────

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
      <Text style={styles.sectionLabel}>expo-audio · Recording + Playback</Text>

      {/* Amplitude Bars */}
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

      {/* Timer */}
      <Text style={styles.timer}>
        {recordingState === 'stopped'
          ? formatTime(playerStatus.currentTime)
          : formatTime(elapsedSec)}
      </Text>
      <Text style={styles.timerSub}>
        {recordingState === 'recording'
          ? 'Recording…'
          : recordingState === 'stopped'
          ? `Duration: ${formatTime(playerStatus.duration)}`
          : 'Press record to start'}
      </Text>

      {/* Record Button */}
      <Pressable
        style={[styles.recordBtn, recordingState === 'recording' && styles.recordBtnActive]}
        onPress={recordingState === 'recording' ? stopRecording : startRecording}
        disabled={recordingState === 'stopped'}>
        <View style={[styles.recordCore, recordingState === 'recording' && styles.recordCoreActive]} />
      </Pressable>

      {/* Playback Row */}
      {recordingState === 'stopped' && (
        <View style={styles.playbackRow}>
          <Pressable style={styles.playBtn} onPress={togglePlayback}>
            <Text style={styles.playIcon}>{playbackState === 'playing' ? '⏸' : '▶'}</Text>
          </Pressable>
          <Text style={styles.playLabel}>
            {playbackState === 'playing'
              ? 'Playing…'
              : playbackState === 'paused'
              ? 'Paused'
              : 'Play recording'}
          </Text>
          <Pressable style={styles.resetBtn} onPress={reset}>
            <Text style={styles.resetLabel}>Reset</Text>
          </Pressable>
        </View>
      )}

      {/* API Reference — useful during interview */}
      <View style={styles.codeNotes}>
        <Text style={styles.codeNotesTitle}>expo-audio API (SDK 56)</Text>
        {[
          'requestRecordingPermissionsAsync()',
          'setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true })',
          'recorder.prepareToRecordAsync()  ← before every record()',
          'recorder.record()               ← starts recording',
          'await recorder.stop()           ← recorder.uri ready after',
          'useAudioRecorderState(rec, ms)  ← state.metering for amplitude',
          'useAudioPlayer(null)            ← no initial source',
          'player.replace({ uri })         ← load recorded file',
          'player.play() / player.pause()',
          'useAudioPlayerStatus(player)    ← currentTime, duration',
        ].map((line, i) => (
          <Text key={i} style={styles.codeLine}>
            {line}
          </Text>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, alignItems: 'center', gap: 20, paddingBottom: 60 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  permissionText: { fontSize: 18, fontWeight: '600', color: '#111', textAlign: 'center' },
  permissionSub: { fontSize: 14, color: '#888', marginTop: 8, textAlign: 'center' },

  sectionLabel: { fontSize: 13, color: '#999', letterSpacing: 1, textTransform: 'uppercase' },

  meterContainer: { flexDirection: 'row', alignItems: 'center', height: 72, gap: 3 },
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
  codeNotesTitle: {
    fontSize: 12,
    color: '#7a8ba8',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  codeLine: { fontSize: 12, color: '#a8d8ff', fontFamily: 'monospace', lineHeight: 22 },
});
