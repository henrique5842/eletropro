import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  Modal,
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
import { budgetContext, Budget, BudgetStatus } from "../context/BudgetContext";

interface Props {
  clientId: string;
}

export function QuotesTab({ clientId }: Props) {
  const navigation = useNavigation();
  const [quotes, setQuotes] = useState<Budget[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [menuVisible, setMenuVisible] = useState<string | null>(null);

  const fetchQuotes = useCallback(async () => {
    if (quotes.length === 0) {
      setIsLoading(true);
    }
    try {
      

      const clientQuotes = await budgetContext.getBudgetsByClient(clientId);

      

      const correctClientQuotes = clientQuotes.filter(
        (quote) => quote.clientId === clientId
      );

      if (correctClientQuotes.length !== clientQuotes.length) {
   
      }

      setQuotes(correctClientQuotes);
    } catch (error) {
    
      Alert.alert("Erro", "Não foi possível carregar os orçamentos");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [clientId]);

  useFocusEffect(
    useCallback(() => {
      fetchQuotes();
    }, [fetchQuotes])
  );

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchQuotes();
  }, [fetchQuotes]);

  const handleUpdateStatus = useCallback(
    async (quoteId: string, newStatus: BudgetStatus, quoteName: string) => {
      const statusTexts = {
        PENDING: "pendente",
        APPROVED: "aprovado",
        REJECTED: "rejeitado",
        EXPIRED: "expirado",
      };

      const actionText = statusTexts[newStatus] || "atualizado";

      Alert.alert(
        "Confirmar alteração",
        `Deseja marcar o orçamento "${quoteName}" como ${actionText}?`,
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Confirmar",
            onPress: async () => {
              setUpdatingStatus(quoteId);
              try {
                await budgetContext.updateBudgetStatus(quoteId, newStatus);

                setQuotes((prevQuotes) =>
                  prevQuotes.map((quote) =>
                    quote.id === quoteId
                      ? {
                          ...quote,
                          status: newStatus,
                          updatedAt: new Date().toISOString(),
                        }
                      : quote
                  )
                );

                Alert.alert(
                  "Sucesso!",
                  `Orçamento marcado como ${actionText} com sucesso.`
                );
              } catch (error) {
              
                Alert.alert(
                  "Erro",
                  "Não foi possível atualizar o status do orçamento. Tente novamente."
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

  const handleDuplicateQuote = useCallback(
    async (quote: Budget) => {
      setMenuVisible(null);

      Alert.prompt(
        "Duplicar Orçamento",
        "Digite um nome para o novo orçamento:",
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Criar",
            onPress: async (newName) => {
              if (!newName || newName.trim() === "") {
                Alert.alert("Erro", "Nome do orçamento é obrigatório");
                return;
              }

              try {
                setIsLoading(true);
                await budgetContext.duplicateBudget(quote.id!, newName.trim());
                Alert.alert("Sucesso!", "Orçamento duplicado com sucesso");
                fetchQuotes();
              } catch (error) {
                
                Alert.alert("Erro", "Não foi possível duplicar o orçamento");
              } finally {
                setIsLoading(false);
              }
            },
          },
        ],
        "plain-text",
        `${quote.name} - Cópia`
      );
    },
    [fetchQuotes]
  );

  const handleDeleteQuote = useCallback(async (quote: Budget) => {
    setMenuVisible(null);

    Alert.alert(
      "Confirmar exclusão",
      `Tem certeza que deseja excluir o orçamento "${quote.name}"?\n\nEsta ação não pode ser desfeita.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              setIsLoading(true);
              

              await budgetContext.deleteBudget(quote.id!);

              setQuotes((prevQuotes) =>
                prevQuotes.filter((q) => q.id !== quote.id)
              );

              Alert.alert("Sucesso!", "Orçamento excluído com sucesso");
            } catch (error) {
              
              Alert.alert(
                "Erro",
                "Não foi possível excluir o orçamento. Tente novamente."
              );
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  }, []);

  if (isLoading && quotes.length === 0) {
    return (
      <View className="flex-1 items-center justify-center p-10">
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text className="text-gray-400 mt-4">Buscando orçamentos...</Text>
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
          tintColor="#3B82F6"
          colors={["#3B82F6"]}
        />
      }
    >
      <View className="gap-4 p-4">
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-white font-inter-black text-base">
            ORÇAMENTOS
          </Text>
          <TouchableOpacity
            className="rounded-2xl"
            onPress={() => navigation.navigate("NewQuote", { clientId })}
          >
            <LinearGradient
              colors={["#10B981", "#059669"]}
              style={{ borderRadius: 12 }}
              className="px-6 py-3 rounded-2xl"
            >
              <View className="flex-row items-center gap-2">
                <Ionicons name="add" size={18} color="white" />
                <Text className="text-white font-inter-bold text-xs">
                  NOVO ORÇAMENTO
                </Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {quotes.length === 0 ? (
          <View className="items-center justify-center bg-zinc-900/60 rounded-3xl p-10 border border-zinc-800/30">
            <Ionicons name="document-text-outline" size={40} color="#6B7280" />
            <Text className="text-gray-400 font-inter-bold text-base mt-4">
              Nenhum orçamento encontrado
            </Text>
            <Text className="text-gray-500 font-inter-medium text-sm mt-1 text-center">
              Crie um novo orçamento para este cliente.
            </Text>
          </View>
        ) : (
          quotes.map((quote) => {
            const statusText = quote.status?.toLowerCase() || "pending";
            const statusColorClass = getStatusColor(statusText);
            let textColorClass = "text-yellow-400";

            if (quote.status === "APPROVED") textColorClass = "text-green-400";
            if (quote.status === "REJECTED" || quote.status === "EXPIRED")
              textColorClass = "text-red-400";

            return (
              <View
                key={quote.id}
                className="bg-zinc-900/60 backdrop-blur-xl rounded-3xl p-6 border border-zinc-800/30"
              >
                <View className="flex-row items-start justify-between mb-4">
                  <View className="flex-1 mr-4">
                    <Text className="text-white font-inter-black text-base mb-2">
                      {quote.name}
                    </Text>
                    <Text className="text-green-400 font-inter-black text-2xl">
                      {formatCurrency(quote.totalValue || 0)}
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
                        {formatDate(quote.createdAt || "")}
                      </Text>
                    </View>
                    <View className="flex-row items-center gap-2">
                      <Ionicons name="cube" size={16} color="#9CA3AF" />
                      <Text className="text-gray-400 font-inter-medium text-sm">
                        {quote.items?.length || 0} itens
                      </Text>
                    </View>
                  </View>

                  <View className="flex-row items-center gap-2">
                    <TouchableOpacity
                      className="w-10 h-10 bg-zinc-800/50 rounded-xl items-center justify-center"
                      onPress={() => {
                        if (quote.id) {
                          navigation.navigate("QuoteDetails", {
                            quoteId: quote.id,
                            quoteName: quote.name,
                          });
                        }
                      }}
                    >
                      <Ionicons name="eye-outline" size={18} color="#60A5FA" />
                    </TouchableOpacity>

                    <TouchableOpacity
                      className="w-10 h-10 bg-zinc-800/50 rounded-xl items-center justify-center"
                      onPress={() =>
                        setMenuVisible(
                          menuVisible === quote.id ? null : quote.id!
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

                {menuVisible === quote.id && (
                  <View className="mt-4 pt-4 border-t border-zinc-800/30">
                    <View className="gap-2">
                      {/* Duplicar */}
                      <TouchableOpacity
                        className="flex-row items-center gap-3 bg-zinc-800/30 rounded-xl p-3"
                        onPress={() => handleDuplicateQuote(quote)}
                      >
                        <View className="w-8 h-8 bg-blue-600/20 rounded-lg items-center justify-center">
                          <Ionicons
                            name="copy-outline"
                            size={16}
                            color="#60A5FA"
                          />
                        </View>
                        <Text className="text-white font-inter-semibold text-sm">
                          Duplicar orçamento
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        className="flex-row items-center gap-3 bg-red-600/10 rounded-xl p-3 border border-red-600/20"
                        onPress={() => handleDeleteQuote(quote)}
                      >
                        <View className="w-8 h-8 bg-red-600/20 rounded-lg items-center justify-center">
                          <Ionicons
                            name="trash-outline"
                            size={16}
                            color="#EF4444"
                          />
                        </View>
                        <Text className="text-red-400 font-inter-semibold text-sm">
                          Excluir orçamento
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {quote.updatedAt && quote.updatedAt !== quote.createdAt && (
                  <View className="mt-3 pt-3 border-t border-zinc-800/30">
                    <Text className="text-gray-500 font-inter-medium text-xs">
                      Atualizado em: {formatDate(quote.updatedAt)}
                    </Text>
                  </View>
                )}

                {quote.validUntil && (
                  <View className="mt-2">
                    <View className="flex-row items-center gap-2">
                      <Ionicons name="time-outline" size={14} color="#9CA3AF" />
                      <Text className="text-gray-400 font-inter-medium text-xs">
                        Válido até: {formatDate(quote.validUntil)}
                      </Text>
                    </View>
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
