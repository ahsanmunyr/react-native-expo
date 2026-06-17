import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

const LIMIT = 10;

export default function ExploreScreen() {
  const [products, setProducts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Loading states
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isMoreLoading, setIsMoreLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // Core function jo data fetch karegi (chahe search ho ya normal load)
  const fetchProducts = async (
    currentProductsLength: number,
    query: string,
  ) => {
    try {
      if (currentProductsLength === 0) {
        setIsInitialLoading(true);
      } else {
        setIsMoreLoading(true);
      }

      // URL KO ISS TARAH SE FIX KAREIN:
      let url = "";
      if (query.trim()) {
        // Agar search query hai, toh pehla parameter 'q' hai, isliye baaki '&' se judenge
        url = `https://dummyjson.com/products/search?q=${query}&limit=${LIMIT}&skip=${currentProductsLength}`;
      } else {
        // Agar normal load hai, toh pehla parameter 'limit' hai, isliye shuruat '?' se hogi
        url = `https://dummyjson.com/products?limit=${LIMIT}&skip=${currentProductsLength}`;
      }

      // Ab fetch request bhejein ekdum sahi URL par
      const response = await fetch(url);
      const result = await response.json();
      const newProducts = result.products || [];

      setProducts((oldProducts) =>
        currentProductsLength === 0
          ? newProducts
          : [...oldProducts, ...newProducts],
      );

      setHasMore(newProducts.length === LIMIT);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsInitialLoading(false);
      setIsMoreLoading(false);
    }
  };

  // 1. Jab bhi `searchQuery` badlegi, yeh filter trigger hoga
  useEffect(() => {
    // Jab naya word type hoga, toh list shuru se load hogi (skip = 0)
    fetchProducts(0, searchQuery);
  }, [searchQuery]);

  // 2. Load more function (Jab user scroll karke bilkul neeche pahunche)
  const loadMoreProducts = () => {
    if (isMoreLoading || !hasMore || isInitialLoading) return;

    // products.length bhej rahe hain taaki wahi skip ban jaye
    fetchProducts(products.length, searchQuery);
  };

  return (
    <View style={styles.container}>
      {/* Search Input Box */}
      <TextInput
        style={styles.searchInput}
        placeholder="Search products (e.g., phone, laptop)..."
        value={searchQuery}
        onChangeText={(text) => setSearchQuery(text)} // Har type par state update hogi
      />

      {/* Agar pehli baar load ho raha hai aur list khali hai */}
      {isInitialLoading && products.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#0000ff" />
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item, index }) => (
            <View key={item.id} style={styles.row}>
              <Text style={styles.itemText}>{index + 1}.</Text>
              <Text style={styles.itemText}>{item.title}</Text>
            </View>
          )}
          // Empty list message agar koi product na mile
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              No products found for "{searchQuery}"
            </Text>
          }
          onEndReached={loadMoreProducts}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            isMoreLoading ? (
              <ActivityIndicator size="small" color="#0000ff" />
            ) : null
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 50, // Top space for search bar
    backgroundColor: "#fff",
  },
  searchInput: {
    height: 45,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 20,
    fontSize: 16,
    backgroundColor: "#f9f9f9",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  row: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
  },
  itemText: {
    fontSize: 16,
  },
  emptyText: {
    textAlign: "center",
    marginTop: 20,
    color: "#888",
    fontSize: 16,
  },
});
