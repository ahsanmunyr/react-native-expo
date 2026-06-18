import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import LoginScreen from "./screens/LoginScreen";
import TestingScreen from "./screens/TestingScreen";

export type RootStackParamList = {
  Login: undefined;
  Home: undefined;
  Transcription: undefined;
  AudioPlayer: undefined;
  AudioDemo: undefined;
  Explore: undefined;
  Testing: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: "#1a1a2e" },
          headerTintColor: "#fff",
          headerTitleStyle: { fontWeight: "600" },
        }}
      >
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Testing" component={TestingScreen} options={{ title: 'Modern Hooks' }} />
        {/* <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Munsit Demo' }} /> */}
        {/* <Stack.Screen name="Transcription" component={TranscriptionScreen} options={{ title: 'Live Transcription' }} />
        <Stack.Screen name="AudioPlayer" component={AudioPlayerScreen} options={{ title: 'Audio Player' }} />
        <Stack.Screen name="AudioDemo" component={AudioDemoScreen} options={{ title: 'Record & Playback' }} />
        <Stack.Screen name="Explore" component={ExploreScreen} options={{ title: 'Search & Explore' }} /> */}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
