import { useState, useEffect } from "react";
import {
  SafeAreaView,
  View,
  TouchableOpacity,
  Text,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";

import {
  servicesContext,
  Service,
  ServiceUnit,
} from "../context/ServicesContext";
import { budgetContext } from "../context/BudgetContext";

interface SelectedService extends Service {
  quantity: number;
  total: number;
}

interface RouteParams {
  clientId: string;
}

export function NewQuote() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<{ params: RouteParams }, "params">>();
  const { clientId } = route.params || {};

  const [quoteName, setQuoteName] = useState("");
  const [quoteDescription, setQuoteDescription] = useState("");
  const [selectedServices, setSelectedServices] = useState<SelectedService[]>(
    []
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isSaving, setIsSaving] = useState(false);

  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState<"PERCENTAGE" | "FIXED">(
    "PERCENTAGE"
  );
  const [discountReason, setDiscountReason] = useState("");
  const [showDiscountModal, setShowDiscountModal] = useState(false);

  const [availableServices, setAvailableServices] = useState<Service[]>([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [servicesError, setServicesError] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);

  const loadServices = async () => {
    try {
      setServicesLoading(true);
      setServicesError(null);

      const [servicesData, categoriesData] = await Promise.all([
        servicesContext.getServices(),
        servicesContext.getServiceCategories(),
      ]);

      setAvailableServices(servicesData);
      setCategories(["Todos", ...categoriesData]);
    } catch (error) {
      setServicesError(
        error instanceof Error ? error.message : "Erro desconhecido"
      );

      setCategories([
        "Todos",
        "Instalação Elétrica",
        "Manutenção",
        "Projeto Elétrico",
        "Automação",
        "Iluminação",
        "SPDA",
        "Energia Solar",
        "Outros",
      ]);
    } finally {
      setServicesLoading(false);
    }
  };

  useEffect(() => {
    loadServices();
  }, []);

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const getUnitDisplay = (unit: ServiceUnit): string => {
    const unitMap: { [key in ServiceUnit]: string } = {
      UNIT: "unidade",
      METER: "m²",
    };
    return unitMap[unit] || unit.toLowerCase();
  };

  const getCategoryIcon = (category?: string): string => {
    const iconMap: { [key: string]: string } = {
      "Instalação Elétrica": "construct",
      Manutenção: "build",
      "Projeto Elétrico": "document-text",
      Automação: "settings",
      Iluminação: "bulb",
      SPDA: "shield-checkmark",
      "Energia Solar": "sunny",
      Outros: "ellipsis-horizontal",
    };
    return iconMap[category || ""] || "flash";
  };

  const filteredServices = availableServices.filter((service) => {
    const matchesCategory =
      selectedCategory === "all" ||
      selectedCategory === "Todos" ||
      service.category === selectedCategory;
    const matchesSearch =
      service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (service.description &&
        service.description.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const addOrUpdateService = (service: Service, quantity: number) => {
    const existingServiceIndex = selectedServices.findIndex(
      (s) => s.id === service.id
    );

    if (existingServiceIndex >= 0) {
      const updatedServices = [...selectedServices];
      updatedServices[existingServiceIndex].quantity += quantity;
      updatedServices[existingServiceIndex].total =
        updatedServices[existingServiceIndex].quantity * service.price;
      setSelectedServices(updatedServices);
    } else {
      const newService: SelectedService = {
        ...service,
        quantity: quantity,
        total: service.price * quantity,
      };
      setSelectedServices([...selectedServices, newService]);
    }
  };

  const updateQuantity = (serviceId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeService(serviceId);
      return;
    }

    setSelectedServices(
      selectedServices.map((service) =>
        service.id === serviceId
          ? {
              ...service,
              quantity: newQuantity,
              total: service.price * newQuantity,
            }
          : service
      )
    );
  };

  const removeService = (serviceId: string) => {
    setSelectedServices(
      selectedServices.filter((service) => service.id !== serviceId)
    );
  };

  const subtotal = selectedServices.reduce(
    (sum, service) => sum + service.total,
    0
  );
  const discountValue =
    discountType === "PERCENTAGE" ? (subtotal * discount) / 100 : discount;
  const totalAmount = Math.max(0, subtotal - discountValue);

  const applyDiscount = (
    value: number,
    type: "PERCENTAGE" | "FIXED",
    reason: string = ""
  ) => {
    setDiscount(value);
    setDiscountType(type);
    setDiscountReason(reason);
    setShowDiscountModal(false);
  };

  const removeDiscount = () => {
    setDiscount(0);
    setDiscountType("PERCENTAGE");
    setDiscountReason("");
  };

  const saveQuote = async () => {
    if (!quoteName.trim()) {
      Alert.alert("Atenção", "Digite um nome para o orçamento");
      return;
    }

    if (selectedServices.length === 0) {
      Alert.alert("Atenção", "Adicione pelo menos um serviço ao orçamento");
      return;
    }

    if (!clientId) {
      Alert.alert("Erro", "ID do cliente não encontrado");
      return;
    }

    try {
      setIsSaving(true);

      const budgetData = {
        name: quoteName.trim(),
        clientId: clientId,
        notes: quoteDescription.trim() || undefined,
        discount: discount > 0 ? discount : undefined,
        discountType: discount > 0 ? discountType : undefined,
        discountReason: discount > 0 ? discountReason : undefined,
      };

      const createdBudget = await budgetContext.createBudget(budgetData);

      for (let i = 0; i < selectedServices.length; i++) {
        const service = selectedServices[i];

        const itemData = {
          serviceId: service.id,
          name: service.name,
          description:
            service.description ||
            `Serviço: ${service.category || "Sem categoria"}`,
          quantity: service.quantity,
          unitPrice: service.price,
          unit: service.unit,
        };

        try {
          await budgetContext.addBudgetItem(createdBudget.id!, itemData);
        } catch (itemError) {}
      }

      Alert.alert("Sucesso", "Orçamento salvo com sucesso!", [
        {
          text: "OK",
          onPress: () => {
            navigation.goBack();
          },
        },
      ]);
    } catch (error) {
      Alert.alert(
        "Erro ao salvar",
        error instanceof Error
          ? error.message
          : "Ocorreu um erro ao salvar o orçamento. Tente novamente."
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleGoBack = () => {
    if (selectedServices.length > 0) {
      Alert.alert(
        "Descartar alterações?",
        "Você tem serviços selecionados. Deseja descartar as alterações?",
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Descartar",
            style: "destructive",
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } else {
      navigation.goBack();
    }
  };

  const retryLoadServices = () => {
    loadServices();
  };

  return (
    <SafeAreaView className="flex-1 bg-neutral-900">
      <View className="px-6 mt-16 mb-8">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity
            onPress={handleGoBack}
            className="w-14 h-14 bg-zinc-800/50 rounded-3xl items-center justify-center border border-zinc-700/40"
          >
            <Ionicons name="chevron-back" size={24} color="#60A5FA" />
          </TouchableOpacity>

          <Text className="text-white font-inter-black text-sm">
            NOVO ORÇAMENTO
          </Text>

          <TouchableOpacity
            onPress={saveQuote}
            disabled={isSaving}
            className={`w-14 h-14 rounded-3xl items-center justify-center border ${
              isSaving
                ? "bg-gray-600/50 border-gray-600/40"
                : "bg-zinc-800/50 border-zinc-700/40"
            }`}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#10B981" />
            ) : (
              <Ionicons name="checkmark" size={24} color="#10B981" />
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="mx-6 mb-8">
          <View className="bg-zinc-900/60 backdrop-blur-xl rounded-3xl p-6 border border-zinc-800/30">
            <View className="flex-row items-center mb-4">
              <View className="w-14 h-14 bg-blue-600/20 rounded-2xl items-center justify-center mr-4">
                <Ionicons name="document-text" size={28} color="#60A5FA" />
              </View>
              <View className="flex-1">
                <Text className="text-gray-400 font-inter-medium text-sm mb-2">
                  Nome do Orçamento
                </Text>
                <TextInput
                  value={quoteName}
                  onChangeText={setQuoteName}
                  placeholder="Ex: Instalação Elétrica Residencial"
                  placeholderTextColor="#6B7280"
                  className="text-white font-inter-bold text-lg bg-zinc-800/40 rounded-xl px-4 py-3 border border-zinc-700/40"
                />
              </View>
            </View>

            <View className="mb-4">
              <Text className="text-gray-400 font-inter-medium text-sm mb-2">
                Descrição (opcional)
              </Text>
              <TextInput
                value={quoteDescription}
                onChangeText={setQuoteDescription}
                placeholder="Adicione uma descrição para o orçamento..."
                placeholderTextColor="#6B7280"
                multiline
                numberOfLines={3}
                className="text-white font-inter-medium bg-zinc-800/40 rounded-xl px-4 py-3 border border-zinc-700/40 min-h-[80px]"
              />
            </View>

            {totalAmount > 0 && (
              <View className="pt-6 border-t border-zinc-800/30">
                {discount > 0 && (
                  <>
                    <View className="flex-row justify-between items-center mb-1">
                      <Text className="text-gray-400 font-inter-medium">
                        Subtotal
                      </Text>
                      <Text className="text-gray-400 font-inter-medium">
                        {formatCurrency(subtotal)}
                      </Text>
                    </View>
                    <View className="flex-row justify-between items-center mb-1">
                      <Text className="text-red-400 font-inter-medium">
                        Desconto
                      </Text>
                      <Text className="text-red-400 font-inter-medium">
                        -{formatCurrency(discountValue)}
                        {discountType === "PERCENTAGE" && ` (${discount}%)`}
                      </Text>
                    </View>
                  </>
                )}
                <View className="flex-row justify-between items-center mb-2">
                  <Text className="text-gray-400 font-inter-medium text-base">
                    Total do Orçamento
                  </Text>
                  <Text className="text-green-400 font-inter-black text-3xl">
                    {formatCurrency(totalAmount)}
                  </Text>
                </View>
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-2">
                    <View className="w-2 h-2 bg-green-400 rounded-full" />
                    <Text className="text-gray-500 font-inter-medium text-sm">
                      {selectedServices.length}{" "}
                      {selectedServices.length === 1 ? "serviço" : "serviços"}{" "}
                      selecionado{selectedServices.length > 1 ? "s" : ""}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setShowDiscountModal(true)}
                    className="bg-blue-600/20 px-4 py-2 rounded-xl border border-blue-600/30"
                  >
                    <Text className="text-blue-400 font-inter-bold text-sm">
                      {discount > 0 ? "Alterar Desconto" : "Aplicar Desconto"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>

        {discount > 0 && (
          <View className="mx-6 mb-8">
            <View className="bg-zinc-900/60 backdrop-blur-xl rounded-3xl p-6 border border-zinc-800/30">
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-white font-inter-bold text-lg">
                  Desconto Aplicado
                </Text>
                <TouchableOpacity
                  onPress={removeDiscount}
                  className="bg-red-600/20 px-4 py-2 rounded-xl border border-red-600/30"
                >
                  <Text className="text-red-400 font-inter-bold text-sm">
                    Remover
                  </Text>
                </TouchableOpacity>
              </View>

              <View className="space-y-3">
                <View className="flex-row justify-between items-center">
                  <Text className="text-gray-400 font-inter-medium">
                    Tipo de Desconto
                  </Text>
                  <Text className="text-white font-inter-bold">
                    {discountType === "PERCENTAGE"
                      ? "Porcentagem"
                      : "Valor Fixo"}
                  </Text>
                </View>

                <View className="flex-row justify-between items-center">
                  <Text className="text-gray-400 font-inter-medium">
                    Valor do Desconto
                  </Text>
                  <Text className="text-red-400 font-inter-bold text-lg">
                    {discountType === "PERCENTAGE"
                      ? `${discount}%`
                      : formatCurrency(discount)}
                  </Text>
                </View>

                {discountReason && (
                  <View className="flex-row justify-between items-start">
                    <Text className="text-gray-400 font-inter-medium mt-1">
                      Motivo
                    </Text>
                    <Text className="text-white font-inter-medium text-sm text-right flex-1 ml-4">
                      {discountReason}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        )}

        <View className="mx-6 mb-6">
          <View className="bg-zinc-800/40 rounded-2xl border border-zinc-700/30 backdrop-blur-sm">
            <View className="flex-row items-center px-5 py-4">
              <Ionicons name="search" size={22} color="#9CA3AF" />
              <TextInput
                value={searchTerm}
                onChangeText={setSearchTerm}
                placeholder="Pesquisar serviços..."
                placeholderTextColor="#6B7280"
                className="flex-1 ml-4 text-white font-inter-medium text-base"
              />
              {searchTerm.length > 0 && (
                <TouchableOpacity onPress={() => setSearchTerm("")}>
                  <Ionicons name="close-circle" size={22} color="#9CA3AF" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        <View className="mb-8">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 24 }}
          >
            <View className="flex-row gap-3">
              {categories.map((category, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() =>
                    setSelectedCategory(category === "Todos" ? "all" : category)
                  }
                  className="active:scale-95"
                >
                  {selectedCategory === category ||
                  (selectedCategory === "all" && category === "Todos") ? (
                    <LinearGradient
                      colors={["#3B82F6", "#1E40AF"]}
                      className="flex-row items-center gap-3 px-5 py-3 rounded-2xl"
                      style={{
                        shadowColor: "#3B82F6",
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.3,
                        shadowRadius: 8,
                        elevation: 6,
                        borderRadius: 16,
                      }}
                    >
                      <Ionicons
                        name={getCategoryIcon(category) as any}
                        size={18}
                        color="white"
                      />
                      <Text className="text-white font-inter-bold text-sm">
                        {category}
                      </Text>
                    </LinearGradient>
                  ) : (
                    <View className="flex-row items-center gap-3 px-5 py-3 rounded-2xl bg-zinc-800/40 border border-zinc-700/30">
                      <Ionicons
                        name={getCategoryIcon(category) as any}
                        size={18}
                        color="#9CA3AF"
                      />
                      <Text className="text-gray-400 font-inter-medium text-sm">
                        {category}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {selectedServices.length > 0 && (
          <View className="mx-6 mb-8">
            <View className="flex-row items-center justify-between mb-6">
              <Text className="text-white font-inter-black text-lg">
                Serviços Selecionados
              </Text>
              <View className="bg-green-600/20 px-4 py-2 rounded-xl border border-green-600/30">
                <Text className="text-green-400 font-inter-bold text-sm">
                  {selectedServices.length}
                </Text>
              </View>
            </View>

            <View className="gap-4">
              {selectedServices.map((service) => (
                <View
                  key={service.id}
                  className="bg-zinc-900/60 backdrop-blur-xl rounded-3xl p-6 border border-zinc-800/30"
                >
                  <View className="flex-row items-start justify-between mb-4">
                    <View className="flex-1 pr-4">
                      <View className="flex-row items-center gap-3 mb-3">
                        <View className="w-12 h-12 bg-green-600/20 rounded-2xl items-center justify-center">
                          <Ionicons
                            name={getCategoryIcon(service.category) as any}
                            size={20}
                            color="#10B981"
                          />
                        </View>
                        <View className="flex-1">
                          <Text className="text-white font-inter-bold text-base mb-1">
                            {service.name}
                          </Text>
                          <Text className="text-green-400 font-inter-semibold text-sm">
                            {formatCurrency(service.price)} /{" "}
                            {getUnitDisplay(service.unit)}
                          </Text>
                          {service.description && (
                            <Text className="text-gray-400 font-inter-medium text-xs mt-1">
                              {service.description}
                            </Text>
                          )}
                        </View>
                      </View>
                    </View>
                    <TouchableOpacity
                      onPress={() => removeService(service.id)}
                      className="w-10 h-10 bg-red-600/20 rounded-xl items-center justify-center border border-red-600/30"
                    >
                      <Ionicons name="trash" size={18} color="#EF4444" />
                    </TouchableOpacity>
                  </View>

                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center gap-3">
                      <TouchableOpacity
                        onPress={() =>
                          updateQuantity(service.id, service.quantity - 1)
                        }
                        className="w-10 h-10 bg-zinc-800/50 rounded-xl items-center justify-center border border-zinc-700/40"
                      >
                        <Ionicons name="remove" size={18} color="#9CA3AF" />
                      </TouchableOpacity>

                      <View className="bg-zinc-800/40 rounded-xl px-4 py-3 border border-zinc-700/30 min-w-[70px] items-center">
                        <Text className="text-white font-inter-black text-lg">
                          {service.quantity}
                        </Text>
                        <Text className="text-gray-400 font-inter-medium text-xs">
                          {getUnitDisplay(service.unit)}(s)
                        </Text>
                      </View>

                      <TouchableOpacity
                        onPress={() =>
                          updateQuantity(service.id, service.quantity + 1)
                        }
                        className="w-10 h-10 bg-zinc-800/50 rounded-xl items-center justify-center border border-zinc-700/40"
                      >
                        <Ionicons name="add" size={18} color="#9CA3AF" />
                      </TouchableOpacity>
                    </View>

                    <Text className="text-green-400 font-inter-black text-xl">
                      {formatCurrency(service.total)}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        <View className="mx-6 mb-8">
          <View className="flex-row items-center justify-between mb-6">
            <Text className="text-white font-inter-black text-lg">
              Serviços Disponíveis
            </Text>
            <View className="bg-blue-600/20 px-4 py-2 rounded-xl border border-blue-600/30">
              <Text className="text-blue-400 font-inter-bold text-sm">
                {servicesLoading ? "..." : filteredServices.length}
              </Text>
            </View>
          </View>

          {servicesLoading ? (
            <View className="bg-zinc-900/60 backdrop-blur-xl rounded-3xl p-8 items-center border border-zinc-800/30">
              <ActivityIndicator size="large" color="#3B82F6" />
              <Text className="text-white font-inter-black text-xl mt-4 mb-2">
                Carregando serviços...
              </Text>
              <Text className="text-gray-400 font-inter-medium text-sm text-center">
                Buscando serviços disponíveis na API
              </Text>
            </View>
          ) : servicesError ? (
            <View className="bg-zinc-900/60 backdrop-blur-xl rounded-3xl p-8 items-center border border-zinc-800/30">
              <View className="w-16 h-16 bg-red-600/20 rounded-3xl items-center justify-center mb-4">
                <Ionicons name="alert-circle" size={32} color="#EF4444" />
              </View>
              <Text className="text-white font-inter-black text-xl mb-2">
                Erro ao carregar serviços
              </Text>
              <Text className="text-gray-400 font-inter-medium text-sm text-center mb-4">
                {servicesError}
              </Text>
              <TouchableOpacity
                onPress={retryLoadServices}
                className="bg-blue-500 px-6 py-3 rounded-xl"
              >
                <Text className="text-white font-inter-bold text-sm">
                  Tentar novamente
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View className="gap-4">
              {filteredServices.map((service) => (
                <ServiceItem
                  key={service.id}
                  service={service}
                  onAdd={addOrUpdateService}
                  formatCurrency={formatCurrency}
                  getUnitDisplay={getUnitDisplay}
                  getCategoryIcon={getCategoryIcon}
                />
              ))}

              {filteredServices.length === 0 && !servicesLoading && (
                <View className="bg-zinc-900/60 backdrop-blur-xl rounded-3xl p-8 items-center border border-zinc-800/30">
                  <View className="w-16 h-16 bg-zinc-800/50 rounded-3xl items-center justify-center mb-4">
                    <Ionicons name="search" size={32} color="#6B7280" />
                  </View>
                  <Text className="text-white font-inter-black text-xl mb-2">
                    Nenhum serviço encontrado
                  </Text>
                  <Text className="text-gray-400 font-inter-medium text-sm text-center">
                    Tente ajustar os filtros ou termo de pesquisa
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>

        <View className="h-32" />
      </ScrollView>

      <Modal
        visible={showDiscountModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowDiscountModal(false)}
      >
        <View className="flex-1 bg-black/70 justify-center items-center px-6">
          <View className="bg-zinc-900 rounded-3xl p-6 w-full border border-zinc-700/50">
            <Text className="text-white font-inter-black text-xl mb-2 text-center">
              Aplicar Desconto
            </Text>

            <View className="flex-row mb-4">
              <TouchableOpacity
                onPress={() => setDiscountType("PERCENTAGE")}
                className={`flex-1 py-3 rounded-l-2xl border ${
                  discountType === "PERCENTAGE"
                    ? "bg-blue-600/20 border-blue-500"
                    : "bg-zinc-800/50 border-zinc-700"
                }`}
              >
                <Text
                  className={`text-center font-inter-bold ${
                    discountType === "PERCENTAGE"
                      ? "text-blue-400"
                      : "text-gray-400"
                  }`}
                >
                  Porcentagem
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setDiscountType("FIXED")}
                className={`flex-1 py-3 rounded-r-2xl border ${
                  discountType === "FIXED"
                    ? "bg-blue-600/20 border-blue-500"
                    : "bg-zinc-800/50 border-zinc-700"
                }`}
              >
                <Text
                  className={`text-center font-inter-bold ${
                    discountType === "FIXED" ? "text-blue-400" : "text-gray-400"
                  }`}
                >
                  Valor Fixo
                </Text>
              </TouchableOpacity>
            </View>

            <TextInput
              placeholder={
                discountType === "PERCENTAGE"
                  ? "Porcentagem (ex: 10)"
                  : "Valor (ex: 50,00)"
              }
              placeholderTextColor="#6B7280"
              keyboardType="numeric"
              value={discount.toString()}
              onChangeText={(text) =>
                setDiscount(Number(text.replace(",", ".")) || 0)
              }
              className="bg-zinc-800/50 border border-zinc-700 rounded-2xl px-4 py-4 text-white font-inter-medium mb-4"
            />

            <TextInput
              placeholder="Motivo do desconto (opcional)"
              placeholderTextColor="#6B7280"
              value={discountReason}
              onChangeText={setDiscountReason}
              className="bg-zinc-800/50 border border-zinc-700 rounded-2xl px-4 py-4 text-white font-inter-medium mb-6"
            />

            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => setShowDiscountModal(false)}
                className="flex-1 bg-zinc-800/50 border border-zinc-700 rounded-2xl py-4"
              >
                <Text className="text-white font-inter-bold text-center">
                  Cancelar
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() =>
                  applyDiscount(discount, discountType, discountReason)
                }
                disabled={discount <= 0}
                className={`flex-1 rounded-2xl py-4 ${
                  discount <= 0 ? "bg-gray-600" : "bg-blue-500"
                }`}
              >
                <Text className="text-white font-inter-bold text-center">
                  Aplicar
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {selectedServices.length > 0 && (
        <View className="absolute bottom-8 left-6 right-6">
          <TouchableOpacity
            onPress={saveQuote}
            disabled={isSaving}
            className="active:scale-95"
          >
            <LinearGradient
              colors={
                isSaving ? ["#6B7280", "#4B5563"] : ["#10B981", "#059669"]
              }
              className="rounded-3xl p-6 flex-row items-center justify-center"
              style={{
                shadowColor: isSaving ? "#6B7280" : "#10B981",
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.3,
                shadowRadius: 16,
                elevation: 8,
                borderRadius: 24,
              }}
            >
              {isSaving ? (
                <>
                  <ActivityIndicator size="small" color="white" />
                  <Text className="text-white font-inter-black text-lg ml-3">
                    Salvando...
                  </Text>
                </>
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={24} color="white" />
                  <Text className="text-white font-inter-black text-lg ml-3">
                    Salvar Orçamento • {formatCurrency(totalAmount)}
                  </Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

interface ServiceItemProps {
  service: Service;
  onAdd: (service: Service, quantity: number) => void;
  formatCurrency: (value: number) => string;
  getUnitDisplay: (unit: ServiceUnit) => string;
  getCategoryIcon: (category?: string) => string;
}

function ServiceItem({
  service,
  onAdd,
  formatCurrency,
  getUnitDisplay,
  getCategoryIcon,
}: ServiceItemProps) {
  const [quantity, setQuantity] = useState(1);

  const handleAdd = () => {
    onAdd(service, quantity);
    setQuantity(1);
  };

  return (
    <View className="bg-zinc-900/60 backdrop-blur-xl rounded-3xl p-6 border border-zinc-800/30">
      <View className="flex-row items-start justify-between mb-4">
        <View className="flex-1 pr-4">
          <View className="flex-row items-center gap-3 mb-3">
            <View className="w-12 h-12 bg-blue-600/20 rounded-2xl items-center justify-center">
              <Ionicons
                name={getCategoryIcon(service.category) as any}
                size={20}
                color="#60A5FA"
              />
            </View>
            <View className="flex-1">
              <Text className="text-white font-inter-bold text-base mb-1">
                {service.name}
              </Text>
              <Text className="text-blue-400 font-inter-semibold text-sm">
                {formatCurrency(service.price)} / {getUnitDisplay(service.unit)}
              </Text>
              {service.description && (
                <Text className="text-gray-400 font-inter-medium text-xs mt-1">
                  {service.description}
                </Text>
              )}
              {service.category && (
                <View className="bg-blue-600/10 px-2 py-1 rounded-lg mt-2 self-start">
                  <Text className="text-blue-400 font-inter-medium text-xs">
                    {service.category}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </View>

      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-3">
          <TouchableOpacity
            onPress={() => setQuantity(Math.max(1, quantity - 1))}
            className="w-10 h-10 bg-zinc-800/50 rounded-xl items-center justify-center border border-zinc-700/40"
          >
            <Ionicons name="remove" size={18} color="#9CA3AF" />
          </TouchableOpacity>

          <View className="bg-zinc-800/40 rounded-xl px-4 py-3 border border-zinc-700/30 min-w-[70px] items-center">
            <Text className="text-white font-inter-black text-lg">
              {quantity}
            </Text>
            <Text className="text-gray-400 font-inter-medium text-xs">
              {getUnitDisplay(service.unit)}(s)
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => setQuantity(quantity + 1)}
            className="w-10 h-10 bg-zinc-800/50 rounded-xl items-center justify-center border border-zinc-700/40"
          >
            <Ionicons name="add" size={18} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={handleAdd} className="active:scale-95">
          <LinearGradient
            colors={["#3B82F6", "#1E40AF"]}
            className="w-12 h-12 rounded-2xl items-center justify-center"
            style={{
              borderRadius: 16,
            }}
          >
            <Ionicons name="add" size={20} color="white" />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}
