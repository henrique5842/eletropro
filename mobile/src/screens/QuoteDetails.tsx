import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  View,
  TouchableOpacity,
  Text,
  ScrollView,
  TextInput,
  Alert,
  Modal,
  ActivityIndicator,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { budgetContext, Budget } from "../context/BudgetContext";
import { servicesContext, Service } from "../context/ServicesContext";

interface SelectedService {
  id: string;
  name: string;
  price: number;
  unit: string;
  category?: string;
  icon: string;
  quantity: number;
  total: number;
  serviceId?: string;
}

interface RouteParams {
  quoteId: string;
}

interface AddServiceItemProps {
  service: Service;
  onAdd: (service: Service, quantity: number) => void;
  formatCurrency: (value: number) => string;
}

function AddServiceItem({
  service,
  onAdd,
  formatCurrency,
}: AddServiceItemProps) {
  const [quantity, setQuantity] = useState("1");

  const handleAdd = () => {
    const qty = parseInt(quantity) || 1;
    onAdd(service, qty);
    setQuantity("1");
  };

  const servicePrice =
    typeof service.price === "string"
      ? parseFloat(service.price)
      : service.price;

  return (
    <View className="bg-zinc-900/60 backdrop-blur-xl rounded-3xl p-6 border border-zinc-800/30">
      <View className="flex-row items-start justify-between mb-4">
        <View className="flex-1 pr-4">
          <View className="flex-row items-center gap-3 mb-3">
            <View className="w-12 h-12 bg-blue-600/20 rounded-2xl items-center justify-center">
              <Ionicons name="construct" size={20} color="#60A5FA" />
            </View>
            <View className="flex-1">
              <Text className="text-white font-inter-bold text-base mb-1">
                {service.name}
              </Text>
              <Text className="text-blue-400 font-inter-semibold text-sm">
                {formatCurrency(servicePrice)} / {service.unit}
              </Text>
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
          <Text className="text-gray-400 font-inter-medium text-sm">
            Quantidade:
          </Text>
          <View className="flex-row items-center gap-2">
            <TouchableOpacity
              onPress={() => {
                const newQty = Math.max(1, parseInt(quantity) - 1);
                setQuantity(newQty.toString());
              }}
              className="w-9 h-9 bg-zinc-800/50 rounded-xl items-center justify-center border border-zinc-700/40"
            >
              <Ionicons name="remove" size={16} color="#9CA3AF" />
            </TouchableOpacity>

            <TextInput
              value={quantity}
              onChangeText={setQuantity}
              keyboardType="numeric"
              className="bg-zinc-800/40 rounded-xl px-4 py-2 text-white font-inter-bold text-sm w-14 text-center border border-zinc-700/30"
            />

            <TouchableOpacity
              onPress={() => {
                const newQty = parseInt(quantity) + 1;
                setQuantity(newQty.toString());
              }}
              className="w-9 h-9 bg-zinc-800/50 rounded-xl items-center justify-center border border-zinc-700/40"
            >
              <Ionicons name="add" size={16} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
        </View>

        <View className="flex-row items-center gap-4">
          <Text className="text-white font-inter-black text-sm">
            {formatCurrency(servicePrice * (parseInt(quantity) || 1))}
          </Text>
          <TouchableOpacity onPress={handleAdd} className="active:scale-90">
            <LinearGradient
              colors={["#10B981", "#059669"]}
              className="w-12 h-12 rounded-2xl items-center justify-center"
              style={{ borderRadius: 12 }}
            >
              <Ionicons name="add" size={20} color="white" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

export function QuoteDetails() {
  const route = useRoute();
  const navigation = useNavigation();
  const { quoteId } = route.params as RouteParams;

  const [quote, setQuote] = useState<Budget | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [loading, setLoading] = useState(true);
  const [availableServices, setAvailableServices] = useState<Service[]>([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState<"PERCENTAGE" | "FIXED">(
    "PERCENTAGE"
  );
  const [discountReason, setDiscountReason] = useState("");

  const loadQuote = async () => {
    try {
      setLoading(true);
      const quoteData = await budgetContext.getBudgetById(quoteId);
      setQuote(quoteData);
      setEditedName(quoteData.name);
      if (quoteData.discount && quoteData.discount > 0) {
        setDiscount(Number(quoteData.discount));
        setDiscountType(quoteData.discountType || "PERCENTAGE");
        setDiscountReason(quoteData.discountReason || "");
      } else {
        setDiscount(0);
        setDiscountType("PERCENTAGE");
        setDiscountReason("");
      }
    } catch (error) {
      Alert.alert("Erro", "Não foi possível carregar os detalhes do orçamento");
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableServices = async () => {
    try {
      setServicesLoading(true);
      const services = await servicesContext.getServices();
      setAvailableServices(services);
    } catch (error) {
      setAvailableServices([]);
    } finally {
      setServicesLoading(false);
    }
  };

  useEffect(() => {
    if (quoteId) {
      loadQuote();
      loadAvailableServices();
    }
  }, [quoteId]);

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value || 0);
  };

  const formatDate = (dateString: string): string => {
    if (!dateString) return "Data não informada";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("pt-BR");
    } catch {
      return "Data inválida";
    }
  };

  const getStatusColor = (status: string | undefined) => {
    const statusLower = (status || "pending").toLowerCase();
    switch (statusLower) {
      case "approved":
        return "text-green-400";
      case "pending":
        return "text-yellow-400";
      case "rejected":
        return "text-red-400";
      case "expired":
        return "text-red-400";
      default:
        return "text-gray-400";
    }
  };

  const getStatusBgColor = (status: string | undefined) => {
    const statusLower = (status || "pending").toLowerCase();
    switch (statusLower) {
      case "approved":
        return "bg-green-600/20 border-green-600/30";
      case "pending":
        return "bg-yellow-600/20 border-yellow-600/30";
      case "rejected":
        return "bg-red-600/20 border-red-600/30";
      case "expired":
        return "bg-red-600/20 border-red-600/30";
      default:
        return "bg-gray-600/20 border-gray-600/30";
    }
  };

  const getStatusText = (status: string | undefined) => {
    const statusLower = (status || "pending").toLowerCase();
    switch (statusLower) {
      case "approved":
        return "Aprovado";
      case "pending":
        return "Pendente";
      case "rejected":
        return "Rejeitado";
      case "expired":
        return "Expirado";
      default:
        return status || "Pendente";
    }
  };

  const getSelectedServices = (): SelectedService[] => {
    if (!quote?.items || !Array.isArray(quote.items)) {
      return [];
    }

    const validItems = quote.items
      .filter((item) => {
        const name = item.service?.name || item.name;
        const quantity = item.quantity;
        const unitPrice = item.unitPrice || item.service?.price;
        return name && quantity !== undefined && unitPrice !== undefined;
      })
      .map((item) => {
        const name = item.service?.name || item.name || "Serviço sem nome";
        const unitPrice = parseFloat(
          String(item.unitPrice || item.service?.price || 0)
        );
        const quantity = item.quantity || 0;
        const unit = item.service?.unit || item.unit || "UNIT";
        const serviceId = item.serviceId || item.service?.id;

        return {
          itemId: item.id,
          serviceId,
          name,
          price: unitPrice,
          unit:
            unit === "UNIT" ? "unidade" : unit.toLowerCase().replace("_", " "),
          category: item.service?.category || "Serviço",
          icon: getServiceIcon(name),
          quantity,
        };
      });

    const groupedMap = new Map<string, SelectedService>();

    validItems.forEach((item) => {
      const key = item.serviceId || item.itemId;
      if (!key) return;
      if (groupedMap.has(key)) {
        const existing = groupedMap.get(key)!;
        existing.quantity += item.quantity;
        existing.total = existing.quantity * existing.price;
      } else {
        groupedMap.set(key, {
          id: item.itemId!,
          serviceId: item.serviceId,
          name: item.name,
          price: item.price,
          unit: item.unit,
          category: item.category,
          icon: item.icon,
          quantity: item.quantity,
          total: item.quantity * item.price,
        });
      }
    });

    return Array.from(groupedMap.values());
  };

  const getServiceIcon = (serviceName: string | undefined): string => {
    const name = (serviceName || "").toLowerCase();
    if (name.includes("tomada")) return "power";
    if (name.includes("interruptor")) return "toggle";
    if (name.includes("fio") || name.includes("cabo")) return "flash";
    if (name.includes("disjuntor")) return "shield-checkmark";
    if (name.includes("quadro")) return "grid";
    if (name.includes("luminária") || name.includes("lâmpada")) return "bulb";
    if (name.includes("instalar") || name.includes("instalação"))
      return "construct";
    return "build";
  };

  const selectedServices = getSelectedServices();
  const subtotal = selectedServices.reduce(
    (sum, service) => sum + service.total,
    0
  );
  const discountValue =
    discountType === "PERCENTAGE" ? (subtotal * discount) / 100 : discount;
  const totalAmount = Math.max(0, subtotal - discountValue);

  const categories = [
    { id: "all", name: "Todos", icon: "apps" },
    { id: "Instalação Elétrica", name: "Instalação", icon: "construct" },
    { id: "Manutenção", name: "Manutenção", icon: "build" },
    { id: "Projeto Elétrico", name: "Projeto", icon: "document-text" },
    { id: "Automação", name: "Automação", icon: "settings" },
    { id: "Iluminação", name: "Iluminação", icon: "bulb" },
    { id: "SPDA", name: "SPDA", icon: "shield-checkmark" },
    { id: "Energia Solar", name: "Solar", icon: "sunny" },
  ];

  const filteredServices = availableServices.filter((service) => {
    const serviceName = service.name || "";
    const serviceCategory = service.category || "";
    const matchesCategory =
      selectedCategory === "all" ||
      selectedCategory === "Todos" ||
      serviceCategory === selectedCategory;
    const matchesSearch =
      serviceName.toLowerCase().includes((searchTerm || "").toLowerCase()) ||
      (service.description &&
        service.description
          .toLowerCase()
          .includes((searchTerm || "").toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const applyDiscount = async (
    value: number,
    type: "PERCENTAGE" | "FIXED",
    reason: string = ""
  ) => {
    if (!quote) return;

    try {
      if (value > 0) {
        await budgetContext.applyDiscount(quoteId, {
          discount: value,
          discountType: type,
          discountReason: reason,
        });
      } else {
        await budgetContext.removeDiscount(quoteId);
      }

      if (quote.status !== "PENDING") {
        await budgetContext.updateBudgetStatus(quoteId, "PENDING");
      }

      await loadQuote();
      setShowDiscountModal(false);
      Alert.alert(
        "Sucesso",
        value > 0
          ? "Desconto aplicado com sucesso!"
          : "Desconto removido com sucesso!"
      );
    } catch (error) {
      Alert.alert("Erro", "Não foi possível aplicar o desconto");
    }
  };

  const removeDiscount = () => {
    Alert.alert(
      "Remover desconto",
      "Deseja realmente remover o desconto deste orçamento?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Remover",
          style: "destructive",
          onPress: () => applyDiscount(0, "PERCENTAGE", ""),
        },
      ]
    );
  };

  const updateQuantity = async (serviceId: string, newQuantity: number) => {
    if (!quote) return;

    if (newQuantity <= 0) {
      removeService(serviceId);
      return;
    }

    try {
      const itemsToUpdate =
        quote.items?.filter(
          (item) => (item.serviceId || item.service?.id) === serviceId
        ) || [];

      if (itemsToUpdate.length === 0) {
        return;
      }

      if (itemsToUpdate.length === 1) {
        await budgetContext.updateBudgetItem(quoteId, itemsToUpdate[0].id!, {
          quantity: newQuantity,
        });
      } else {
        await budgetContext.updateBudgetItem(quoteId, itemsToUpdate[0].id!, {
          quantity: newQuantity,
        });
        for (let i = 1; i < itemsToUpdate.length; i++) {
          await budgetContext.removeBudgetItem(quoteId, itemsToUpdate[i].id!);
        }
      }

      if (quote.status !== "PENDING") {
        await budgetContext.updateBudgetStatus(quoteId, "PENDING");
      }

      await loadQuote();
    } catch (error) {
      Alert.alert("Erro", "Não foi possível atualizar a quantidade");
    }
  };

  const removeService = async (serviceId: string) => {
    if (!quote) return;

    Alert.alert(
      "Confirmar exclusão",
      "Deseja realmente remover este serviço do orçamento?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Remover",
          style: "destructive",
          onPress: async () => {
            try {
              const itemsToRemove =
                quote.items?.filter(
                  (item) => (item.serviceId || item.service?.id) === serviceId
                ) || [];

              for (const item of itemsToRemove) {
                await budgetContext.removeBudgetItem(quoteId, item.id!);
              }

              if (quote.status !== "PENDING") {
                await budgetContext.updateBudgetStatus(quoteId, "PENDING");
              }

              setTimeout(async () => {
                await loadQuote();
                Alert.alert("Sucesso", "Serviço removido do orçamento!");
              }, 500);
            } catch (error) {
              Alert.alert("Erro", "Não foi possível remover o serviço");
            }
          },
        },
      ]
    );
  };

  const addService = async (service: Service, quantity: number) => {
    if (!quote) return;

    try {
      const servicePrice =
        typeof service.price === "string"
          ? parseFloat(service.price)
          : service.price;
      const itemData = {
        serviceId: service.id,
        name: service.name,
        description:
          service.description ||
          `Serviço: ${service.category || "Sem categoria"}`,
        quantity: quantity,
        unitPrice: servicePrice,
        unit: service.unit,
      };

      await budgetContext.addBudgetItem(quoteId, itemData);

      if (quote.status !== "PENDING") {
        await budgetContext.updateBudgetStatus(quoteId, "PENDING");
      }

      setTimeout(async () => {
        await loadQuote();
        await loadAvailableServices();
        setShowAddModal(false);
        Alert.alert("Sucesso", "Serviço adicionado ao orçamento!");
      }, 800);
    } catch (error) {
      Alert.alert("Erro", "Não foi possível adicionar o serviço");
    }
  };

  const saveChanges = async () => {
    if (!quote) return;

    try {
      await budgetContext.updateBudget(quoteId, { name: editedName });
      setQuote({ ...quote, name: editedName });
      setIsEditMode(false);
      Alert.alert("Sucesso", "Alterações salvas com sucesso!");
    } catch (error) {
      Alert.alert("Erro", "Não foi possível salvar as alterações");
    }
  };

  const cancelEdit = () => {
    setEditedName(quote?.name || "");
    setIsEditMode(false);
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-neutral-900">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text className="text-white mt-4">Carregando orçamento...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!quote) {
    return (
      <SafeAreaView className="flex-1 bg-neutral-900">
        <View className="flex-1 items-center justify-center p-6">
          <Ionicons name="document-text-outline" size={60} color="#6B7280" />
          <Text className="text-white text-xl font-inter-black mt-4 text-center">
            Orçamento não encontrado
          </Text>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="bg-blue-500 px-6 py-3 rounded-xl mt-6"
          >
            <Text className="text-white font-inter-bold">Voltar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

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
            DETALHES DO ORÇAMENTO
          </Text>

          <TouchableOpacity
            onPress={() => setIsEditMode(!isEditMode)}
            className={`w-14 h-14 rounded-3xl items-center justify-center border ${
              isEditMode
                ? "bg-orange-600/20 border-orange-600/30"
                : "bg-zinc-800/50 border-zinc-700/40"
            }`}
          >
            <Ionicons
              name={isEditMode ? "close" : "pencil"}
              size={24}
              color={isEditMode ? "#FB923C" : "#60A5FA"}
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="mx-6 mb-8">
          <View className="bg-zinc-900/60 backdrop-blur-xl rounded-3xl p-6 border border-zinc-800/30">
            <View className="flex-row items-center justify-between mb-6">
              <View className="flex-1">
                {isEditMode ? (
                  <TextInput
                    value={editedName}
                    onChangeText={setEditedName}
                    className="text-white font-inter-bold text-xl bg-zinc-800/40 rounded-xl px-4 py-3 border border-zinc-700/40"
                    multiline
                  />
                ) : (
                  <Text className="text-white font-inter-bold text-xl mb-2">
                    {quote.name}
                  </Text>
                )}

                <View className="flex-row items-center gap-4 mt-3">
                  <View className="flex-row items-center gap-2">
                    <Ionicons name="calendar" size={16} color="#9CA3AF" />
                    <Text className="text-gray-400 font-inter-medium text-sm">
                      {formatDate(quote.createdAt || "")}
                    </Text>
                  </View>

                  <View
                    className={`px-3 py-1 rounded-xl border ${getStatusBgColor(quote.status)}`}
                  >
                    <Text
                      className={`font-inter-bold text-xs ${getStatusColor(quote.status)}`}
                    >
                      {getStatusText(quote.status)}
                    </Text>
                  </View>
                </View>
              </View>

              <View className="items-end">
                <Text className="text-gray-400 font-inter-medium text-sm mb-1">
                  Total
                </Text>
                <Text className="text-green-400 font-inter-black text-2xl">
                  {formatCurrency(totalAmount)}
                </Text>
              </View>
            </View>

            {subtotal > 0 && (
              <View className="mb-4 pt-4 border-t border-zinc-800/30">
                <View className="flex-row justify-between items-center mb-1">
                  <Text className="text-gray-400 font-inter-medium">
                    Subtotal
                  </Text>
                  <Text className="text-gray-400 font-inter-medium">
                    {formatCurrency(subtotal)}
                  </Text>
                </View>

                {discount > 0 && (
                  <View className="flex-row justify-between items-center mb-1">
                    <Text className="text-red-400 font-inter-medium">
                      Desconto
                    </Text>
                    <Text className="text-red-400 font-inter-medium">
                      -{formatCurrency(discountValue)}
                      {discountType === "PERCENTAGE" && ` (${discount}%)`}
                    </Text>
                  </View>
                )}

                <View className="flex-row justify-between items-center pt-2 border-t border-zinc-800/30">
                  <Text className="text-white font-inter-bold text-lg">
                    Total Final
                  </Text>
                  <Text className="text-green-400 font-inter-black text-xl">
                    {formatCurrency(totalAmount)}
                  </Text>
                </View>
              </View>
            )}

            <View className="flex-row items-center justify-between pt-4 border-t border-zinc-800/30">
              <View className="flex-row items-center gap-2">
                <View className="w-2 h-2 bg-blue-400 rounded-full" />
                <Text className="text-gray-400 font-inter-medium text-sm">
                  {selectedServices.length}{" "}
                  {selectedServices.length === 1 ? "serviço" : "serviços"}
                </Text>
              </View>

              <View className="flex-row gap-3">
                <TouchableOpacity
                  onPress={() => setShowDiscountModal(true)}
                  className={`px-4 py-2 rounded-xl border ${
                    discount > 0
                      ? "bg-purple-600/20 border-purple-600/30"
                      : "bg-blue-600/20 border-blue-600/30"
                  }`}
                >
                  <Text
                    className={`font-inter-bold text-sm ${
                      discount > 0 ? "text-purple-400" : "text-blue-400"
                    }`}
                  >
                    {discount > 0 ? "Alterar Desconto" : "Aplicar Desconto"}
                  </Text>
                </TouchableOpacity>

                {isEditMode && (
                  <>
                    <TouchableOpacity
                      onPress={cancelEdit}
                      className="bg-red-600/20 px-4 py-2 rounded-xl border border-red-600/30"
                    >
                      <Text className="text-red-400 font-inter-bold text-sm">
                        Cancelar
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={saveChanges}
                      className="bg-green-600/20 px-4 py-2 rounded-xl border border-green-600/30"
                    >
                      <Text className="text-green-400 font-inter-bold text-sm">
                        Salvar
                      </Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>
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

                <View className="pt-3 border-t border-zinc-800/30">
                  <View className="flex-row justify-between items-center">
                    <Text className="text-gray-400 font-inter-medium">
                      Valor do Desconto
                    </Text>
                    <Text className="text-red-400 font-inter-bold">
                      -{formatCurrency(discountValue)}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        )}

        <View className="mx-6 mb-8">
          <View className="flex-row items-center justify-between mb-6">
            <Text className="text-white font-inter-black text-lg">
              Serviços do Orçamento
            </Text>
            <TouchableOpacity
              onPress={() => setShowAddModal(true)}
              className="bg-blue-600/20 px-4 py-2 rounded-xl border border-blue-600/30 flex-row items-center gap-2"
            >
              <Ionicons name="add" size={16} color="#60A5FA" />
              <Text className="text-blue-400 font-inter-bold text-sm">
                Adicionar
              </Text>
            </TouchableOpacity>
          </View>

          <View className="gap-4">
            {selectedServices.length === 0 ? (
              <View className="bg-zinc-900/60 backdrop-blur-xl rounded-3xl p-8 items-center border border-zinc-800/30">
                <Ionicons name="construct-outline" size={40} color="#6B7280" />
                <Text className="text-white font-inter-black text-lg mt-4 text-center">
                  Nenhum serviço adicionado
                </Text>
                <Text className="text-gray-400 font-inter-medium text-sm mt-2 text-center">
                  Adicione serviços para compor este orçamento
                </Text>
              </View>
            ) : (
              selectedServices.map((service) => (
                <View
                  key={service.serviceId || service.id}
                  className="bg-zinc-900/60 backdrop-blur-xl rounded-3xl p-6 border border-zinc-800/30"
                >
                  <View className="flex-row items-start justify-between mb-4">
                    <View className="flex-1 pr-4">
                      <View className="flex-row items-center gap-3 mb-3">
                        <View className="w-12 h-12 bg-green-600/20 rounded-2xl items-center justify-center">
                          <Ionicons
                            name={service.icon as any}
                            size={20}
                            color="#10B981"
                          />
                        </View>
                        <View className="flex-1">
                          <Text className="text-white font-inter-bold text-base mb-1">
                            {service.name}
                          </Text>
                          <Text className="text-green-400 font-inter-semibold text-sm">
                            {formatCurrency(service.price)} / {service.unit}
                          </Text>
                        </View>
                      </View>
                    </View>
                    {isEditMode && (
                      <TouchableOpacity
                        onPress={() =>
                          removeService(service.serviceId || service.id)
                        }
                        className="w-10 h-10 bg-red-600/20 rounded-xl items-center justify-center border border-red-600/30"
                      >
                        <Ionicons name="trash" size={18} color="#EF4444" />
                      </TouchableOpacity>
                    )}
                  </View>

                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center gap-3">
                      {isEditMode && (
                        <TouchableOpacity
                          onPress={() =>
                            updateQuantity(
                              service.serviceId || service.id,
                              service.quantity - 1
                            )
                          }
                          className="w-10 h-10 bg-zinc-800/50 rounded-xl items-center justify-center border border-zinc-700/40"
                        >
                          <Ionicons name="remove" size={18} color="#9CA3AF" />
                        </TouchableOpacity>
                      )}

                      <View className="bg-zinc-800/40 rounded-xl px-4 py-3 border border-zinc-700/30 min-w-[70px] items-center">
                        <Text className="text-white font-inter-black text-lg">
                          {service.quantity}
                        </Text>
                        <Text className="text-gray-400 font-inter-medium text-xs">
                          {service.unit}(s)
                        </Text>
                      </View>

                      {isEditMode && (
                        <TouchableOpacity
                          onPress={() =>
                            updateQuantity(
                              service.serviceId || service.id,
                              service.quantity + 1
                            )
                          }
                          className="w-10 h-10 bg-zinc-800/50 rounded-xl items-center justify-center border border-zinc-700/40"
                        >
                          <Ionicons name="add" size={18} color="#9CA3AF" />
                        </TouchableOpacity>
                      )}
                    </View>

                    <Text className="text-green-400 font-inter-black text-xl">
                      {formatCurrency(service.total)}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>
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
              {discount > 0 ? "Alterar Desconto" : "Aplicar Desconto"}
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

            {discount > 0 && subtotal > 0 && (
              <View className="mb-6 p-4 bg-zinc-800/30 rounded-2xl border border-zinc-700/50">
                <Text className="text-white font-inter-bold text-center mb-2">
                  Resumo do Desconto
                </Text>
                <View className="flex-row justify-between items-center mb-1">
                  <Text className="text-gray-400 text-sm">Subtotal:</Text>
                  <Text className="text-gray-400 text-sm">
                    {formatCurrency(subtotal)}
                  </Text>
                </View>
                <View className="flex-row justify-between items-center mb-1">
                  <Text className="text-red-400 text-sm">Desconto:</Text>
                  <Text className="text-red-400 text-sm">
                    -{formatCurrency(discountValue)}
                    {discountType === "PERCENTAGE" && ` (${discount}%)`}
                  </Text>
                </View>
                <View className="flex-row justify-between items-center pt-2 border-t border-zinc-700/50">
                  <Text className="text-white font-inter-bold">
                    Total Final:
                  </Text>
                  <Text className="text-green-400 font-inter-bold">
                    {formatCurrency(totalAmount)}
                  </Text>
                </View>
              </View>
            )}

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
                disabled={
                  discount < 0 ||
                  (discountType === "PERCENTAGE" && discount > 100)
                }
                className={`flex-1 rounded-2xl py-4 ${
                  discount < 0 ||
                  (discountType === "PERCENTAGE" && discount > 100)
                    ? "bg-gray-600"
                    : "bg-blue-500"
                }`}
              >
                <Text className="text-white font-inter-bold text-center">
                  {discount > 0 ? "Aplicar" : "Remover"}
                </Text>
              </TouchableOpacity>
            </View>

            {discountType === "PERCENTAGE" && discount > 100 && (
              <Text className="text-red-400 text-xs text-center mt-3">
                O desconto percentual não pode ser maior que 100%
              </Text>
            )}
          </View>
        </View>
      </Modal>

      <Modal
        visible={showAddModal}
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <SafeAreaView className="flex-1 bg-neutral-900">
          <View className="px-6 py-4 border-b border-zinc-800/30">
            <View className="flex-row items-center justify-between">
              <Text className="text-white font-inter-black text-lg">
                Adicionar Serviço
              </Text>
              <TouchableOpacity
                onPress={() => setShowAddModal(false)}
                className="w-10 h-10 bg-zinc-800/50 rounded-xl items-center justify-center border border-zinc-700/40"
              >
                <Ionicons name="close" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
          </View>

          <View className="mx-6 my-6">
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
              </View>
            </View>
          </View>

          <View className="mb-6">
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 24 }}
            >
              <View className="flex-row gap-3">
                {categories.map((category) => (
                  <TouchableOpacity
                    key={category.id}
                    onPress={() => setSelectedCategory(category.id)}
                  >
                    {selectedCategory === category.id ? (
                      <LinearGradient
                        colors={["#3B82F6", "#1E40AF"]}
                        className="flex-row items-center gap-3 px-5 py-3 rounded-2xl"
                        style={{ borderRadius: 12 }}
                      >
                        <Ionicons
                          name={category.icon as any}
                          size={18}
                          color="white"
                        />
                        <Text className="text-white font-inter-bold text-sm">
                          {category.name}
                        </Text>
                      </LinearGradient>
                    ) : (
                      <View className="flex-row items-center gap-3 px-5 py-3 rounded-2xl bg-zinc-800/40 border border-zinc-700/30">
                        <Ionicons
                          name={category.icon as any}
                          size={18}
                          color="#9CA3AF"
                        />
                        <Text className="text-gray-400 font-inter-medium text-sm">
                          {category.name}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          <ScrollView className="flex-1 px-6">
            {servicesLoading ? (
              <View className="items-center justify-center py-8">
                <ActivityIndicator size="large" color="#3B82F6" />
                <Text className="text-white mt-4">Carregando serviços...</Text>
              </View>
            ) : (
              <View className="gap-4">
                {filteredServices.length === 0 && !servicesLoading && (
                  <View className="bg-zinc-900/60 backdrop-blur-xl rounded-3xl p-8 items-center border border-zinc-800/30">
                    <View className="w-16 h-16 bg-zinc-800/50 rounded-3xl items-center justify-center mb-4">
                      <Ionicons name="search" size={32} color="#6B7280" />
                    </View>
                    <Text className="text-white font-inter-black text-xl mb-2">
                      Nenhum serviço encontrado
                    </Text>
                    <Text className="text-gray-400 font-inter-medium text-sm text-center">
                      {availableServices.length === 0
                        ? "Nenhum serviço cadastrado. Cadastre serviços primeiro."
                        : "Nenhum serviço corresponde aos filtros aplicados"}
                    </Text>
                  </View>
                )}

                {filteredServices.map((service) => (
                  <AddServiceItem
                    key={service.id}
                    service={service}
                    onAdd={addService}
                    formatCurrency={formatCurrency}
                  />
                ))}
              </View>
            )}
            <View className="h-20" />
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
