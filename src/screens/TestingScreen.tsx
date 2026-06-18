/**
 * TestingScreen — Modern React Patterns Demo
 *
 * Covers what "suspense-era patterns" means in practice:
 *   1. useTransition  — keep UI responsive while state updates
 *   2. useDeferredValue — defer expensive derived values
 *   3. useReducer    — local complex state (alternative to useState for multi-field state)
 *   4. useCallback / useMemo — memoisation
 *   5. Custom hooks  — extract reusable logic
 *
 * RTK vs Zustand note (for interview):
 *   - Both are global reactive state stores
 *   - RTK:    store → slice → action → dispatch → selector
 *   - Zustand: create(set => ({ value, setValue: (v) => set({ value: v }) }))
 *   - Same idea, Zustand has ~10x less boilerplate
 */

import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useDeferredValue, useMemo, useReducer, useTransition } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { RootStackParamList } from '@/App';

// ─── Types ────────────────────────────────────────────────────────────────────

type Props = NativeStackScreenProps<RootStackParamList, 'Testing'>;

type SortOrder = 'asc' | 'desc';

type FilterState = {
  sort: SortOrder;
  minPrice: number;
  category: string;
};

type FilterAction =
  | { type: 'SET_SORT'; payload: SortOrder }
  | { type: 'SET_MIN_PRICE'; payload: number }
  | { type: 'SET_CATEGORY'; payload: string }
  | { type: 'RESET' };

// ─── Sample Data ──────────────────────────────────────────────────────────────

const PRODUCTS = [
  { id: 1, name: 'iPhone 15 Pro', price: 999, category: 'Electronics' },
  { id: 2, name: 'AirPods Pro', price: 249, category: 'Electronics' },
  { id: 3, name: 'MacBook Air', price: 1099, category: 'Electronics' },
  { id: 4, name: 'Nike Air Max', price: 149, category: 'Clothing' },
  { id: 5, name: 'Levi\'s 501', price: 79, category: 'Clothing' },
  { id: 6, name: 'Sony WH-1000XM5', price: 349, category: 'Electronics' },
  { id: 7, name: 'Adidas Ultraboost', price: 189, category: 'Clothing' },
  { id: 8, name: 'iPad Pro', price: 799, category: 'Electronics' },
  { id: 9, name: 'Running Shorts', price: 39, category: 'Clothing' },
  { id: 10, name: 'Apple Watch Ultra', price: 799, category: 'Electronics' },
  { id: 11, name: 'Samsung Galaxy S24', price: 849, category: 'Electronics' },
  { id: 12, name: 'Winter Jacket', price: 299, category: 'Clothing' },
];

// ─── Custom Hook: useDebounce ─────────────────────────────────────────────────
// Classic interview question: why debounce? Limits how often expensive ops fire.
// useDebounce extracts the logic so any component can reuse it.

import { useEffect, useRef, useState } from 'react';

function useDebounce<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer); // cleanup cancels the timer on next keystroke
  }, [value, delayMs]);

  return debounced;
}

// ─── Reducer ──────────────────────────────────────────────────────────────────
// useReducer is better than 3 separate useState calls when state fields change together.
// Same pattern as Redux — pure function, action object, new state returned.

const initialFilter: FilterState = { sort: 'asc', minPrice: 0, category: 'All' };

function filterReducer(state: FilterState, action: FilterAction): FilterState {
  switch (action.type) {
    case 'SET_SORT':     return { ...state, sort: action.payload };
    case 'SET_MIN_PRICE': return { ...state, minPrice: action.payload };
    case 'SET_CATEGORY': return { ...state, category: action.payload };
    case 'RESET':        return initialFilter;
    default:             return state;
  }
}

const CATEGORIES = ['All', 'Electronics', 'Clothing'];

// ─── Component ────────────────────────────────────────────────────────────────

export default function TestingScreen({}: Props) {
  // ── Raw search text (updates immediately with every keystroke) ────────────
  const [rawSearch, setRawSearch] = useState('');

  // ── useTransition ─────────────────────────────────────────────────────────
  // isPending: true while React is re-rendering the lower-priority update
  // startTransition: marks the state update inside as "non-urgent"
  // The text input stays snappy even while the list re-renders 1000s of items.
  const [isPending, startTransition] = useTransition();

  // This is the state that drives the expensive filtering — updated inside startTransition
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (text: string) => {
    setRawSearch(text); // urgent: update the input immediately
    startTransition(() => {
      setSearchQuery(text); // non-urgent: let React defer this if needed
    });
  };

  // ── useDeferredValue ──────────────────────────────────────────────────────
  // Like startTransition but for VALUES you don't control (e.g. from props).
  // React keeps the old value until the new one is ready — no janky half-states.
  // Use when you receive a value from outside and can't wrap its source in startTransition.
  const deferredQuery = useDeferredValue(searchQuery);
  const isStale = deferredQuery !== searchQuery; // UI can show "stale" indicator

  // ── useReducer ────────────────────────────────────────────────────────────
  // Perfect when multiple state fields change together (sort + filter + category).
  // dispatch({ type: 'SET_SORT', payload: 'desc' }) — same mental model as Redux.
  const [filters, dispatch] = useReducer(filterReducer, initialFilter);

  // ── useMemo ───────────────────────────────────────────────────────────────
  // Expensive derived value: only recomputes when deferredQuery or filters change.
  // Without useMemo, this runs on EVERY render — fine for small lists, costly for large ones.
  const filteredProducts = useMemo(() => {
    return PRODUCTS
      .filter((p) => {
        const matchesSearch = p.name.toLowerCase().includes(deferredQuery.toLowerCase());
        const matchesCategory = filters.category === 'All' || p.category === filters.category;
        const matchesPrice = p.price >= filters.minPrice;
        return matchesSearch && matchesCategory && matchesPrice;
      })
      .sort((a, b) =>
        filters.sort === 'asc' ? a.price - b.price : b.price - a.price
      );
  }, [deferredQuery, filters]);

  // ── useCallback ───────────────────────────────────────────────────────────
  // Stable function reference — prevents FlatList renderItem from being recreated
  // on every render, which would cause every row to re-render unnecessarily.
  const renderItem = useCallback(({ item }: { item: typeof PRODUCTS[0] }) => (
    <View style={styles.card}>
      <View style={styles.cardLeft}>
        <Text style={styles.cardName}>{item.name}</Text>
        <Text style={styles.cardCategory}>{item.category}</Text>
      </View>
      <Text style={styles.cardPrice}>${item.price}</Text>
    </View>
  ), []); // empty deps = never recreated (item data is stable)

  return (
    <View style={styles.container}>
      {/* ── Search Input ──────────────────────────────────────────── */}
      <View style={styles.searchRow}>
        <TextInput
          style={styles.input}
          placeholder="Search products…"
          value={rawSearch}
          onChangeText={handleSearch}
          placeholderTextColor="#aaa"
        />
        {isPending && <ActivityIndicator size="small" color="#007AFF" style={styles.spinner} />}
      </View>

      {/* ── Filter Controls ───────────────────────────────────────── */}
      <View style={styles.filterRow}>
        {CATEGORIES.map((cat) => (
          <Pressable
            key={cat}
            style={[styles.chip, filters.category === cat && styles.chipActive]}
            onPress={() => dispatch({ type: 'SET_CATEGORY', payload: cat })}>
            <Text style={[styles.chipText, filters.category === cat && styles.chipTextActive]}>
              {cat}
            </Text>
          </Pressable>
        ))}
        <Pressable
          style={[styles.chip, styles.chipSort]}
          onPress={() =>
            dispatch({ type: 'SET_SORT', payload: filters.sort === 'asc' ? 'desc' : 'asc' })
          }>
          <Text style={styles.chipText}>
            Price {filters.sort === 'asc' ? '↑' : '↓'}
          </Text>
        </Pressable>
      </View>

      {/* ── Results count with stale indicator ────────────────────── */}
      <Text style={[styles.resultCount, isStale && styles.resultCountStale]}>
        {filteredProducts.length} results{isStale ? ' (updating…)' : ''}
      </Text>

      {/* ── List ──────────────────────────────────────────────────── */}
      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.empty}>No products match your search.</Text>
        }
      />

      {/* ── Pattern labels (interview reference) ──────────────────── */}
      <View style={styles.legend}>
        {[
          { label: 'useTransition', color: '#007AFF' },
          { label: 'useDeferredValue', color: '#34C759' },
          { label: 'useReducer', color: '#FF9500' },
          { label: 'useMemo + useCallback', color: '#AF52DE' },
        ].map((p) => (
          <View key={p.label} style={styles.legendRow}>
            <View style={[styles.dot, { backgroundColor: p.color }]} />
            <Text style={styles.legendText}>{p.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },

  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    backgroundColor: '#F8F8FA',
    paddingHorizontal: 14,
  },
  input: { flex: 1, height: 44, fontSize: 16, color: '#111' },
  spinner: { marginLeft: 8 },

  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F0F0F5',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  chipActive: { backgroundColor: '#1a1a2e', borderColor: '#1a1a2e' },
  chipSort: { backgroundColor: '#EEF4FF', borderColor: '#007AFF' },
  chipText: { fontSize: 13, color: '#555' },
  chipTextActive: { color: '#fff', fontWeight: '600' },

  resultCount: { fontSize: 12, color: '#999', marginHorizontal: 16, marginBottom: 4 },
  resultCountStale: { color: '#FF9500' },

  list: { paddingHorizontal: 16, paddingBottom: 16 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F5',
  },
  cardLeft: { flex: 1 },
  cardName: { fontSize: 15, fontWeight: '600', color: '#111' },
  cardCategory: { fontSize: 12, color: '#999', marginTop: 2 },
  cardPrice: { fontSize: 16, fontWeight: '700', color: '#1a1a2e' },
  empty: { textAlign: 'center', color: '#aaa', marginTop: 40, fontSize: 15 },

  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    backgroundColor: '#F8F8FA',
    borderTopWidth: 1,
    borderTopColor: '#EEE',
    gap: 12,
    justifyContent: 'center',
  },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 11, color: '#666' },
});
