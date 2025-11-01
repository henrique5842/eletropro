import { SafeAreaView, StatusBar, ActivityIndicator } from "react-native";

import {
  useFonts,
  Inter_100Thin,
  Inter_200ExtraLight,
  Inter_300Light,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
  Inter_900Black,
} from "@expo-google-fonts/inter";
import { NavigationContainer } from "@react-navigation/native";

import "./src/styles/global.css";

import { AppRoutes } from "./src/routes/AppRoutes";


export default function App() {
  const [fontsLoaded] = useFonts({
    Inter_100Thin,
    Inter_200ExtraLight,
    Inter_300Light,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
    Inter_900Black,
  });

  if (!fontsLoaded) {
    return <ActivityIndicator />;
  }

  return (
    <NavigationContainer>
      <SafeAreaView className="flex-1 bg-neutral-900">
        <AppRoutes />
        <StatusBar
          barStyle="light-content"
          backgroundColor="transparent"
          translucent
        />
      </SafeAreaView>
      </NavigationContainer>
  );
}
