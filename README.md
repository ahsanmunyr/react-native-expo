# Munsit — Interview Demo App

Built for the CNTXT/Munsit interview. Demonstrates real React Native skills across audio recording, live transcription, RTL support, and real-API data fetching.

**Stack:** Expo SDK 56 · React Navigation · Zustand · expo-audio · TypeScript

---

## Screens

### 1. Live Transcription (`src/screens/TranscriptionScreen.tsx`)
- Word-by-word streaming simulation using `setTimeout` recursion
- Language toggle: English ↔ Arabic with full RTL support (`writingDirection: 'rtl'`, `I18nManager`)
- Zustand store for transcription state (`src/store/useTranscriptionStore.ts`)
- Animated pulse on record button, `FlatList` with auto-scroll to latest word
- Demonstrates: Zustand, RTL, stale closure fix via `useRef`, `Animated`

### 2. Record & Playback (`src/screens/AudioDemoScreen.tsx`)
- Full `expo-audio` recording pipeline (SDK 56 — expo-av was deprecated/broken in SDK 56)
- `useAudioRecorder` + `useAudioRecorderState` for real-time metering (dBFS → 0–1 amplitude bars)
- `useAudioPlayer` + `player.replace(uri)` for playback after recording
- `setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true })` for AVAudioSession config
- Demonstrates: expo-audio hooks, AVAudioSession, Animated bars, hook-based lifecycle

### 3. Audio Player UI (`src/screens/AudioPlayerScreen.tsx`)
- Waveform visualiser with `Animated.parallel` loop while playing
- Seek ±15s, playback speed buttons, bilingual track info (Arabic + English)
- Progress bar using flex ratio — no external slider dependency
- Demonstrates: Animated, stable refs for intervals, `Animated.CompositeAnimation`

### 4. Search & Explore (`src/screens/ExploreScreen.tsx`)
- Real API: `dummyjson.com/products/search` with debounced search and pagination
- `FlatList` with `onEndReached` for infinite scroll
- Demonstrates: real API integration, pagination, controlled text input

---

## Architecture

```
src/
  App.tsx                    ← NavigationContainer, Stack.Navigator
  screens/
    HomeScreen.tsx           ← Menu with numbered cards
    TranscriptionScreen.tsx  ← Live transcription + RTL
    AudioDemoScreen.tsx      ← Record, meter, playback (expo-audio)
    AudioPlayerScreen.tsx    ← Waveform player UI
    ExploreScreen.tsx        ← Search + pagination
  store/
    useTranscriptionStore.ts ← Zustand store (segments, liveText, language)
```

Pattern: **Feature-based layout + custom hook logic separation**, same as production myosntv app. Screen components are pure UI; all logic lives in stores or hooks.

---

## Getting Started

### Prerequisites
- Node 18+
- Xcode 16 (for iOS simulator)
- CocoaPods

### Install

```bash
npm install
```

### Run on iOS simulator (first time or after installing new packages)

```bash
npx expo prebuild
cd ios && pod install && cd ..
npx expo run:ios
```

### Run on iOS simulator (after first build)

```bash
npx expo run:ios
```

> **Note:** Use `expo run:ios` — not `expo start`. This project uses native modules (`expo-audio`) that require a development build, not Expo Go.

### Common error: `Cannot find native module 'ExponentAV'` or build failure

Run a clean prebuild to regenerate the ios folder with all current packages:

```bash
npx expo prebuild
npx expo run:ios
```

---

## Interview Prep Guide

Open `interview-prep.html` in a browser. Covers:
- Personal pitch (4 beats)
- Honest depth table for all technologies on your CV
- Audio deep-dive (expo-audio, AVAudioSession, dBFS)
- Architecture patterns (MVVM via hooks, Service Layer, Redux Middleware)
- JS Core, Async JS, React patterns, ES6+, TypeScript
- Questions to ask at the end of the interview

---

## Key Tech Decisions

| Decision | Why |
|---|---|
| Zustand over Redux | Minimal boilerplate, synchronous reads with `get()`, no Provider needed |
| `useRef` for language in streaming | Avoids stale closure in `setTimeout` recursion |
| `Animated` (not Reanimated) | No worklet complexity needed for these animations; bridge is fine |
| `FlatList` not `FlashList` | Simple lists; FlashList's fixed-height requirement adds friction |
| Real dummyjson API | Shows real network + pagination, not hardcoded mock data |
