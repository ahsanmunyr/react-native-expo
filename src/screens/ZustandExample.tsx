/**
 * Zustand Example
 *
 * Zustand = lightweight global state. Same concept as Redux but no boilerplate.
 *
 * Redux Toolkit equivalent comparison:
 *
 *   RTK:                          Zustand:
 *   createSlice(...)           →  create((set) => ({ ... }))
 *   dispatch(increment())      →  useStore.getState().increment()
 *   useSelector(s => s.count)  →  useCounterStore(s => s.count)
 *   configureStore(...)        →  no store setup needed
 *   Provider wrapping          →  no Provider needed
 *
 * Zustand shines for:
 *   - Small-medium apps
 *   - Shared UI state (modal open, theme, user session)
 *   - When RTK feels like too much ceremony
 *
 * RTK shines for:
 *   - Large teams (enforces structure)
 *   - Complex state with many interdependencies
 *   - When you need Redux DevTools, middleware, time-travel debugging
 */

import { create } from 'zustand';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

// ─── Store 1: Counter (simplest possible store) ───────────────────────────────
// This is the "Hello World" of Zustand.

type CounterStore = {
  count: number;
  increment: () => void;
  decrement: () => void;
  reset: () => void;
  incrementBy: (amount: number) => void;
};

const useCounterStore = create<CounterStore>((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
  decrement: () => set((state) => ({ count: state.count - 1 })),
  reset: () => set({ count: 0 }),
  incrementBy: (amount) => set((state) => ({ count: state.count + amount })),
}));

// ─── Store 2: User / Auth store (real-world pattern) ─────────────────────────
// This is closer to what you'd use in a real app for auth state.

type User = { id: string; name: string; role: 'admin' | 'user' };

type AuthStore = {
  user: User | null;
  isLoggedIn: boolean;
  login: (user: User) => void;
  logout: () => void;
  updateName: (name: string) => void;
};

const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isLoggedIn: false,

  login: (user) => set({ user, isLoggedIn: true }),

  logout: () => set({ user: null, isLoggedIn: false }),

  // Partial update — set() merges, doesn't replace the whole state
  updateName: (name) =>
    set((state) => ({
      user: state.user ? { ...state.user, name } : null,
    })),
}));

// ─── Store 3: Theme store (shows how multiple components share state) ─────────

type ThemeStore = {
  isDark: boolean;
  toggle: () => void;
};

const useThemeStore = create<ThemeStore>((set) => ({
  isDark: false,
  toggle: () => set((state) => ({ isDark: !state.isDark })),
}));

// ─── Components (each subscribes to only what it needs) ───────────────────────

// Component only re-renders when `count` changes — not when other state changes
function CounterDisplay() {
  const count = useCounterStore((state) => state.count); // selector
  return (
    <Text style={styles.countDisplay}>{count}</Text>
  );
}

// This component only re-renders when actions change (they never do — stable refs)
function CounterButtons() {
  const { increment, decrement, reset, incrementBy } = useCounterStore();
  return (
    <View style={styles.btnRow}>
      <Pressable style={styles.btn} onPress={decrement}>
        <Text style={styles.btnText}>−1</Text>
      </Pressable>
      <Pressable style={styles.btn} onPress={increment}>
        <Text style={styles.btnText}>+1</Text>
      </Pressable>
      <Pressable style={[styles.btn, styles.btnBlue]} onPress={() => incrementBy(10)}>
        <Text style={styles.btnText}>+10</Text>
      </Pressable>
      <Pressable style={[styles.btn, styles.btnGray]} onPress={reset}>
        <Text style={styles.btnText}>Reset</Text>
      </Pressable>
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

const DEMO_USER: User = { id: '1', name: 'Ahsan Munir', role: 'admin' };

export default function ZustandExample() {
  const { user, isLoggedIn, login, logout } = useAuthStore();
  const { isDark, toggle } = useThemeStore();

  const bg = isDark ? '#1a1a2e' : '#fff';
  const text = isDark ? '#fff' : '#111';

  return (
    <ScrollView style={[styles.container, { backgroundColor: bg }]}
      contentContainerStyle={{ paddingBottom: 40 }}>

      {/* ── Store 1: Counter ─────────────────────────────────────────── */}
      <Text style={[styles.sectionLabel, { color: isDark ? '#aaa' : '#999' }]}>
        STORE 1 — Counter (simplest store)
      </Text>
      <View style={[styles.card, { backgroundColor: isDark ? '#2a2a3e' : '#F8F8FA' }]}>
        <CounterDisplay />
        <CounterButtons />
        <View style={styles.codeBox}>
          <Text style={styles.code}>
            {'const useCounterStore = create((set) => ({\n'}
            {'  count: 0,\n'}
            {'  increment: () => set(s => ({ count: s.count + 1 })),\n'}
            {'}))\n\n'}
            {'// In component:\n'}
            {'const count = useCounterStore(s => s.count)\n'}
            {'const { increment } = useCounterStore()'}
          </Text>
        </View>
      </View>

      {/* ── Store 2: Auth ─────────────────────────────────────────────── */}
      <Text style={[styles.sectionLabel, { color: isDark ? '#aaa' : '#999' }]}>
        STORE 2 — Auth / User state
      </Text>
      <View style={[styles.card, { backgroundColor: isDark ? '#2a2a3e' : '#F8F8FA' }]}>
        {isLoggedIn && user ? (
          <>
            <View style={styles.userRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{user.name[0]}</Text>
              </View>
              <View>
                <Text style={[styles.userName, { color: text }]}>{user.name}</Text>
                <Text style={styles.userRole}>{user.role}</Text>
              </View>
            </View>
            <Pressable style={[styles.btn, styles.btnRed]} onPress={logout}>
              <Text style={styles.btnText}>Logout</Text>
            </Pressable>
          </>
        ) : (
          <Pressable style={[styles.btn, styles.btnBlue]} onPress={() => login(DEMO_USER)}>
            <Text style={styles.btnText}>Login as Ahsan</Text>
          </Pressable>
        )}
        <View style={styles.codeBox}>
          <Text style={styles.code}>
            {'const useAuthStore = create((set) => ({\n'}
            {'  user: null,\n'}
            {'  login: (user) => set({ user, isLoggedIn: true }),\n'}
            {'  logout: () => set({ user: null, isLoggedIn: false }),\n'}
            {'}))\n\n'}
            {'// Any component, anywhere:\n'}
            {'const { user, logout } = useAuthStore()'}
          </Text>
        </View>
      </View>

      {/* ── Store 3: Theme ────────────────────────────────────────────── */}
      <Text style={[styles.sectionLabel, { color: isDark ? '#aaa' : '#999' }]}>
        STORE 3 — Theme (shared across all components)
      </Text>
      <View style={[styles.card, { backgroundColor: isDark ? '#2a2a3e' : '#F8F8FA' }]}>
        <Text style={[styles.themeLabel, { color: text }]}>
          Current theme: {isDark ? '🌙 Dark' : '☀️ Light'}
        </Text>
        <Pressable style={[styles.btn, styles.btnBlue]} onPress={toggle}>
          <Text style={styles.btnText}>Toggle Theme</Text>
        </Pressable>
        <View style={styles.codeBox}>
          <Text style={styles.code}>
            {'// No Provider needed — works globally\n'}
            {'const { isDark, toggle } = useThemeStore()\n\n'}
            {'// Read state outside a component:\n'}
            {'useThemeStore.getState().isDark\n\n'}
            {'// Subscribe outside React:\n'}
            {'useThemeStore.subscribe(state => console.log(state))'}
          </Text>
        </View>
      </View>

      {/* ── RTK vs Zustand comparison ─────────────────────────────────── */}
      <View style={styles.compareBox}>
        <Text style={styles.compareTitle}>RTK vs Zustand — what to say</Text>
        <Text style={styles.compareText}>
          {'"I use RTK in production at OSN — it enforces structure which matters\n'}
          {'on a big team. Zustand I used in this demo for the transcription store.\n'}
          {'Same concept: global reactive state with subscriptions. Zustand has\n'}
          {'no actions/reducers — just set(). I\'d pick RTK for large teams,\n'}
          {'Zustand for solo or small projects where ceremony slows you down."'}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 8,
  },
  card: { marginHorizontal: 12, borderRadius: 14, padding: 16, gap: 12 },

  countDisplay: { fontSize: 64, fontWeight: '200', textAlign: 'center', color: '#007AFF' },

  btnRow: { flexDirection: 'row', gap: 8, justifyContent: 'center' },
  btn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#1a1a2e',
    alignItems: 'center',
  },
  btnBlue: { backgroundColor: '#007AFF' },
  btnGray: { backgroundColor: '#8E8E93' },
  btnRed: { backgroundColor: '#FF3B30' },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  userRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { color: '#fff', fontSize: 20, fontWeight: '700' },
  userName: { fontSize: 16, fontWeight: '600' },
  userRole: { fontSize: 13, color: '#888' },

  themeLabel: { fontSize: 16, fontWeight: '600', textAlign: 'center' },

  codeBox: { backgroundColor: '#1a1a2e', borderRadius: 8, padding: 12 },
  code: { color: '#a8d8ff', fontFamily: 'monospace', fontSize: 11, lineHeight: 19 },

  compareBox: {
    margin: 12,
    marginTop: 20,
    backgroundColor: '#1a1a2e',
    borderRadius: 14,
    padding: 16,
    gap: 8,
  },
  compareTitle: { color: '#fff', fontWeight: '700', fontSize: 14 },
  compareText: { color: '#a8d8ff', fontFamily: 'monospace', fontSize: 11, lineHeight: 19 },
});
