/**
 * React Query Example
 *
 * React Query = server state management.
 * It handles: loading, error, caching, background refetch, pagination.
 *
 * Without React Query you write this manually every time:
 *   const [data, setData] = useState(null)
 *   const [loading, setLoading] = useState(true)
 *   const [error, setError] = useState(null)
 *   useEffect(() => { fetch()... }, [])
 *
 * With React Query: one hook replaces all of that.
 *
 * Setup (in App.tsx root):
 *   import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
 *   const queryClient = new QueryClient()
 *   <QueryClientProvider client={queryClient}><App /></QueryClientProvider>
 */

import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

// ─── Types ────────────────────────────────────────────────────────────────────

type Post = {
  id: number;
  title: string;
  body: string;
  userId: number;
};

// ─── API functions (keep these outside components — plain async functions) ────

const fetchPosts = async (): Promise<Post[]> => {
  const res = await fetch('https://jsonplaceholder.typicode.com/posts?_limit=10');
  if (!res.ok) throw new Error('Failed to fetch posts');
  return res.json();
};

const createPost = async (title: string): Promise<Post> => {
  const res = await fetch('https://jsonplaceholder.typicode.com/posts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, body: 'created from demo', userId: 1 }),
  });
  if (!res.ok) throw new Error('Failed to create post');
  return res.json();
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function ReactQueryExample() {
  const [newTitle, setNewTitle] = useState('');
  const queryClient = useQueryClient();

  // ── useQuery — fetch + cache + background refetch ────────────────────────
  // queryKey: unique key for this data. React Query caches by key.
  // queryFn: async function that returns the data.
  // staleTime: how long data is considered fresh (no refetch during this window)
  const {
    data: posts,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['posts'],          // cache key — can be array with params: ['posts', userId]
    queryFn: fetchPosts,
    staleTime: 30_000,            // data is fresh for 30s — no background refetch
    // gcTime: 5 * 60 * 1000,    // keep in cache for 5min after component unmounts
    // retry: 3,                  // retry failed requests 3 times
    // refetchOnWindowFocus: true // re-fetch when app comes to foreground
  });

  // ── useMutation — POST / PUT / DELETE ────────────────────────────────────
  // mutate() triggers the mutation function.
  // onSuccess: called when mutation succeeds — perfect place to invalidate cache.
  // onError: called when mutation fails.
  const { mutate: addPost, isPending: isAdding } = useMutation({
    mutationFn: createPost,
    onSuccess: (newPost) => {
      // Invalidate 'posts' cache → triggers automatic refetch
      queryClient.invalidateQueries({ queryKey: ['posts'] });

      // OR: update cache directly without refetch (optimistic update pattern):
      // queryClient.setQueryData(['posts'], (old: Post[]) => [newPost, ...old]);

      setNewTitle('');
    },
    onError: (err) => {
      console.error('Create failed:', err);
    },
  });

  // ── Loading state ─────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading posts…</Text>
      </View>
    );
  }

  // ── Error state ───────────────────────────────────────────────────────────
  if (isError) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>⚠ {(error as Error).message}</Text>
        <Pressable style={styles.retryBtn} onPress={() => refetch()}>
          <Text style={styles.retryText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* ── Add new post (useMutation) ──────────────────────────────── */}
      <View style={styles.addRow}>
        <TextInput
          style={styles.input}
          value={newTitle}
          onChangeText={setNewTitle}
          placeholder="New post title…"
          placeholderTextColor="#aaa"
        />
        <Pressable
          style={[styles.addBtn, (!newTitle || isAdding) && styles.addBtnDisabled]}
          disabled={!newTitle || isAdding}
          onPress={() => addPost(newTitle)}>
          {isAdding ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.addBtnText}>Add</Text>
          )}
        </Pressable>
      </View>

      {/* ── Posts list (useQuery) ───────────────────────────────────── */}
      <FlatList
        data={posts}
        keyExtractor={(item) => String(item.id)}
        refreshControl={
          // Pull-to-refresh triggers refetch()
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cardTitle} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={styles.cardBody} numberOfLines={2}>
              {item.body}
            </Text>
            <Text style={styles.cardMeta}>User #{item.userId}</Text>
          </View>
        )}
        ListHeaderComponent={
          <View style={styles.note}>
            <Text style={styles.noteText}>
              {'useQuery  → fetches, caches, auto-refetches\n'}
              {'useMutation → POST/PUT/DELETE + cache invalidation\n'}
              {'queryKey  → [\'posts\'] unique cache key\n'}
              {'staleTime → how long to trust cached data\n'}
              {'invalidateQueries → triggers background refetch'}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { fontSize: 15, color: '#888' },
  errorText: { fontSize: 15, color: '#FF3B30', textAlign: 'center', padding: 20 },
  retryBtn: { backgroundColor: '#007AFF', paddingHorizontal: 24, paddingVertical: 10, borderRadius: 8 },
  retryText: { color: '#fff', fontWeight: '600' },

  addRow: { flexDirection: 'row', padding: 12, gap: 8, borderBottomWidth: 1, borderBottomColor: '#F0F0F5' },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    backgroundColor: '#F8F8FA',
  },
  addBtn: { backgroundColor: '#007AFF', paddingHorizontal: 16, borderRadius: 8, justifyContent: 'center' },
  addBtnDisabled: { backgroundColor: '#aaa' },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  card: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#F0F0F5' },
  cardTitle: { fontSize: 15, fontWeight: '600', color: '#111', marginBottom: 4 },
  cardBody: { fontSize: 13, color: '#888', lineHeight: 18 },
  cardMeta: { fontSize: 11, color: '#bbb', marginTop: 4 },

  note: { margin: 12, backgroundColor: '#1a1a2e', borderRadius: 10, padding: 14 },
  noteText: { color: '#a8d8ff', fontFamily: 'monospace', fontSize: 11, lineHeight: 20 },
});
