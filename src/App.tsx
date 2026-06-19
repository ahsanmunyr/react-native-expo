import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import ReactQueryExample from "./screens/ReactQueryExample";
import ZustandExample from "./screens/ZustandExample";

export type RootStackParamList = {
  Testing: undefined;
  ReactQueryExample: undefined;
  ZustandExample: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

// QueryClient holds the cache — create once at app level
const queryClient = new QueryClient();

export default function App() {
  return (
    // QueryClientProvider makes React Query available to every screen
    <QueryClientProvider client={queryClient}>
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerStyle: { backgroundColor: "#1a1a2e" },
            headerTintColor: "#fff",
            headerTitleStyle: { fontWeight: "600" },
          }}
        >
          {/* <Stack.Screen
            name="Testing"
            component={TestingScreen}
            options={{ title: "Testing" }}
          /> */}
          <Stack.Screen
            name="ReactQueryExample"
            component={ReactQueryExample}
            options={{ title: "React Query" }}
          />
          <Stack.Screen
            name="ZustandExample"
            component={ZustandExample}
            options={{ title: "Zustand" }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </QueryClientProvider>
  );
}
