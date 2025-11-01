import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Platform,
  Linking,
  Alert,
} from "react-native";
import { Ionicons, FontAwesome6 } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Client } from "../hooks/useClientData";
import { clientContext } from "../context/ClientContext";

interface Props {
  client: Client;
  onShare: () => void;
}

export function InfoTab({ client, onShare }: Props) {
  const openMap = (address: string) => {
    const url = Platform.select({
      ios: `maps://?q=${encodeURIComponent(address)}`,
      android: `geo:0,0?q=${encodeURIComponent(address)}`,
    });
    if (url) {
      Linking.openURL(url).catch(() =>
        Alert.alert("Erro", "Não foi possível abrir o mapa.")
      );
    }
  };

  return (
    <View className="gap-4">
      <View className="bg-zinc-900/60 backdrop-blur-xl rounded-3xl p-6 border border-zinc-800/30">
        <View className="flex-row items-center gap-3 mb-6">
          <View className="w-12 h-12 bg-blue-600/20 rounded-2xl items-center justify-center">
            <Ionicons name="person" size={24} color="#60A5FA" />
          </View>
          <Text className="text-white font-inter-black text-xl">
            Dados Pessoais
          </Text>
        </View>
        <View className="gap-4">
          <View className="flex-row items-center gap-4 py-3 border-b border-zinc-800/50">
            <View className="w-10 h-10 bg-zinc-800/50 rounded-xl items-center justify-center">
              <Ionicons name="person-outline" size={18} color="#9CA3AF" />
            </View>
            <View className="flex-1">
              <Text className="text-gray-400 font-inter-medium text-sm">
                Nome Completo
              </Text>
              <Text className="text-white font-inter-bold text-lg mt-1">
                {client.fullName}
              </Text>
            </View>
          </View>
          {client.cpfCnpj && (
            <View className="flex-row items-center gap-4 py-3 border-b border-zinc-800/50">
              <View className="w-10 h-10 bg-zinc-800/50 rounded-xl items-center justify-center">
                <Ionicons name="card-outline" size={18} color="#9CA3AF" />
              </View>
              <View className="flex-1">
                <Text className="text-gray-400 font-inter-medium text-sm">
                  CPF/CNPJ
                </Text>
                <Text className="text-white font-inter-bold text-lg mt-1">
                  {clientContext.formatCPFCNPJ(client.cpfCnpj)}
                </Text>
              </View>
            </View>
          )}
          <View className="flex-row items-center gap-4 py-3 border-b border-zinc-800/50">
            <View className="w-10 h-10 bg-zinc-800/50 rounded-xl items-center justify-center">
              <Ionicons name="call-outline" size={18} color="#9CA3AF" />
            </View>
            <View className="flex-1">
              <Text className="text-gray-400 font-inter-medium text-sm">
                Telefone
              </Text>
              <Text className="text-white font-inter-bold text-lg mt-1">
                {clientContext.formatPhone(client.phone)}
              </Text>
            </View>
          </View>
          {client.email && (
            <View className="flex-row items-center gap-4 py-3 border-b border-zinc-800/50">
              <View className="w-10 h-10 bg-zinc-800/50 rounded-xl items-center justify-center">
                <Ionicons name="mail-outline" size={18} color="#9CA3AF" />
              </View>
              <View className="flex-1">
                <Text className="text-gray-400 font-inter-medium text-sm">
                  Email
                </Text>
                <Text className="text-white font-inter-bold text-lg mt-1">
                  {client.email}
                </Text>
              </View>
            </View>
          )}
          {client.publicLink && (
            <View className="flex-row items-center gap-4 py-3">
              <View className="w-10 h-10 bg-zinc-800/50 rounded-xl items-center justify-center">
                <Ionicons name="link-outline" size={18} color="#9CA3AF" />
              </View>
              <View className="flex-1">
                <Text className="text-gray-400 font-inter-medium text-sm">
                  Link do Orçamento
                </Text>
                <Text
                  className="text-white font-inter-bold text-lg mt-1"
                  numberOfLines={1}
                >
                  {client.publicLink}
                </Text>
              </View>
              <TouchableOpacity
                className="w-10 h-10 bg-blue-600/20 rounded-xl items-center justify-center"
                onPress={onShare}
              >
                <FontAwesome6 name="share" size={18} color="#3B82F6" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      <View className="bg-zinc-900/60 backdrop-blur-xl rounded-3xl p-6 border border-zinc-800/30">
        <View className="flex-row items-center gap-3 mb-6">
          <View className="w-12 h-12 bg-purple-600/20 rounded-2xl items-center justify-center">
            <Ionicons name="location" size={24} color="#A855F7" />
          </View>
          <Text className="text-white font-inter-black text-xl">Endereço</Text>
        </View>
        <View className="gap-3">
          <Text className="text-white font-inter-bold text-lg">
            {client.street}, {client.number}
          </Text>
          <Text className="text-gray-300 font-inter-medium text-base">
            {client.neighborhood}, {client.city} - {client.state}
          </Text>
          <Text className="text-gray-400 font-inter-medium text-base">
            CEP: {clientContext.formatCEP(client.cep)}
          </Text>
          <TouchableOpacity
            className="mt-3"
            onPress={() =>
              openMap(`${client.street}, ${client.number}, ${client.city}`)
            }
          >
            <LinearGradient
              colors={["#8B5CF6", "#7C3AED"]}
              style={{ borderRadius: 12 }}
              className="flex-row items-center justify-center gap-3 py-4 rounded-2xl"
            >
              <Ionicons name="map" size={20} color="white" />
              <Text className="text-white font-inter-bold text-xs">
                VER NO MAPA
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
