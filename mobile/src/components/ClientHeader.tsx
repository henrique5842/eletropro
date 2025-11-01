import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, AntDesign } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { Alert } from "react-native";
import { Client } from "../hooks/useClientData";
import { generateAvatar, generateColor } from "../utils/helpers";
import { formatCurrency, formatDate } from "../utils/formatters";

interface Props {
  client: Client;
  onEdit: () => void;
  onDelete: () => void;
}

export function ClientHeader({ client, onEdit, onDelete }: Props) {
  const navigation = useNavigation();
  const avatar = generateAvatar(client.fullName);
  const colors = generateColor(client.id);

  const copyPhoneNumber = (phoneNumber: string) => {
    if (!phoneNumber) return;
    const cleanedNumber = phoneNumber.replace(/\D/g, "");
    Clipboard.setString(cleanedNumber);
    Alert.alert(
      "Copiado!",
      "O número de telefone foi copiado para a área de transferência."
    );
  };

  return (
    <View className="px-6 mt-16 mb-8">
      <View className="flex-row items-center justify-between mb-8">
        <TouchableOpacity
          className="w-14 h-14 bg-zinc-800/50 rounded-3xl items-center justify-center border border-zinc-700/40"
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color="#60A5FA" />
        </TouchableOpacity>
        <Text className="text-white font-inter-black text-sm">
          DETALHES DO CLIENTE
        </Text>
        <TouchableOpacity
          className="w-14 h-14 bg-zinc-800/50 rounded-3xl items-center justify-center border border-zinc-700/40"
          onPress={onEdit}
        >
          <Ionicons name="create" size={22} color="#60A5FA" />
        </TouchableOpacity>
      </View>

      <View className="relative">
        <View className="rounded-[32px] p-[1px] border border-zinc-700/20">
          <View className="bg-zinc-900 rounded-[31px] p-8">
            <View className="flex-row items-center gap-6">
              <View className="relative">
                <LinearGradient
                  colors={colors}
                  style={{ borderRadius: 16 }}
                  className="w-28 h-28 rounded-[28px] items-center justify-center"
                >
                  <Text className="text-white font-inter-black text-4xl">
                    {avatar}
                  </Text>
                </LinearGradient>
              </View>
              <View className="flex-1">
                <Text className="text-white font-inter-black text-2xl mb-1 tracking-wide">
                  {client.fullName}
                </Text>
                <Text className="text-zinc-300 font-inter-semibold text-base mb-4 opacity-90">
                  {client.city}, {client.state}
                </Text>
                <View className="flex-row gap-3">
                  <View className="flex bg-zinc-800/60 backdrop-blur-sm rounded-2xl px-4 py-3 border border-zinc-700/30">
                    <View className="flex-row items-center gap-2">
                      <View className="w-8 h-8 bg-green-500/20 rounded-full items-center justify-center">
                        <Ionicons
                          name="checkmark-circle"
                          size={14}
                          color="#10B981"
                        />
                      </View>
                      <Text className="text-green-400 font-inter-bold text-sm">
                        Ativo
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>

            <View className="mt-6 pt-6 border-t border-zinc-700/30">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-3">
                  <View className="w-10 h-10 bg-zinc-800/50 rounded-2xl items-center justify-center">
                    <Ionicons name="cash-outline" size={18} color="#10B981" />
                  </View>
                  <View>
                    <Text className="text-zinc-400 font-inter-medium text-sm">
                      Valor Total
                    </Text>
                    <Text className="text-green-400 font-inter-black text-lg">
                      {formatCurrency(client.totalValue)}
                    </Text>
                  </View>
                </View>
                <View className="flex-row items-center gap-3">
                  <View className="w-10 h-10 bg-zinc-800/50 rounded-2xl items-center justify-center">
                    <Ionicons name="time-outline" size={18} color="#8B5CF6" />
                  </View>
                  <View>
                    <Text className="text-zinc-400 font-inter-medium text-sm">
                      Cliente desde
                    </Text>
                    <Text className="text-purple-400 font-inter-black text-lg">
                      {formatDate(client.clientSince)}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            <View className="mt-6 flex-row gap-3">
              <TouchableOpacity
                className="flex-1"
                onPress={() => copyPhoneNumber(client.phone)}
              >
                <LinearGradient
                  colors={["#10B981", "#059669"]}
                  style={{ borderRadius: 12 }}
                  className="flex-row items-center justify-center gap-3 py-4 rounded-2xl"
                >
                  <Ionicons name="call" size={18} color="white" />
                  <Text className="text-white font-inter-bold text-base">
                    Ligar
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity className="flex-1" onPress={onDelete}>
                <View className="bg-red-500 backdrop-blur-sm border flex-row items-center justify-center gap-3 py-4 rounded-xl">
                  <AntDesign name="delete" size={24} color="#fff" />
                  <Text className="text-white font-inter-bold text-base">
                    Deletar
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}
