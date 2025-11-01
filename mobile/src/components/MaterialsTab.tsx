import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import {
  formatCurrency,
  formatDate,
  getStatusColor,
  getStatusText,
} from "../utils/formatters";
import {
  materialListContext,
  MaterialList,
  MaterialListStatus,
} from "../context/MaterialBudget";

interface Props {
  clientId: string;
}

export function MaterialsTab({ clientId }: Props) {
  const navigation = useNavigation();
  const [materialLists, setMaterialLists] = useState<MaterialList[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [menuVisible, setMenuVisible] = useState<string | null>(null);

  const fetchMaterialLists = useCallback(async () => {
    if (materialLists.length === 0) {
      setIsLoading(true);
    }
    try {
      const clientMaterialLists =
        await materialListContext.getMaterialListsByClient(clientId);

      const correctClientMaterialLists = clientMaterialLists.filter(
        (list) => list.clientId === clientId
      );

      if (correctClientMaterialLists.length !== clientMaterialLists.length) {
      }

      setMaterialLists(correctClientMaterialLists);
    } catch (error) {
      Alert.alert("Erro", "Não foi possível carregar as listas de materiais");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [clientId]);

  useFocusEffect(
    useCallback(() => {
      fetchMaterialLists();
    }, [fetchMaterialLists])
  );

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchMaterialLists();
  }, [fetchMaterialLists]);

  const handleUpdateStatus = useCallback(
    async (
      materialListId: string,
      newStatus: MaterialListStatus,
      materialListName: string
    ) => {
      const statusTexts = {
        PENDING: "pendente",
        APPROVED: "aprovada",
        REJECTED: "rejeitada",
        EXPIRED: "expirada",
      };

      const actionText = statusTexts[newStatus] || "atualizada";

      Alert.alert(
        "Confirmar alteração",
        `Deseja marcar a lista "${materialListName}" como ${actionText}?`,
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Confirmar",
            onPress: async () => {
              setUpdatingStatus(materialListId);
              try {
                await materialListContext.updateMaterialListStatus(
                  materialListId,
                  newStatus
                );

                setMaterialLists((prevLists) =>
                  prevLists.map((list) =>
                    list.id === materialListId
                      ? {
                          ...list,
                          status: newStatus,
                          updatedAt: new Date().toISOString(),
                        }
                      : list
                  )
                );

                Alert.alert(
                  "Sucesso!",
                  `Lista de materiais marcada como ${actionText} com sucesso.`
                );
              } catch (error) {
                Alert.alert(
                  "Erro",
                  "Não foi possível atualizar o status da lista de materiais. Tente novamente."
                );
              } finally {
                setUpdatingStatus(null);
              }
            },
          },
        ]
      );
    },
    []
  );

  const handleDuplicateMaterialList = useCallback(
    async (materialList: MaterialList) => {
      setMenuVisible(null);

      Alert.prompt(
        "Duplicar Lista de Materiais",
        "Digite um nome para a nova lista:",
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Criar",
            onPress: async (newName) => {
              if (!newName || newName.trim() === "") {
                Alert.alert("Erro", "Nome da lista é obrigatório");
                return;
              }

              try {
                setIsLoading(true);
                await materialListContext.duplicateMaterialList(
                  materialList.id!,
                  newName.trim()
                );
                Alert.alert(
                  "Sucesso!",
                  "Lista de materiais duplicada com sucesso"
                );
                fetchMaterialLists();
              } catch (error) {
                Alert.alert(
                  "Erro",
                  "Não foi possível duplicar a lista de materiais"
                );
              } finally {
                setIsLoading(false);
              }
            },
          },
        ],
        "plain-text",
        `${materialList.name} - Cópia`
      );
    },
    [fetchMaterialLists]
  );

  const handleDeleteMaterialList = useCallback(
    async (materialList: MaterialList) => {
      setMenuVisible(null);

      Alert.alert(
        "Confirmar exclusão",
        `Tem certeza que deseja excluir a lista "${materialList.name}"?\n\nEsta ação não pode ser desfeita.`,
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Excluir",
            style: "destructive",
            onPress: async () => {
              try {
                setIsLoading(true);

                await materialListContext.deleteMaterialList(materialList.id!);

                setMaterialLists((prevLists) =>
                  prevLists.filter((list) => list.id !== materialList.id)
                );

                Alert.alert(
                  "Sucesso!",
                  "Lista de materiais excluída com sucesso"
                );
              } catch (error) {
                Alert.alert(
                  "Erro",
                  "Não foi possível excluir a lista de materiais. Tente novamente."
                );
              } finally {
                setIsLoading(false);
              }
            },
          },
        ]
      );
    },
    []
  );

  const calculateListTotal = (list: MaterialList): number => {
    if (list.totalValue) {
      return Number(list.totalValue) || 0;
    }
    return (
      list.items?.reduce((total, item) => {
        const quantity = Number(item.quantity) || 0;
        const unitPrice = Number(item.unitPrice) || 0;
        return total + quantity * unitPrice;
      }, 0) || 0
    );
  };

  if (isLoading && materialLists.length === 0) {
    return (
      <View className="flex-1 items-center justify-center p-10">
        <ActivityIndicator size="large" color="#F59E0B" />
        <Text className="text-gray-400 mt-4">
          Buscando listas de materiais...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1"
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={onRefresh}
          tintColor="#F59E0B"
          colors={["#F59E0B"]}
        />
      }
    >
      <View className="gap-4 p-4">
        {/* Header */}
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-white font-inter-black text-base">
            LISTAS DE MATERIAIS
          </Text>
          <TouchableOpacity
            className="rounded-2xl"
            onPress={() => navigation.navigate("NewMaterial", { clientId })}
          >
            <LinearGradient
              colors={["#F59E0B", "#D97706"]}
              style={{ borderRadius: 12 }}
              className="px-6 py-3 rounded-2xl"
            >
              <View className="flex-row items-center gap-2">
                <Ionicons name="add" size={18} color="white" />
                <Text className="text-white font-inter-bold text-xs">
                  NOVA LISTA
                </Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {materialLists.length === 0 ? (
          <View className="items-center justify-center bg-zinc-900/60 rounded-3xl p-10 border border-zinc-800/30">
            <Ionicons name="cube-outline" size={40} color="#6B7280" />
            <Text className="text-gray-400 font-inter-bold text-base mt-4">
              Nenhuma lista de materiais encontrada
            </Text>
            <Text className="text-gray-500 font-inter-medium text-sm mt-1 text-center">
              Crie uma nova lista de materiais para este cliente.
            </Text>
          </View>
        ) : (
          materialLists.map((materialList) => {
            const statusText = materialList.status?.toLowerCase() || "pending";
            const statusColorClass = getStatusColor(statusText);
            let textColorClass = "text-yellow-400";

            if (materialList.status === "APPROVED")
              textColorClass = "text-green-400";
            if (
              materialList.status === "REJECTED" ||
              materialList.status === "EXPIRED"
            )
              textColorClass = "text-red-400";

            const listTotal = calculateListTotal(materialList);
            const itemCount = materialList.items?.length || 0;

            return (
              <View
                key={materialList.id}
                className="bg-zinc-900/60 backdrop-blur-xl rounded-3xl p-6 border border-zinc-800/30"
              >
                <View className="flex-row items-start justify-between mb-4">
                  <View className="flex-1 mr-4">
                    <Text className="text-white font-inter-black text-base mb-2">
                      {materialList.name}
                    </Text>
                    <Text className="text-green-400 font-inter-black text-2xl">
                      {formatCurrency(listTotal)}
                    </Text>
                  </View>

                  <View
                    className={`px-4 py-2 rounded-2xl ${statusColorClass}/20 ${statusColorClass}/30`}
                  >
                    <Text
                      className={`font-inter-bold text-sm ${textColorClass}`}
                    >
                      {getStatusText(statusText)}
                    </Text>
                  </View>
                </View>

                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-4">
                    <View className="flex-row items-center gap-2">
                      <Ionicons name="calendar" size={16} color="#9CA3AF" />
                      <Text className="text-gray-400 font-inter-medium text-sm">
                        {formatDate(materialList.createdAt || "")}
                      </Text>
                    </View>
                    <View className="flex-row items-center gap-2">
                      <Ionicons name="cube" size={16} color="#9CA3AF" />
                      <Text className="text-gray-400 font-inter-medium text-sm">
                        {itemCount} {itemCount === 1 ? "item" : "itens"}
                      </Text>
                    </View>
                  </View>

                  <View className="flex-row items-center gap-2">
                    <TouchableOpacity
                      className="w-10 h-10 bg-zinc-800/50 rounded-xl items-center justify-center"
                      onPress={() => {
                        if (materialList.id) {
                          navigation.navigate("MaterialDetails", {
                            materialListId: materialList.id,
                          });
                        }
                      }}
                    >
                      <Ionicons name="eye-outline" size={18} color="#F59E0B" />
                    </TouchableOpacity>

                    <TouchableOpacity
                      className="w-10 h-10 bg-zinc-800/50 rounded-xl items-center justify-center"
                      onPress={() =>
                        setMenuVisible(
                          menuVisible === materialList.id
                            ? null
                            : materialList.id!
                        )
                      }
                    >
                      <Ionicons
                        name="ellipsis-horizontal"
                        size={18}
                        color="#9CA3AF"
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {menuVisible === materialList.id && (
                  <View className="mt-4 pt-4 border-t border-zinc-800/30">
                    <View className="gap-2">
                      {/* Duplicar */}
                      <TouchableOpacity
                        className="flex-row items-center gap-3 bg-zinc-800/30 rounded-xl p-3"
                        onPress={() =>
                          handleDuplicateMaterialList(materialList)
                        }
                      >
                        <View className="w-8 h-8 bg-orange-600/20 rounded-lg items-center justify-center">
                          <Ionicons
                            name="copy-outline"
                            size={16}
                            color="#F59E0B"
                          />
                        </View>
                        <Text className="text-white font-inter-semibold text-sm">
                          Duplicar lista
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        className="flex-row items-center gap-3 bg-red-600/10 rounded-xl p-3 border border-red-600/20"
                        onPress={() => handleDeleteMaterialList(materialList)}
                      >
                        <View className="w-8 h-8 bg-red-600/20 rounded-lg items-center justify-center">
                          <Ionicons
                            name="trash-outline"
                            size={16}
                            color="#EF4444"
                          />
                        </View>
                        <Text className="text-red-400 font-inter-semibold text-sm">
                          Excluir lista
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {materialList.updatedAt &&
                  materialList.updatedAt !== materialList.createdAt && (
                    <View className="mt-3 pt-3 border-t border-zinc-800/30">
                      <Text className="text-gray-500 font-inter-medium text-xs">
                        Atualizado em: {formatDate(materialList.updatedAt)}
                      </Text>
                    </View>
                  )}

                {materialList.notes && (
                  <View className="mt-2">
                    <Text className="text-gray-400 font-inter-medium text-xs">
                      {materialList.notes}
                    </Text>
                  </View>
                )}
              </View>
            );
          })
        )}
      </View>
    </ScrollView>
  );
}
