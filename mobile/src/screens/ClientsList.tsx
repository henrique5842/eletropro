import {
  SafeAreaView,
  View,
  TouchableOpacity,
  Text,
  ScrollView,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useState, useEffect, useCallback } from "react";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { clientContext } from "../context/ClientContext";

import Clipboard from "expo-clipboard";

interface Client {
  id: string;
  fullName: string;
  phone: string;
  email?: string;
  cpfCnpj?: string;
  requiresInvoice: boolean;
  cep: string;
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
  totalValue: number;
  clientSince: string;
  createdAt: string;
  updatedAt: string;
}

interface ClientStats {
  totalClients: number;
  totalValue: number;
  recentClients: number;
  activeProjects: number;
}

export function ClientsList() {
  const [searchText, setSearchText] = useState("");
  const [filterActive, setFilterActive] = useState("todos");
  const [clients, setClients] = useState<Client[]>([]);
  const [stats, setStats] = useState<ClientStats>({
    totalClients: 0,
    totalValue: 0,
    recentClients: 0,
    activeProjects: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const navigation = useNavigation();

  function handleBack() {
    navigation.goBack();
  }

  function handleAddClient() {
    navigation.navigate("ClientRegistration");
  }

  function handleClientDetails(clientId: string) {
    navigation.navigate("ClientDetails", { clientId });
  }

  const generateAvatar = (name: string): string => {
    const words = name.trim().split(' ');
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return words[0]?.substring(0, 2).toUpperCase() || 'CL';
  };

  const generateColor = (id: string): [string, string] => {
    const colors: [string, string][] = [
      ["#3B82F6", "#1E40AF"],
      ["#10B981", "#059669"],
      ["#F59E0B", "#D97706"],
      ["#8B5CF6", "#7C3AED"],
      ["#EF4444", "#DC2626"],
      ["#06B6D4", "#0891B2"],
      ["#EC4899", "#DB2777"],
      ["#84CC16", "#65A30D"],
    ];
    
    const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  const getClientStatus = (updatedAt: string): 'ativo' | 'inativo' | 'pendente' => {
    const lastUpdate = new Date(updatedAt);
    const now = new Date();
    const daysDiff = Math.floor((now.getTime() - lastUpdate.getTime()) / (1000 * 3600 * 24));
    
    if (daysDiff <= 30) return 'ativo';
    if (daysDiff <= 90) return 'pendente';
    return 'inativo';
  };

  const loadClients = async (showLoading = true) => {
  try {
    if (showLoading) setIsLoading(true);
    
    const clientsData = await clientContext.getClients();
    
    const clientsWithStatus = clientsData.map(client => ({
      ...client,
      status: getClientStatus(client.updatedAt)
    }));

    const calculatedStats: ClientStats = {
      totalClients: clientsData.length,
      totalValue: clientsData.reduce((sum, client) => sum + (client.totalValue || 0), 0),
      recentClients: clientsWithStatus.filter(c => {
        const daysSince = Math.floor((new Date().getTime() - new Date(c.createdAt).getTime()) / (1000 * 3600 * 24));
        return daysSince <= 30;
      }).length,
      activeProjects: clientsWithStatus.filter(c => c.status === 'ativo').length,
    };
    
    setClients(clientsData);
    setStats(calculatedStats);
    
  } catch (error) {
    Alert.alert(
      "Erro ao carregar",
      "Não foi possível carregar a lista de clientes. Tente novamente.",
      [
        { text: "Tentar novamente", onPress: () => loadClients() },
        { text: "OK" }
      ]
    );
  } finally {
    setIsLoading(false);
  }
};

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadClients(false);
    setIsRefreshing(false);
  }, []);

  useFocusEffect(
  useCallback(() => {
    setClients([]);
    setStats({
      totalClients: 0,
      totalValue: 0,
      recentClients: 0,
      activeProjects: 0,
    });
    
    const timer = setTimeout(() => {
      loadClients(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, [])
);

  const getFilters = () => {
    const clientsWithStatus = clients.map(client => ({
      ...client,
      status: getClientStatus(client.updatedAt)
    }));

    return [
      { id: "todos", label: "Todos", count: clients.length },
      {
        id: "ativo",
        label: "Ativos",
        count: clientsWithStatus.filter((c) => c.status === "ativo").length,
      },
      {
        id: "inativo",
        label: "Inativos",
        count: clientsWithStatus.filter((c) => c.status === "inativo").length,
      },
      {
        id: "pendente",
        label: "Pendentes",
        count: clientsWithStatus.filter((c) => c.status === "pendente").length,
      },
    ];
  };

  const filters = getFilters();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ativo":
        return "bg-green-500";
      case "inativo":
        return "bg-gray-500";
      case "pendente":
        return "bg-yellow-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "ativo":
        return "Ativo";
      case "inativo":
        return "Inativo";
      case "pendente":
        return "Pendente";
      default:
        return "Desconhecido";
    }
  };

  const filteredClients = clients.filter((client) => {
    const matchesSearch =
      client.fullName.toLowerCase().includes(searchText.toLowerCase()) ||
      client.email?.toLowerCase().includes(searchText.toLowerCase()) ||
      client.phone.includes(searchText.replace(/\D/g, '')) ||
      client.city.toLowerCase().includes(searchText.toLowerCase());

    if (filterActive === "todos") return matchesSearch;
    
    const clientStatus = getClientStatus(client.updatedAt);
    return matchesSearch && clientStatus === filterActive;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR");
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

 const copyPhoneNumber = (phoneNumber: string) => {
   if (!phoneNumber) {
     Alert.alert("Erro", "Número de telefone inválido");
     return;
   }
 
   const cleanedNumber = phoneNumber.replace(/\D/g, "");
   Clipboard.setString(cleanedNumber);
 };

  const sendEmail = (email?: string) => {
    if (!email) {
      Alert.alert("Aviso", "Cliente não possui email cadastrado.");
      return;
    }
    Alert.alert("Email", `Enviando email para ${email}`);
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-neutral-900">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text className="text-gray-400 font-inter-medium text-sm mt-4">
            Carregando clientes...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-neutral-900">
      <ScrollView 
        className="flex-1 px-6" 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={["#3B82F6"]}
            tintColor="#3B82F6"
          />
        }
      >
        <View className="mt-16 mb-8">
          <View className="flex-row items-center justify-between mb-6">
            <TouchableOpacity 
              className="w-12 h-12 bg-zinc-800/50 rounded-2xl items-center justify-center border border-zinc-700/50" 
              onPress={handleBack}
            >
              <Ionicons name="chevron-back" size={22} color="#60A5FA" />
            </TouchableOpacity>

            <View className="flex-1 mx-4">
              <Text className="text-white font-inter-black text-base text-center">
                LISTA DE CLIENTES
              </Text>
              <Text className="text-gray-400 font-inter-medium text-xs text-center mt-1">
                {filteredClients.length} cliente
                {filteredClients.length !== 1 ? "s" : ""} encontrado
                {filteredClients.length !== 1 ? "s" : ""}
              </Text>
            </View>

            <TouchableOpacity 
              className="w-12 h-12 bg-zinc-800/50 rounded-2xl items-center justify-center border border-zinc-700/50"
              onPress={handleAddClient}
            >
              <Ionicons name="add" size={22} color="#60A5FA" />
            </TouchableOpacity>
          </View>

          <View className="bg-zinc-900/80 backdrop-blur-xl rounded-2xl p-4 border border-zinc-700 mb-4 mt-5">
            <View className="flex-row items-center gap-3">
              <Ionicons name="search" size={20} color="#9CA3AF" />
              <TextInput
                className="flex-1 text-white font-inter-extrabold text-xs"
                placeholder="BUSCAR CLIENTES..."
                placeholderTextColor="#6B7280"
                value={searchText}
                onChangeText={setSearchText}
              />
              {searchText.length > 0 && (
                <TouchableOpacity onPress={() => setSearchText("")}>
                  <Ionicons name="close-circle" size={20} color="#6B7280" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mb-6"
          >
            <View className="flex-row gap-3 px-1">
              {filters.map((filter) => (
                <TouchableOpacity
                  key={filter.id}
                  onPress={() => setFilterActive(filter.id)}
                  className={`px-4 py-2 rounded-full border ${
                    filterActive === filter.id
                      ? "bg-blue-600 border-blue-500"
                      : "bg-zinc-800/50 border-zinc-700/50"
                  }`}
                >
                  <View className="flex-row items-center gap-2">
                    <Text
                      className={`font-inter-bold text-sm ${
                        filterActive === filter.id
                          ? "text-white"
                          : "text-gray-300"
                      }`}
                    >
                      {filter.label}
                    </Text>
                    <View
                      className={`px-2 py-0.5 rounded-full ${
                        filterActive === filter.id
                          ? "bg-blue-500"
                          : "bg-zinc-700"
                      }`}
                    >
                      <Text className="text-white font-inter-bold text-xs">
                        {filter.count}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        <View className="flex-row gap-4 mb-8">
          <LinearGradient
            colors={["#3B82F6", "#1E40AF"]}
            className="flex-1 rounded-2xl p-4"
            style={{
              shadowColor: "#3B82F6",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 4,
              borderRadius: 16,
            }}
          >
            <View className="items-center">
              <Ionicons name="people" size={24} color="white" />
              <Text className="text-white font-inter-black text-2xl mt-2">
                {stats.totalClients}
              </Text>
              <Text className="text-blue-100 font-inter-black text-xs">
                TOTAL
              </Text>
            </View>
          </LinearGradient>

          <LinearGradient
            colors={["#10B981", "#059669"]}
            className="flex-1 rounded-2xl p-4"
            style={{
              shadowColor: "#10B981",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 4,
              borderRadius: 16,
            }}
          >
            <View className="items-center">
              <Ionicons name="checkmark-circle" size={24} color="white" />
              <Text className="text-white font-inter-black text-2xl mt-2">
                {filters.find(f => f.id === 'ativo')?.count || 0}
              </Text>
              <Text className="text-green-100 font-inter-black text-xs">
                ATIVOS
              </Text>
            </View>
          </LinearGradient>

          <LinearGradient
            colors={["#F59E0B", "#D97706"]}
            className="flex-1 rounded-2xl p-4"
            style={{
              shadowColor: "#F59E0B",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 4,
              borderRadius: 16,
            }}
          >
            <View className="items-center">
              <Ionicons name="briefcase" size={24} color="white" />
              <Text className="text-white font-inter-black text-2xl mt-2">
                {stats.activeProjects}
              </Text>
              <Text className="text-yellow-100 font-inter-black text-xs">
                PROJETOS
              </Text>
            </View>
          </LinearGradient>
        </View>

        <View className="gap-4 mb-8">
          {filteredClients.map((client) => {
            const clientStatus = getClientStatus(client.updatedAt);
            const avatar = generateAvatar(client.fullName);
            const colors = generateColor(client.id);
            
            return (
              <TouchableOpacity
                key={client.id}
                onPress={() => handleClientDetails(client.id)}
                className="bg-zinc-900/80 backdrop-blur-xl rounded-3xl p-5 border border-zinc-800/50 active:scale-98"
                style={{
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.2,
                  shadowRadius: 8,
                  elevation: 4,
                  transform: [{ scale: 1 }],
                }}
              >
                <View className="flex-row items-start gap-4">
                  <LinearGradient
                    colors={colors}
                    className="w-16 h-16 rounded-2xl items-center justify-center"
                    style={{
                      shadowColor: colors[0],
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.3,
                      shadowRadius: 8,
                      elevation: 4,
                      borderRadius: 16,
                    }}
                  >
                    <Text className="text-white font-inter-black text-lg">
                      {avatar}
                    </Text>
                  </LinearGradient>

                  <View className="flex-1">
                    <View className="flex-row items-start justify-between mb-2">
                      <View className="flex-1">
                        <Text className="text-white font-inter-black text-lg">
                          {client.fullName}
                        </Text>
                        <Text className="text-gray-400 font-inter-medium text-sm">
                          {client.city}, {client.state}
                        </Text>
                      </View>

                      <View
                        className={`px-3 py-1 rounded-full ${getStatusColor(clientStatus)}`}
                      >
                        <Text className="text-white font-inter-bold text-xs">
                          {getStatusText(clientStatus)}
                        </Text>
                      </View>
                    </View>

                    <View className="gap-2 mb-3">
                      {client.email && (
                        <View className="flex-row items-center gap-2">
                          <Ionicons name="mail" size={14} color="#9CA3AF" />
                          <Text className="text-gray-300 font-inter-medium text-sm flex-1" numberOfLines={1}>
                            {client.email}
                          </Text>
                        </View>
                      )}
                      <View className="flex-row items-center gap-2">
                        <Ionicons name="call" size={14} color="#9CA3AF" />
                        <Text className="text-gray-300 font-inter-medium text-sm">
                          {clientContext.formatPhone(client.phone)}
                        </Text>
                      </View>
                      {client.totalValue > 0 && (
                        <View className="flex-row items-center gap-2">
                          <Ionicons name="cash" size={14} color="#10B981" />
                          <Text className="text-green-400 font-inter-medium text-sm">
                            {formatCurrency(client.totalValue)}
                          </Text>
                        </View>
                      )}
                    </View>

                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center gap-2">
                        <View className="flex-row items-center gap-1">
                          <Ionicons name="calendar" size={14} color="#60A5FA" />
                          <Text className="text-gray-500 font-inter-medium text-xs">
                            Cliente desde {formatDate(client.clientSince)}
                          </Text>
                        </View>
                      </View>

                      <View className="flex-row gap-2">
                        <TouchableOpacity 
                          className="w-10 h-10 bg-zinc-800/50 rounded-xl items-center justify-center border border-zinc-700/30"
                          onPress={() => copyPhoneNumber(client.phone)}
                        >
                          <Ionicons name="call" size={18} color="#10B981" />
                        </TouchableOpacity>

                        <TouchableOpacity 
                          className="w-10 h-10 bg-zinc-800/50 rounded-xl items-center justify-center border border-zinc-700/30"
                          onPress={() => sendEmail(client.email)}
                          disabled={!client.email}
                          style={{ opacity: client.email ? 1 : 0.5 }}
                        >
                          <Ionicons name="mail" size={18} color="#3B82F6" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {filteredClients.length === 0 && !isLoading && (
          <View className="items-center justify-center py-16">
            <View className="w-24 h-24 bg-zinc-800/50 rounded-full items-center justify-center mb-6">
              <Ionicons name="people-outline" size={48} color="#6B7280" />
            </View>
            <Text className="text-gray-300 font-inter-bold text-lg mb-2">
              {searchText ? "Nenhum cliente encontrado" : "Nenhum cliente cadastrado"}
            </Text>
            <Text className="text-gray-500 font-inter-medium text-sm text-center mb-6">
              {searchText 
                ? "Tente ajustar os filtros ou termos de busca" 
                : "Comece adicionando seu primeiro cliente"
              }
            </Text>
            <TouchableOpacity onPress={handleAddClient}>
              <LinearGradient
                colors={["#3B82F6", "#1E40AF"]}
                className="px-6 py-3 rounded-xl"
              >
                <View className="flex-row items-center gap-2">
                  <Ionicons name="add" size={18} color="white" />
                  <Text className="text-white font-inter-bold text-sm">
                    Adicionar Cliente
                  </Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}