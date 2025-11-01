import React from "react";
import { Modal, View, Text, TouchableOpacity, Share, Alert } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, FontAwesome6 } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { Client } from "../../hooks/useClientData";

interface Props {
  visible: boolean;
  onClose: () => void;
  client: Client | null;
}

export function ShareModal({ visible, onClose, client }: Props) {
  if (!client) return null;

  const sharePublicLink = async () => {
    if (!client.publicLink) {
      Alert.alert("Aviso", "Cliente não possui link de orçamento.");
      return;
    }
    try {
      const message = `Olá ${client.fullName}! Aqui está seu orçamento e lista de materiais: ${client.publicLink}`;
      await Share.share({
        message: message,
        url: client.publicLink,
        title: `Orçamento - ${client.fullName}`,
      });
      onClose();
    } catch (error) {
      Alert.alert("Erro", "Não foi possível compartilhar o link.");
    }
  };

  const copyLinkWithMessage = async () => {
    if (!client.publicLink) {
      Alert.alert("Aviso", "Cliente não possui link de orçamento.");
      return;
    }
    try {
      const message = `Olá ${client.fullName}! Aqui está seu orçamento e lista de materiais: ${client.publicLink}`;
      await Clipboard.setStringAsync(message);
      Alert.alert("Copiado!", "Mensagem e link copiados para a área de transferência.");
      onClose();
    } catch (error) {
      Alert.alert("Erro", "Não foi possível copiar o link.");
    }
  };

  return (
    <Modal visible={visible} animationType="fade" transparent={true} onRequestClose={onClose}>
      <View className="flex-1 bg-black/50 items-center justify-center px-6">
        <View className="bg-zinc-900 rounded-3xl p-8 w-full border border-zinc-800/30">
          <View className="items-center mb-8">
            <View className="w-16 h-16 bg-blue-600/20 rounded-full items-center justify-center mb-4">
              <FontAwesome6 name="share" size={24} color="#60A5FA" />
            </View>
            <Text className="text-white font-inter-black text-xl mb-2">Compartilhar Orçamento</Text>
            <Text className="text-gray-400 font-inter-medium text-sm text-center">{client.fullName}</Text>
          </View>

          <View className="gap-3 mb-6">
            <TouchableOpacity onPress={sharePublicLink} className="active:scale-95">
              <LinearGradient
                colors={["#3B82F6", "#1E40AF"]}
                style={{borderRadius: 16,}}
                className="flex-row items-center gap-4 p-4 rounded-2xl"
              >
                <View className="w-12 h-12 bg-white/20 rounded-2xl items-center justify-center">
                  <Ionicons name="share-social" size={20} color="white" />
                </View>
                <View className="flex-1">
                  <Text className="text-white font-inter-bold text-base">Compartilhar</Text>
                  <Text className="text-blue-100 font-inter-medium text-sm opacity-80">Enviar via WhatsApp, etc.</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="white" />
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity onPress={copyLinkWithMessage} className="active:scale-95">
              <View className="flex-row items-center gap-4 p-4 rounded-2xl bg-zinc-800/60 border border-zinc-700/40">
                <View className="w-12 h-12 bg-green-600/20 rounded-2xl items-center justify-center">
                  <Ionicons name="copy" size={20} color="#10B981" />
                </View>
                <View className="flex-1">
                  <Text className="text-white font-inter-bold text-base">Copiar Mensagem</Text>
                  <Text className="text-gray-400 font-inter-medium text-sm">Copiar para área de transferência</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
              </View>
            </TouchableOpacity>

            <View className="mt-4 p-4 rounded-2xl bg-zinc-800/30 border border-zinc-700/20">
              <Text className="text-gray-400 font-inter-medium text-xs mb-2 uppercase tracking-wider">Preview da Mensagem</Text>
              <Text className="text-gray-300 font-inter-medium text-sm leading-5">
                Olá {client.fullName}! Aqui está seu orçamento e lista de materiais: {client.publicLink}
              </Text>
            </View>
          </View>

          <TouchableOpacity onPress={onClose} className="active:scale-95">
            <View className="bg-zinc-800/40 border border-zinc-700/30 py-4 rounded-2xl">
              <Text className="text-gray-400 font-inter-bold text-base text-center">Cancelar</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
