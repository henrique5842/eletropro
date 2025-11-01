import { useState, useEffect, useRef } from "react";
import {
  SafeAreaView,
  View,
  TouchableOpacity,
  Text,
  ScrollView,
  Alert,
  ActivityIndicator,
  Dimensions,
  TextInput,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

const { width } = Dimensions.get("window");

interface WifiReading {
  timestamp: number;
  signalStrength: number;
  location: string;
}

export function WifiSignalTester() {
  const navigation = useNavigation();

  const [isScanning, setIsScanning] = useState(false);
  const [currentSignal, setCurrentSignal] = useState<number>(-65);
  const [readings, setReadings] = useState<WifiReading[]>([]);
  const [locationName, setLocationName] = useState("");
  const [signalHistory, setSignalHistory] = useState<number[]>([-65]);
  const scanInterval = useRef<NodeJS.Timeout | null>(null);
  const baseSignal = useRef(-65);

  const simulateWifiReading = () => {
    const variation = (Math.random() - 0.5) * 6;
    const newSignal = Math.max(
      -95,
      Math.min(-30, baseSignal.current + variation)
    );

    setSignalHistory((prev) => {
      const updated = [...prev, newSignal];
      return updated.slice(-5);
    });

    const average =
      signalHistory.reduce((sum, val) => sum + val, newSignal) /
      (signalHistory.length + 1);
    const smoothedSignal = Math.round(average);

    setCurrentSignal(smoothedSignal);
    return smoothedSignal;
  };

  const simulateMovement = () => {
    const movement = (Math.random() - 0.5) * 2;
    baseSignal.current = Math.max(
      -95,
      Math.min(-40, baseSignal.current + movement)
    );
  };

  const startScanning = () => {
    setIsScanning(true);
    Alert.alert(
      "Escaneamento Iniciado",
      "Caminhe pela casa. O sinal será medido continuamente. Salve as leituras nos locais importantes.",
      [{ text: "Entendi" }]
    );

    scanInterval.current = setInterval(() => {
      simulateWifiReading();
      simulateMovement();
    }, 1500);
  };

  const stopScanning = () => {
    setIsScanning(false);
    if (scanInterval.current) {
      clearInterval(scanInterval.current);
      scanInterval.current = null;
    }
  };

  const saveReading = () => {
    if (!locationName.trim()) {
      Alert.alert("Atenção", "Digite o nome do local antes de salvar");
      return;
    }

    const newReading: WifiReading = {
      timestamp: Date.now(),
      signalStrength: currentSignal,
      location: locationName.trim(),
    };

    setReadings((prev) => [...prev, newReading]);
    setLocationName("");

    Alert.alert(
      "✓ Leitura Salva",
      `Local: ${newReading.location}\nSinal: ${newReading.signalStrength} dBm`,
      [{ text: "OK" }]
    );
  };

  const deleteReading = (index: number) => {
    Alert.alert(
      "Confirmar",
      `Deseja excluir a leitura de "${readings[index].location}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: () => {
            setReadings((prev) => prev.filter((_, i) => i !== index));
          },
        },
      ]
    );
  };

  const clearReadings = () => {
    if (readings.length === 0) return;

    Alert.alert("Confirmar", "Deseja limpar todas as leituras salvas?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Limpar Tudo",
        style: "destructive",
        onPress: () => setReadings([]),
      },
    ]);
  };

  const getSignalQuality = (
    signal: number
  ): {
    label: string;
    color: string;
    percentage: number;
    icon: string;
    recommendation: string;
  } => {
    if (signal >= -50) {
      return {
        label: "Excelente",
        color: "#10B981",
        percentage: 100,
        icon: "wifi",
        recommendation: "✓ Perfeito para automação",
      };
    } else if (signal >= -60) {
      return {
        label: "Muito Bom",
        color: "#22C55E",
        percentage: 85,
        icon: "wifi",
        recommendation: "✓ Ótimo para automação",
      };
    } else if (signal >= -70) {
      return {
        label: "Bom",
        color: "#EAB308",
        percentage: 70,
        icon: "wifi",
        recommendation: "✓ Adequado para automação",
      };
    } else if (signal >= -80) {
      return {
        label: "Regular",
        color: "#F59E0B",
        percentage: 50,
        icon: "wifi",
        recommendation: "⚠ Pode ter instabilidade",
      };
    } else if (signal >= -90) {
      return {
        label: "Fraco",
        color: "#EF4444",
        percentage: 25,
        icon: "wifi",
        recommendation: "✗ Não recomendado",
      };
    } else {
      return {
        label: "Muito Fraco",
        color: "#DC2626",
        percentage: 5,
        icon: "wifi-off",
        recommendation: "✗ Sem cobertura adequada",
      };
    }
  };

  const signalQuality = getSignalQuality(currentSignal);

  const averageSignal =
    readings.length > 0
      ? Math.round(
          readings.reduce((sum, r) => sum + r.signalStrength, 0) /
            readings.length
        )
      : 0;

  const bestSignal =
    readings.length > 0
      ? Math.max(...readings.map((r) => r.signalStrength))
      : 0;

  const worstSignal =
    readings.length > 0
      ? Math.min(...readings.map((r) => r.signalStrength))
      : 0;

  const qualityCounts = readings.reduce(
    (acc, reading) => {
      const quality = getSignalQuality(reading.signalStrength);
      if (quality.percentage >= 70) acc.good++;
      else if (quality.percentage >= 50) acc.medium++;
      else acc.poor++;
      return acc;
    },
    { good: 0, medium: 0, poor: 0 }
  );

  useEffect(() => {
    return () => {
      if (scanInterval.current) {
        clearInterval(scanInterval.current);
      }
    };
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-neutral-900">
      <View className="px-6 mt-16 mb-8">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="w-14 h-14 bg-zinc-800/50 rounded-3xl items-center justify-center border border-zinc-700/40"
          >
            <Ionicons name="chevron-back" size={24} color="#60A5FA" />
          </TouchableOpacity>

          <Text className="text-white font-inter-black text-sm">
            TESTE DE SINAL
          </Text>

          <TouchableOpacity
            onPress={clearReadings}
            disabled={readings.length === 0}
            className="w-14 h-14 bg-red-600/20 rounded-3xl items-center justify-center border border-red-600/30"
          >
            <Ionicons
              name="trash"
              size={24}
              color={readings.length === 0 ? "#6B7280" : "#EF4444"}
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="mx-6 mb-8">
          <View className="bg-zinc-900/60 backdrop-blur-xl rounded-3xl p-8 border border-zinc-800/30 items-center">
            <View
              className="w-28 h-28 rounded-full items-center justify-center mb-6"
              style={{
                backgroundColor: `${signalQuality.color}20`,
                borderWidth: 3,
                borderColor: `${signalQuality.color}40`,
              }}
            >
              <Ionicons
                name={signalQuality.icon as any}
                size={56}
                color={signalQuality.color}
              />
            </View>

            <Text className="text-white font-inter-black text-6xl mb-2">
              {currentSignal}
            </Text>
            <Text className="text-gray-400 font-inter-medium text-base mb-4">
              dBm
            </Text>

            <Text
              className="font-inter-bold text-xl mb-3"
              style={{ color: signalQuality.color }}
            >
              {signalQuality.label}
            </Text>

            <Text className="text-gray-400 font-inter-medium text-sm text-center mb-6">
              {signalQuality.recommendation}
            </Text>

            <View className="w-full h-4 bg-zinc-800/50 rounded-full overflow-hidden mb-8">
              <View
                className="h-full rounded-full transition-all"
                style={{
                  width: `${signalQuality.percentage}%`,
                  backgroundColor: signalQuality.color,
                }}
              />
            </View>

            <TouchableOpacity
              onPress={isScanning ? stopScanning : startScanning}
              className="w-full"
            >
              <LinearGradient
                colors={
                  isScanning ? ["#EF4444", "#DC2626"] : ["#10B981", "#059669"]
                }
                style={{ borderRadius: 12 }}
                className="flex-row items-center justify-center gap-3 px-8 py-5 rounded-2xl"
              >
                {isScanning ? (
                  <>
                    <View className="w-3 h-3 bg-white rounded-full" />
                    <Text className="text-white font-inter-bold text-lg">
                      Escaneando...
                    </Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="scan" size={24} color="white" />
                    <Text className="text-white font-inter-bold text-lg">
                      Iniciar Medição
                    </Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {isScanning && (
              <Text className="text-gray-400 font-inter-medium text-xs mt-4 text-center">
                Caminhe pela casa para testar o sinal em diferentes locais
              </Text>
            )}
          </View>
        </View>

        {isScanning && (
          <View className="mx-6 mb-8">
            <Text className="text-white font-inter-black text-lg mb-4">
              💾 Salvar Medição Atual
            </Text>
            <View className="bg-zinc-900/60 backdrop-blur-xl rounded-3xl p-6 border border-zinc-800/30">
              <View className="mb-4">
                <Text className="text-gray-400 font-inter-medium text-sm mb-2">
                  Nome do Local
                </Text>
                <View className="bg-zinc-800/40 rounded-xl px-4 py-3 border border-zinc-700/40">
                  <TextInput
                    value={locationName}
                    onChangeText={setLocationName}
                    placeholder="Ex: Sala, Quarto 1, Cozinha..."
                    placeholderTextColor="#6B7280"
                    className="text-white font-inter-medium text-base"
                    returnKeyType="done"
                    onSubmitEditing={saveReading}
                  />
                </View>
              </View>

              <TouchableOpacity
                onPress={saveReading}
                disabled={!locationName.trim()}
                className={`rounded-xl py-4 items-center ${
                  locationName.trim() ? "bg-blue-600" : "bg-zinc-700/50"
                }`}
              >
                <Text
                  className={`font-inter-bold text-base ${
                    locationName.trim() ? "text-white" : "text-gray-500"
                  }`}
                >
                  Salvar Leitura
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {readings.length > 0 && (
          <View className="mx-6 mb-8">
            <Text className="text-white font-inter-black text-lg mb-4">
              📊 Resumo Geral
            </Text>
            <View className="bg-zinc-900/60 backdrop-blur-xl rounded-3xl p-6 border border-zinc-800/30">
              <View className="flex-row justify-between mb-6">
                <View className="flex-1 items-center">
                  <Text className="text-gray-400 font-inter-medium text-xs mb-2">
                    Total
                  </Text>
                  <Text className="text-white font-inter-black text-2xl">
                    {readings.length}
                  </Text>
                  <Text className="text-gray-500 font-inter-medium text-xs mt-1">
                    locais
                  </Text>
                </View>

                <View className="flex-1 items-center border-l border-r border-zinc-700/30">
                  <Text className="text-gray-400 font-inter-medium text-xs mb-2">
                    Média
                  </Text>
                  <Text className="text-blue-400 font-inter-black text-2xl">
                    {averageSignal}
                  </Text>
                  <Text className="text-gray-500 font-inter-medium text-xs mt-1">
                    dBm
                  </Text>
                </View>

                <View className="flex-1 items-center">
                  <Text className="text-gray-400 font-inter-medium text-xs mb-2">
                    Melhor
                  </Text>
                  <Text className="text-green-400 font-inter-black text-2xl">
                    {bestSignal}
                  </Text>
                  <Text className="text-gray-500 font-inter-medium text-xs mt-1">
                    dBm
                  </Text>
                </View>
              </View>

              <View className="border-t border-zinc-700/30 pt-4">
                <Text className="text-gray-400 font-inter-medium text-sm mb-3">
                  Distribuição de Qualidade
                </Text>
                <View className="gap-2">
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center gap-2">
                      <View className="w-3 h-3 rounded-full bg-green-500" />
                      <Text className="text-gray-400 font-inter-medium text-sm">
                        Bom ou melhor
                      </Text>
                    </View>
                    <Text className="text-white font-inter-bold text-sm">
                      {qualityCounts.good}
                    </Text>
                  </View>
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center gap-2">
                      <View className="w-3 h-3 rounded-full bg-yellow-500" />
                      <Text className="text-gray-400 font-inter-medium text-sm">
                        Regular
                      </Text>
                    </View>
                    <Text className="text-white font-inter-bold text-sm">
                      {qualityCounts.medium}
                    </Text>
                  </View>
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center gap-2">
                      <View className="w-3 h-3 rounded-full bg-red-500" />
                      <Text className="text-gray-400 font-inter-medium text-sm">
                        Fraco
                      </Text>
                    </View>
                    <Text className="text-white font-inter-bold text-sm">
                      {qualityCounts.poor}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        )}

        {readings.length > 0 && (
          <View className="mx-6 mb-8">
            <Text className="text-white font-inter-black text-lg mb-4">
              📍 Medições por Local ({readings.length})
            </Text>

            <View className="gap-3">
              {readings
                .slice()
                .reverse()
                .map((reading, index) => {
                  const quality = getSignalQuality(reading.signalStrength);
                  const actualIndex = readings.length - 1 - index;
                  return (
                    <View
                      key={actualIndex}
                      className="bg-zinc-900/60 backdrop-blur-xl rounded-2xl p-5 border border-zinc-800/30"
                    >
                      <View className="flex-row items-center justify-between mb-3">
                        <View className="flex-row items-center gap-3 flex-1">
                          <View
                            className="w-12 h-12 rounded-xl items-center justify-center"
                            style={{ backgroundColor: `${quality.color}20` }}
                          >
                            <Ionicons
                              name={quality.icon as any}
                              size={24}
                              color={quality.color}
                            />
                          </View>
                          <View className="flex-1">
                            <Text className="text-white font-inter-bold text-base mb-1">
                              {reading.location}
                            </Text>
                            <Text className="text-gray-400 font-inter-medium text-xs">
                              {new Date(reading.timestamp).toLocaleTimeString(
                                "pt-BR",
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }
                              )}
                            </Text>
                          </View>
                        </View>

                        <TouchableOpacity
                          onPress={() => deleteReading(actualIndex)}
                          className="w-10 h-10 bg-red-600/20 rounded-xl items-center justify-center border border-red-600/30"
                        >
                          <Ionicons
                            name="trash-outline"
                            size={18}
                            color="#EF4444"
                          />
                        </TouchableOpacity>
                      </View>

                      <View className="flex-row items-end justify-between">
                        <View>
                          <Text
                            className="font-inter-black text-3xl"
                            style={{ color: quality.color }}
                          >
                            {reading.signalStrength}
                          </Text>
                          <Text className="text-gray-500 font-inter-medium text-xs">
                            dBm
                          </Text>
                        </View>
                        <View className="items-end">
                          <View
                            className="px-3 py-1 rounded-lg"
                            style={{ backgroundColor: `${quality.color}20` }}
                          >
                            <Text
                              className="font-inter-bold text-xs"
                              style={{ color: quality.color }}
                            >
                              {quality.label}
                            </Text>
                          </View>
                          <Text className="text-gray-500 font-inter-medium text-xs mt-1">
                            {quality.recommendation}
                          </Text>
                        </View>
                      </View>
                    </View>
                  );
                })}
            </View>
          </View>
        )}

        <View className="mx-6 mb-8">
          <Text className="text-white font-inter-black text-lg mb-4">
            📖 Guia de Interpretação
          </Text>
          <View className="bg-zinc-900/60 backdrop-blur-xl rounded-3xl p-6 border border-zinc-800/30 gap-3">
            {[
              {
                range: "-30 a -50 dBm",
                quality: "Excelente",
                color: "#10B981",
                icon: "✓✓✓",
              },
              {
                range: "-50 a -60 dBm",
                quality: "Muito Bom",
                color: "#22C55E",
                icon: "✓✓",
              },
              {
                range: "-60 a -70 dBm",
                quality: "Bom",
                color: "#EAB308",
                icon: "✓",
              },
              {
                range: "-70 a -80 dBm",
                quality: "Regular",
                color: "#F59E0B",
                icon: "⚠",
              },
              {
                range: "-80 a -90 dBm",
                quality: "Fraco",
                color: "#EF4444",
                icon: "✗",
              },
              {
                range: "Abaixo de -90",
                quality: "Muito Fraco",
                color: "#DC2626",
                icon: "✗✗",
              },
            ].map((item, index) => (
              <View
                key={index}
                className="flex-row items-center justify-between py-2"
              >
                <View className="flex-row items-center gap-3 flex-1">
                  <View
                    className="w-10 h-10 rounded-xl items-center justify-center"
                    style={{ backgroundColor: `${item.color}20` }}
                  >
                    <Text style={{ color: item.color, fontSize: 16 }}>
                      {item.icon}
                    </Text>
                  </View>
                  <View>
                    <Text className="text-white font-inter-bold text-sm">
                      {item.quality}
                    </Text>
                    <Text className="text-gray-400 font-inter-medium text-xs">
                      {item.range}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View className="mx-6 mb-8">
          <View className="bg-blue-600/10 border border-blue-600/30 rounded-2xl p-5">
            <View className="flex-row items-start gap-3 mb-3">
              <Ionicons name="bulb" size={24} color="#3B82F6" />
              <Text className="text-blue-400 font-inter-bold text-base flex-1">
                Dicas para Medição Precisa
              </Text>
            </View>
            <View className="gap-2 pl-9">
              <Text className="text-blue-300 font-inter-medium text-sm">
                • Caminhe devagar pelos cômodos
              </Text>
              <Text className="text-blue-300 font-inter-medium text-sm">
                • Salve leituras em cada cômodo importante
              </Text>
              <Text className="text-blue-300 font-inter-medium text-sm">
                • Teste cantos e áreas distantes do roteador
              </Text>
              <Text className="text-blue-300 font-inter-medium text-sm">
                • Para automação, o ideal é sinal acima de -70 dBm
              </Text>
            </View>
          </View>
        </View>

        <View className="h-32" />
      </ScrollView>
    </SafeAreaView>
  );
}
