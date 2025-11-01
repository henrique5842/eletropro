import {
  SafeAreaView,
  View,
  TouchableOpacity,
  Text,
  Image,
  ScrollView,
} from "react-native";

import Logo from "../assets/logo.png";

import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

export function Home() {
  const navigation = useNavigation();

  function handleClientsList() {
    navigation.navigate("ClientsList");
  }

  function handleClientRegistration() {
    navigation.navigate("ClientRegistration");
  }

  function handleDropCalculator() {
    navigation.navigate("DropCalculator");
  }

  function handleLedCalculator() {
    navigation.navigate("LedCalculator");
  }

  function handleFontCalculator() {
    navigation.navigate("FontCalculator");
  }

  function handleCurrentCalculator() {
    navigation.navigate("CurrentCalculator");
  }

  function handleCircuitBreakerManager() {
    navigation.navigate("CircuitBreakerManager");
  }

  function handleProfile() {
    navigation.navigate("Profile");
  }

  function handleReports() {
    navigation.navigate("Reports");
  }

  function handleCalculator() {
    navigation.navigate("Calculator");
  }

  function handleEnergyCalculator() {
    navigation.navigate("EnergyCalculator");
  }

  function handleMaterial() {
    navigation.navigate("Materials");
  }

  function handleNewService() {
    navigation.navigate("NewService");
  }

  function handleWifiSignalTester() {
    navigation.navigate("WifiSignalTester");
  }

  const menuItems = [
    {
      id: 1,
      title: "LISTA DE CLIENTES",
      subtitle: "CLIENTES CADASTRADOS",
      icon: "people",
      color: "bg-blue-600",
      onPress: handleClientsList,
    },
    {
      id: 2,
      title: "CADASTRAR CLIENTE",
      subtitle: "ADICIONAR NOVO CLIENTE",
      icon: "person-add",
      color: "bg-green-600",
      onPress: handleClientRegistration,
    },
    {
      id: 3,
      title: "QUEDA DE TENSÃO",
      subtitle: "CALCULADORA DE QUEDA",
      icon: "flash",
      color: "bg-yellow-600",
      onPress: handleDropCalculator,
    },
    {
      id: 4,
      title: "FITA DE LED",
      subtitle: "CÁLCULOS PARA FITAS LED",
      icon: "bulb",
      color: "bg-purple-600",
      onPress: handleLedCalculator,
    },
    {
      id: 5,
      title: "FONTE DE LED",
      subtitle: "DIMENSIONAR FONTE LED",
      icon: "battery-charging",
      color: "bg-orange-600",
      onPress: handleFontCalculator,
    },
    {
      id: 6,
      title: "CÁLCULO DE CORRENTE",
      subtitle: "CÁLCULO DE CORRENTE",
      icon: "trail-sign",
      color: "bg-red-600",
      onPress: handleCurrentCalculator,
    },
    {
      id: 7,
      title: "CONSUMO ENERGÉTICO",
      subtitle: "CÁLCULO O CONSUMO ENERGÉTICO",
      icon: "calculator",
      color: "bg-green-500",
      onPress: handleEnergyCalculator,
    },
    {
      id: 8,
      title: "QUADRO DE DISTRIBUIÇÃO",
      subtitle: "MONTAGEM DE QUADRO DE DISTRIBUIÇÃO",
      icon: "trail-sign",
      color: "bg-red-600",
      onPress: handleCircuitBreakerManager,
    },
    {
      id: 9,
      title: "CADASTRO DE MATERIAIS",
      subtitle: "CADASTRAR DE NOVO MATERIAL",
      icon: "trail-sign",
      color: "bg-red-600",
      onPress: handleMaterial,
    },
    {
      id: 10,
      title: "CADASTRO DE SERVIÇOS",
      subtitle: "CADASTRAR DE NOVO SERVIÇO",
      icon: "trail-sign",
      color: "bg-red-600",
      onPress: handleNewService,
    },
    {
      id: 12,
      title: "TESTE DE INTENSIDADE DO WIFI ",
      subtitle: "TESTE DE INTENSIDADE DO WIFI PARA AUTOMACAO",
      icon: "wifi",
      color: "bg-blue-500",
      onPress: handleWifiSignalTester,
    },
  ];

  return (
    <SafeAreaView className="flex-1 bg-neutral-900">
      <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
        <TouchableOpacity
          className="mt-16 flex-row items-center gap-3 mb-10"
          onPress={handleProfile}
        >
          <Image source={Logo} className="w-16 h-16 rounded-full" />
          <View className="flex-1">
            <Text className="text-gray-100 font-inter-black text-base">
              RICARDO SOLUÇÕES ELÉTRICAS
            </Text>
            <Text className="text-blue-400 font-inter-extrabold text-xs mt-1">
              SEJA BEM-VINDO DE VOLTA!
            </Text>
          </View>
          <View className="w-10 h-10 bg-zinc-800 rounded-full items-center justify-center">
            <Ionicons name="notifications" size={20} color="#9CA3AF" />
          </View>
        </TouchableOpacity>

        <Text className="text-gray-100 font-inter-black text-base mb-5">
          FERRAMENTAS
        </Text>

        <View className="gap-4 pb-8">
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={item.id}
              onPress={item.onPress}
              className="w-full bg-zinc-800 rounded-2xl p-5 flex-row items-center gap-4 active:bg-zinc-700"
              style={{
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 3,
              }}
            >
              <View
                className={`w-14 h-14 ${item.color} rounded-xl items-center justify-center`}
              >
                <Ionicons name={item.icon as any} size={26} color="white" />
              </View>

              <View className="flex-1">
                <Text className="text-gray-100 font-inter-black text-base">
                  {item.title}
                </Text>
                <Text className="text-gray-400 font-inter-bold text-xs mt-1">
                  {item.subtitle}
                </Text>
              </View>

              <View className="w-8 h-8 bg-zinc-700 rounded-full items-center justify-center">
                <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
              </View>
            </TouchableOpacity>
          ))}
        </View>

       
      </ScrollView>
    </SafeAreaView>
  );
}
