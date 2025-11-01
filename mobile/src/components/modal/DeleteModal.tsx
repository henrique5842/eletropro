import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { Client } from "../../hooks/useClientData";
import { clientContext } from "../../context/ClientContext";

interface Props {
  visible: boolean;
  onClose: () => void;
  client: Client | null;
}

export function DeleteModal({ visible, onClose, client }: Props) {
  const navigation = useNavigation();
  const [isDeleting, setIsDeleting] = useState(false);

  if (!client) return null;

  const confirmDeleteClient = async () => {
    setIsDeleting(true);
    try {
      await clientContext.deleteClient(client.id);
      Alert.alert("Cliente excluído", "O cliente foi excluído com sucesso.", [
        {
          text: "OK",
          onPress: () => {
            onClose();
            navigation.goBack();
          },
        },
      ]);
    } catch (error) {
      console.error("Erro ao excluir cliente:", error);
      Alert.alert("Erro ao excluir", "Ocorreu um erro ao excluir o cliente.");
      setIsDeleting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={() => !isDeleting && onClose()}
    >
      <View className="flex-1 bg-black/50 items-center justify-center px-6">
        <View className="bg-zinc-900 rounded-3xl p-8 w-full border border-zinc-800/30">
          <View className="items-center mb-8">
            <View className="w-16 h-16 bg-red-600/20 rounded-full items-center justify-center mb-4">
              <Ionicons name="warning" size={24} color="#EF4444" />
            </View>
            <Text className="text-white font-inter-black text-xl mb-2">
              Confirmar Exclusão
            </Text>
            <Text className="text-gray-400 font-inter-medium text-sm text-center">
              Tem certeza que deseja excluir o cliente{" "}
              <Text className="text-white font-inter-bold">
                {client.fullName}
              </Text>
              ?
            </Text>
            <Text className="text-red-400 font-inter-medium text-sm text-center mt-2">
              Esta ação não pode ser desfeita.
            </Text>
          </View>

          <View className="gap-3">
            <TouchableOpacity
              onPress={confirmDeleteClient}
              disabled={isDeleting}
              className="active:scale-95"
            >
              <LinearGradient
                colors={
                  
                  isDeleting ? ["#6B7280", "#4B5563"] : ["#EF4444", "#DC2626"]
                }
                style={{borderRadius: 16,}}
                className="py-4 rounded-2xl"
              >
                <View className="flex-row items-center justify-center gap-3">
                  {isDeleting ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Ionicons name="trash" size={20} color="white" />
                  )}
                  <Text className="text-white font-inter-bold text-base">
                    {isDeleting ? "Excluindo..." : "Sim, Excluir"}
                  </Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onClose}
              disabled={isDeleting}
              className="active:scale-95"
            >
              <View className="bg-zinc-800/40 border border-zinc-700/30 py-4 rounded-2xl">
                <Text className="text-gray-400 font-inter-bold text-base text-center">
                  Cancelar
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
