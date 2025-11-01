import React, { useState, useEffect } from "react";
import {
  Modal,
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { Client } from "../../hooks/useClientData";
import { clientContext } from "../../context/ClientContext";

interface Props {
  visible: boolean;
  onClose: () => void;
  client: Client;
  onSave: (updatedClient: Client) => void;
}

export function EditClientModal({ visible, onClose, client, onSave }: Props) {
  const [editedData, setEditedData] = useState(client);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingCEP, setIsLoadingCEP] = useState(false);

  useEffect(() => {
    setEditedData(client);
  }, [client]);

  const handleChange = (field: keyof typeof editedData, value: string) => {
    setEditedData((prev) => ({ ...prev, [field]: value }));
  };

  const handleCEPChange = async (cep: string) => {
    const cleanCEP = cep.replace(/\D/g, "");
    handleChange("cep", cleanCEP);

    if (cleanCEP.length === 8) {
      setIsLoadingCEP(true);
      try {
        const address = await clientContext.searchAddressByCEP(cleanCEP);
        setEditedData((prev) => ({
          ...prev,
          street: address.street || prev.street,
          neighborhood: address.neighborhood || prev.neighborhood,
          city: address.city || prev.city,
          state: address.state || prev.state,
        }));
      } catch (error) {
        console.error("Erro ao buscar CEP:", error);
      } finally {
        setIsLoadingCEP(false);
      }
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updateData = {
        fullName: editedData.fullName.trim(),
        phone: editedData.phone.replace(/\D/g, ""),
        email: editedData.email?.trim(),
        cpfCnpj: editedData.cpfCnpj?.replace(/\D/g, ""),
        cep: editedData.cep.replace(/\D/g, ""),
        street: editedData.street.trim(),
        number: editedData.number.trim(),
        neighborhood: editedData.neighborhood.trim(),
        city: editedData.city.trim(),
        state: editedData.state.trim().toUpperCase(),
      };

      const validation = clientContext.validateClientData({
        ...updateData,
        requiresInvoice: client.requiresInvoice,
      });

      if (!validation.isValid) {
        Alert.alert(
          "Dados inválidos",
          validation.error || "Verifique os dados."
        );
        return;
      }

      const updatedClient = await clientContext.updateClient(
        client.id,
        updateData
      );
      onSave(updatedClient);
      Alert.alert("Sucesso", "Dados do cliente atualizados!");
      onClose();
    } catch (error) {
      console.error(error);
      Alert.alert("Erro", "Não foi possível salvar as alterações.");
    } finally {
      setIsSaving(false);
    }
  };

  const formatPhoneInput = (text: string) => {
    const cleaned = text.replace(/\D/g, "");
    if (cleaned.length <= 11) {
      handleChange("phone", cleaned);
    }
  };

  const formatCPFCNPJInput = (text: string) => {
    const cleaned = text.replace(/\D/g, "");
    if (cleaned.length <= 14) {
      handleChange("cpfCnpj", cleaned);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView className="flex-1 bg-neutral-900">
        <ScrollView
          className="flex-1 px-6 py-6"
          showsVerticalScrollIndicator={false}
        >
          <View className="gap-6">
            <View className="bg-zinc-900/60 rounded-3xl p-6 border border-zinc-800/30">
              <View className="flex-row items-center gap-3 mb-6">
                <View className="w-12 h-12 bg-blue-600/20 rounded-2xl items-center justify-center">
                  <Ionicons name="person" size={24} color="#60A5FA" />
                </View>
                <Text className="text-white font-inter-black text-xl">
                  Dados Pessoais
                </Text>
              </View>

              <View className="gap-4">
                <View>
                  <Text className="text-gray-400 font-inter-medium text-sm mb-2">
                    Nome Completo *
                  </Text>
                  <View className="bg-zinc-800/50 rounded-2xl px-4 py-4 border border-zinc-700/30">
                    <TextInput
                      value={editedData.fullName}
                      onChangeText={(text) => handleChange("fullName", text)}
                      placeholder="Digite o nome completo"
                      placeholderTextColor="#6B7280"
                      className="text-white font-inter-medium text-base"
                    />
                  </View>
                </View>

                <View>
                  <Text className="text-gray-400 font-inter-medium text-sm mb-2">
                    Telefone *
                  </Text>
                  <View className="bg-zinc-800/50 rounded-2xl px-4 py-4 border border-zinc-700/30">
                    <TextInput
                      value={clientContext.formatPhone(editedData.phone)}
                      onChangeText={formatPhoneInput}
                      placeholder="(00) 00000-0000"
                      placeholderTextColor="#6B7280"
                      keyboardType="phone-pad"
                      className="text-white font-inter-medium text-base"
                    />
                  </View>
                </View>

                <View>
                  <Text className="text-gray-400 font-inter-medium text-sm mb-2">
                    Email
                  </Text>
                  <View className="bg-zinc-800/50 rounded-2xl px-4 py-4 border border-zinc-700/30">
                    <TextInput
                      value={editedData.email || ""}
                      onChangeText={(text) => handleChange("email", text)}
                      placeholder="email@exemplo.com"
                      placeholderTextColor="#6B7280"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      className="text-white font-inter-medium text-base"
                    />
                  </View>
                </View>

                <View>
                  <Text className="text-gray-400 font-inter-medium text-sm mb-2">
                    CPF/CNPJ
                  </Text>
                  <View className="bg-zinc-800/50 rounded-2xl px-4 py-4 border border-zinc-700/30">
                    <TextInput
                      value={
                        editedData.cpfCnpj
                          ? clientContext.formatCPFCNPJ(editedData.cpfCnpj)
                          : ""
                      }
                      onChangeText={formatCPFCNPJInput}
                      placeholder="000.000.000-00"
                      placeholderTextColor="#6B7280"
                      keyboardType="numeric"
                      className="text-white font-inter-medium text-base"
                    />
                  </View>
                </View>
              </View>
            </View>

            <View className="bg-zinc-900/60 rounded-3xl p-6 border border-zinc-800/30">
              <View className="flex-row items-center gap-3 mb-6">
                <View className="w-12 h-12 bg-purple-600/20 rounded-2xl items-center justify-center">
                  <Ionicons name="location" size={24} color="#A855F7" />
                </View>
                <Text className="text-white font-inter-black text-xl">
                  Endereço
                </Text>
              </View>

              <View className="gap-4">
                <View>
                  <Text className="text-gray-400 font-inter-medium text-sm mb-2">
                    CEP *
                  </Text>
                  <View className="bg-zinc-800/50 rounded-2xl px-4 py-4 border border-zinc-700/30 flex-row items-center">
                    <TextInput
                      value={clientContext.formatCEP(editedData.cep)}
                      onChangeText={handleCEPChange}
                      placeholder="00000-000"
                      placeholderTextColor="#6B7280"
                      keyboardType="numeric"
                      className="flex-1 text-white font-inter-medium text-base"
                    />
                    {isLoadingCEP && (
                      <ActivityIndicator
                        size="small"
                        color="#60A5FA"
                        className="ml-2"
                      />
                    )}
                  </View>
                </View>

                <View>
                  <Text className="text-gray-400 font-inter-medium text-sm mb-2">
                    Rua *
                  </Text>
                  <View className="bg-zinc-800/50 rounded-2xl px-4 py-4 border border-zinc-700/30">
                    <TextInput
                      value={editedData.street}
                      onChangeText={(text) => handleChange("street", text)}
                      placeholder="Nome da rua"
                      placeholderTextColor="#6B7280"
                      className="text-white font-inter-medium text-base"
                    />
                  </View>
                </View>

                <View>
                  <Text className="text-gray-400 font-inter-medium text-sm mb-2">
                    Número *
                  </Text>
                  <View className="bg-zinc-800/50 rounded-2xl px-4 py-4 border border-zinc-700/30">
                    <TextInput
                      value={editedData.number}
                      onChangeText={(text) => handleChange("number", text)}
                      placeholder="123"
                      placeholderTextColor="#6B7280"
                      className="text-white font-inter-medium text-base"
                    />
                  </View>
                </View>

                <View>
                  <Text className="text-gray-400 font-inter-medium text-sm mb-2">
                    Bairro *
                  </Text>
                  <View className="bg-zinc-800/50 rounded-2xl px-4 py-4 border border-zinc-700/30">
                    <TextInput
                      value={editedData.neighborhood}
                      onChangeText={(text) =>
                        handleChange("neighborhood", text)
                      }
                      placeholder="Nome do bairro"
                      placeholderTextColor="#6B7280"
                      className="text-white font-inter-medium text-base"
                    />
                  </View>
                </View>

                <View className="flex-row gap-3">
                  <View className="flex-[2]">
                    <Text className="text-gray-400 font-inter-medium text-sm mb-2">
                      Cidade *
                    </Text>
                    <View className="bg-zinc-800/50 rounded-2xl px-4 py-4 border border-zinc-700/30">
                      <TextInput
                        value={editedData.city}
                        onChangeText={(text) => handleChange("city", text)}
                        placeholder="Nome da cidade"
                        placeholderTextColor="#6B7280"
                        className="text-white font-inter-medium text-base"
                      />
                    </View>
                  </View>

                  <View className="flex-1">
                    <Text className="text-gray-400 font-inter-medium text-sm mb-2">
                      UF *
                    </Text>
                    <View className="bg-zinc-800/50 rounded-2xl px-4 py-4 border border-zinc-700/30">
                      <TextInput
                        value={editedData.state}
                        onChangeText={(text) =>
                          handleChange("state", text.toUpperCase())
                        }
                        placeholder="SP"
                        placeholderTextColor="#6B7280"
                        maxLength={2}
                        autoCapitalize="characters"
                        className="text-white font-inter-medium text-base text-center"
                      />
                    </View>
                  </View>
                </View>
              </View>
            </View>

            <View className="bg-amber-600/10 rounded-2xl p-4 border border-amber-600/30">
              <View className="flex-row items-start gap-3">
                <Ionicons name="information-circle" size={20} color="#F59E0B" />
                <Text className="flex-1 text-amber-400 font-inter-medium text-sm">
                  Campos marcados com * são obrigatórios
                </Text>
              </View>
            </View>

            <View className="gap-3 mt-4 mb-5">
              <TouchableOpacity onPress={handleSave} disabled={isSaving}>
                <LinearGradient
                  colors={
                    isSaving ? ["#6B7280", "#4B5563"] : ["#10B981", "#059669"]
                  }
                  className="py-4 rounded-2xl"
                  style={{ borderRadius: 16 }}
                >
                  <View className="flex-row items-center justify-center gap-3">
                    {isSaving ? (
                      <ActivityIndicator color="white" />
                    ) : (
                      <Ionicons
                        name="checkmark-circle"
                        size={22}
                        color="white"
                      />
                    )}
                    <Text className="text-white font-inter-bold text-lg">
                      {isSaving ? "Salvando..." : "Salvar Alterações"}
                    </Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity onPress={onClose} disabled={isSaving}>
                <View className="bg-zinc-800/60 border border-zinc-700/40 py-4 rounded-2xl mb-8">
                  <View className="flex-row items-center justify-center gap-3">
                    <Ionicons name="close-circle" size={22} color="#9CA3AF" />
                    <Text className="text-gray-400 font-inter-bold text-lg">
                      Cancelar
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
