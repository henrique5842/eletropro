import {
  SafeAreaView,
  View,
  TouchableOpacity,
  Text,
  Image,
  ScrollView,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

export function Calculator() {
  const navigation = useNavigation();

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

  const menuItems = [
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
      title: "QUADRO DE DISTRIBUIÇÃO",
      subtitle: "MONTAGEM DE QUADRO DE DISTRIBUIÇÃO",
      icon: "trail-sign",
      color: "bg-red-600",
      onPress: handleCircuitBreakerManager,
    },
  ];

  return (
    <SafeAreaView className="flex-1 bg-neutral-900">
      <View className="px-6 mt-16 ">
        <View className="flex-row items-center justify-between mb-8">
          <TouchableOpacity
            className="w-10 h-10 bg-gray-800/60 rounded-xl items-center justify-center border border-gray-700/40 active:scale-95"
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.2,
              shadowRadius: 4,
              elevation: 4,
            }}
          >
            <Ionicons name="chevron-back" size={18} color="#60A5FA" />
          </TouchableOpacity>

          <View className="flex-1 items-center">
            <Text className="text-white font-bold text-sm">CALCULADORAS</Text>
            <View className="w-16 h-0.5 bg-yellow-500 rounded-full mt-1" />
          </View>
        </View>
      </View>
      <View className="flex-1 px-5 justify-center">
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
      </View>
    </SafeAreaView>
  );
}
