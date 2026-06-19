/**
 * React.lazy + Suspense Example
 *
 * What it does:
 *   React.lazy(() => import('./SomeComponent'))
 *   → Component is NOT bundled with the main JS. It loads on demand.
 *   → While loading, Suspense shows the fallback (spinner).
 *   → Once loaded, the component renders.
 *
 * In React Native / Expo:
 *   - React.lazy works for components within the JS bundle
 *   - For screens: React Navigation lazy-loads by default (built-in)
 *   - Best use case: heavy modals, charts, rich text editors, camera views
 *     that most users never open — don't pay the load cost upfront
 *
 * We simulate a "slow" component by adding an artificial delay in the import.
 *
 * Bonus — ErrorBoundary:
 *   Suspense handles loading state.
 *   ErrorBoundary (class component) handles the error state.
 *   Always pair them together in production.
 */

import React, { Suspense, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

// ─── Simulate a heavy component that takes 2s to load ────────────────────────
// In real apps: import('./HeavyChart') or import('./VideoPlayer')
// Here: we fake the delay with a Promise so you can see Suspense working

const HeavyDashboard = React.lazy(
  () =>
    new Promise<{ default: React.ComponentType }>((resolve) =>
      setTimeout(
        () =>
          resolve({
            default: function Dashboard() {
              return (
                <View style={styles.dashboard}>
                  <Text style={styles.dashTitle}>Dashboard Loaded ✓</Text>
                  <Text style={styles.dashSub}>
                    This component was lazy-loaded.{"\n"}
                    It was NOT in the initial bundle.{"\n"}
                    It loaded on demand when you pressed the button.
                  </Text>
                  <View style={styles.statsRow}>
                    {[
                      { label: "Users", value: "12,483" },
                      { label: "Revenue", value: "$84K" },
                      { label: "Uptime", value: "99.9%" },
                    ].map((s) => (
                      <View key={s.label} style={styles.statBox}>
                        <Text style={styles.statValue}>{s.value}</Text>
                        <Text style={styles.statLabel}>{s.label}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              );
            },
          }),
        2000, // 2 second fake load time
      ),
    ),
);

// ─── ErrorBoundary (must be a class component — React requirement) ────────────
// Suspense = handles loading state
// ErrorBoundary = handles error state (network failure, import error, etc.)

type EBState = { hasError: boolean; error: string };

class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  EBState
> {
  state: EBState = { hasError: false, error: "" };

  static getDerivedStateFromError(error: Error): EBState {
    return { hasError: true, error: error.message };
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

// ─── Loading Fallback ─────────────────────────────────────────────────────────

function LoadingSpinner() {
  return (
    <View style={styles.loadingBox}>
      <ActivityIndicator size="large" color="#007AFF" />
      <Text style={styles.loadingText}>Loading dashboard…</Text>
      <Text style={styles.loadingSub}>This is the Suspense fallback</Text>
    </View>
  );
}

// ─── Error Fallback ───────────────────────────────────────────────────────────

function ErrorFallback() {
  return (
    <View style={styles.errorBox}>
      <Text style={styles.errorIcon}>⚠</Text>
      <Text style={styles.errorText}>Failed to load component</Text>
      <Text style={styles.errorSub}>This is the ErrorBoundary fallback</Text>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function SuspenseExample() {
  const [show, setShow] = useState(false);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>React.lazy + Suspense</Text>
      <Text style={styles.subtitle}>
        Component loads on demand. Suspense shows fallback while loading.
      </Text>

      {/* Code breakdown */}
      <View style={styles.codeBox}>
        <Text style={styles.code}>
          {"// 1. Wrap import() with React.lazy\n"}
          {"const HeavyDashboard = React.lazy(\n"}
          {'  () => import("./HeavyDashboard")\n'}
          {")\n\n"}
          {"// 2. Wrap with Suspense + ErrorBoundary\n"}
          {"<ErrorBoundary fallback={<ErrorFallback />}>\n"}
          {"  <Suspense fallback={<Spinner />}>\n"}
          {"    <HeavyDashboard />\n"}
          {"  </Suspense>\n"}
          {"</ErrorBoundary>"}
        </Text>
      </View>

      {!show ? (
        <Pressable style={styles.loadBtn} onPress={() => setShow(true)}>
          <Text style={styles.loadBtnText}>Load Dashboard (2s delay)</Text>
        </Pressable>
      ) : (
        // ErrorBoundary wraps Suspense — always pair them
        <ErrorBoundary fallback={<ErrorFallback />}>
          <Suspense fallback={<LoadingSpinner />}>
            <HeavyDashboard />
          </Suspense>
        </ErrorBoundary>
      )}

      <View style={styles.note}>
        <Text style={styles.noteText}>
          {"Suspense fallback  → shows while component loads\n"}
          {"ErrorBoundary      → shows if import() fails\n"}
          {"React Navigation   → lazy-loads screens automatically\n"}
          {"Best for           → heavy modals, charts, camera, rich editors"}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
  title: { fontSize: 22, fontWeight: "700", color: "#1a1a2e", marginBottom: 4 },
  subtitle: { fontSize: 13, color: "#888", marginBottom: 16 },

  codeBox: {
    backgroundColor: "#1a1a2e",
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
  },
  code: {
    color: "#a8d8ff",
    fontFamily: "monospace",
    fontSize: 11,
    lineHeight: 19,
  },

  loadBtn: {
    backgroundColor: "#007AFF",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginBottom: 16,
  },
  loadBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },

  loadingBox: {
    alignItems: "center",
    padding: 32,
    gap: 12,
    backgroundColor: "#F8F8FA",
    borderRadius: 12,
  },
  loadingText: { fontSize: 16, fontWeight: "600", color: "#333" },
  loadingSub: { fontSize: 12, color: "#007AFF" },

  errorBox: {
    alignItems: "center",
    padding: 32,
    gap: 8,
    backgroundColor: "#FFF0F0",
    borderRadius: 12,
  },
  errorIcon: { fontSize: 32 },
  errorText: { fontSize: 16, fontWeight: "600", color: "#FF3B30" },
  errorSub: { fontSize: 12, color: "#FF3B30" },

  dashboard: {
    backgroundColor: "#F0FFF4",
    borderRadius: 12,
    padding: 20,
    gap: 12,
  },
  dashTitle: { fontSize: 18, fontWeight: "700", color: "#1a1a2e" },
  dashSub: { fontSize: 13, color: "#555", lineHeight: 20 },
  statsRow: { flexDirection: "row", gap: 8, marginTop: 4 },
  statBox: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 12,
    alignItems: "center",
  },
  statValue: { fontSize: 18, fontWeight: "700", color: "#1a1a2e" },
  statLabel: { fontSize: 11, color: "#888", marginTop: 2 },

  note: {
    backgroundColor: "#1a1a2e",
    borderRadius: 10,
    padding: 14,
    marginTop: 16,
  },
  noteText: {
    color: "#a8d8ff",
    fontFamily: "monospace",
    fontSize: 11,
    lineHeight: 20,
  },
});
