import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { SignIn } from "../screens/SignIn";

import { Home } from "../screens/Home";
import { ClientsList } from "../screens/ClientsList";
import { Clients } from "../screens/Clients";
import { ClientRegistration } from "../screens/ClientRegistration";
import { DropCalculator } from "../screens/DropCalculator";
import { LedCalculator } from "../screens/LedCalculator";
import { FontCalculator } from "../screens/FontCalculator";
import CurrentCalculator from "../screens/CurrentCalculator";
import { CircuitBreakerManager } from "../screens/CircuitBreakerManager";
import { NewQuote } from "../screens/NewQuote";
import { QuoteDetails } from "../screens/QuoteDetails";
import { ProjectManagement } from "../screens/ProjectManagement";
import { NewMaterial } from "../screens/NewMaterial";
import { MaterialDetails } from "../screens/MaterialDetails";
import { Profile } from "../screens/Profile";
import { Calculator } from "../screens/Calculators";
import { EnergyCalculator } from "../screens/EnergyCalculator";
import { Loading } from "../components/Loading";
import { Materials } from "../screens/Material";
import { NewService } from "../screens/NewBudget";
import { WifiSignalTester } from "../screens/WifiSignalTester";
import { SafeAreaView, Text, View } from "react-native";

const Stack = createNativeStackNavigator();

const ErrorScreen = ({ message }: { message: string }) => (
  <SafeAreaView className="flex-1 bg-neutral-900 items-center justify-center px-6">
    <View className="bg-red-900/20 border border-red-500 rounded-2xl p-6 items-center">
      <Text className="text-red-400 font-inter-black text-lg mb-4">
        Erro de Navegação
      </Text>
      <Text className="text-white font-inter-medium text-base text-center">
        {message}
      </Text>
    </View>
  </SafeAreaView>
);

const AuthStack = () => (
  <Stack.Navigator
    screenOptions={{ headerShown: false }}
    initialRouteName="SignIn"
  >
    <Stack.Screen name="SignIn" component={SignIn} />
  </Stack.Navigator>
);

const AppStack = () => (
  <Stack.Navigator
    screenOptions={{ headerShown: false }}
    initialRouteName="Home"
  >
    <Stack.Screen name="Home" component={Home} />
    <Stack.Screen name="ClientsList" component={ClientsList} />
    <Stack.Screen name="Clients" component={Clients} />
    <Stack.Screen name="ClientDetails" component={Clients} />
    <Stack.Screen name="ClientRegistration" component={ClientRegistration} />
    <Stack.Screen name="DropCalculator" component={DropCalculator} />
    <Stack.Screen name="LedCalculator" component={LedCalculator} />
    <Stack.Screen name="FontCalculator" component={FontCalculator} />
    <Stack.Screen name="CurrentCalculator" component={CurrentCalculator} />
    <Stack.Screen
      name="CircuitBreakerManager"
      component={CircuitBreakerManager}
    />
    <Stack.Screen name="NewQuote" component={NewQuote} />
    <Stack.Screen name="QuoteDetails" component={QuoteDetails} />
    <Stack.Screen name="ProjectManagement" component={ProjectManagement} />
    <Stack.Screen name="NewMaterial" component={NewMaterial} />
    <Stack.Screen name="MaterialDetails" component={MaterialDetails} />
    <Stack.Screen name="Profile" component={Profile} />
    <Stack.Screen name="Calculator" component={Calculator} />
    <Stack.Screen name="EnergyCalculator" component={EnergyCalculator} />
    <Stack.Screen name="Materials" component={Materials} />
    <Stack.Screen name="NewService" component={NewService} />
    <Stack.Screen name="WifiSignalTester" component={WifiSignalTester} />
  </Stack.Navigator>
);

export function AppRoutes() {
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const token = await AsyncStorage.getItem("userToken");
        const expiration = await AsyncStorage.getItem("tokenExpiration");

        if (token && expiration) {
          const expirationTime = parseInt(expiration, 10);
          const currentTime = Date.now();

          if (currentTime < expirationTime) {
            setIsLoggedIn(true);
            setError(null);
          } else {
            await AsyncStorage.removeItem("userToken");
            await AsyncStorage.removeItem("tokenExpiration");
            setIsLoggedIn(false);
          }
        } else {
          setIsLoggedIn(false);
        }
      } catch (err) {
        setError("Erro ao verificar autenticação");
        setIsLoggedIn(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkLoginStatus();
  }, []);

  if (isLoading) {
    return <Loading />;
  }

  if (error) {
    return <ErrorScreen message={error} />;
  }

  return isLoggedIn ? <AppStack /> : <AuthStack />;
}
