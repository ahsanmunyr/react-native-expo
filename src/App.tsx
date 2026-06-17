import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import AudioDemoScreen from '@/screens/AudioDemoScreen';
import AudioPlayerScreen from '@/screens/AudioPlayerScreen';
import ExploreScreen from '@/screens/ExploreScreen';
import HomeScreen from '@/screens/HomeScreen';
import TranscriptionScreen from '@/screens/TranscriptionScreen';

export type RootStackParamList = {
  Home: undefined;
  Transcription: undefined;
  AudioPlayer: undefined;
  AudioDemo: undefined;
  Explore: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: '#1a1a2e' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: '600' },
        }}>
        <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Munsit Demo' }} />
        <Stack.Screen name="Transcription" component={TranscriptionScreen} options={{ title: 'Live Transcription' }} />
        <Stack.Screen name="AudioPlayer" component={AudioPlayerScreen} options={{ title: 'Audio Player' }} />
        <Stack.Screen name="AudioDemo" component={AudioDemoScreen} options={{ title: 'Record & Playback' }} />
        <Stack.Screen name="Explore" component={ExploreScreen} options={{ title: 'Search & Explore' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
