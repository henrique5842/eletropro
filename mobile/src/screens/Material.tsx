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
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

import { materialService, Material } from "../context/MaterialsContext";

type MaterialUnit = "UNIT" | "METER";

export function Materials() {
  const navigation = useNavigation();

  const [availableMaterials, setAvailableMaterials] = useState<Material[]>([]);
  const [materialsLoading, setMaterialsLoading] = useState(true);
  const [materialsError, setMaterialsError] = useState<string | null>(null);
  const [materialCategories, setMaterialCategories] = useState<string[]>([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    category: "",
    price: "",
    unit: "UNIT" as MaterialUnit,
    description: "",
  });

  const loadMaterials = async () => {
    try {
      setMaterialsLoading(true);
      setMaterialsError(null);

      const [materialsData, categoriesData] = await Promise.all([
        materialService.list(),
        materialService.getCategories(),
      ]);

      setAvailableMaterials(materialsData);
      setMaterialCategories(["Todos", ...categoriesData]);
    } catch (error) {
      setMaterialsError(
        error instanceof Error ? error.message : "Erro desconhecido"
      );

      setMaterialCategories([
        "Todos",
        "Fios e Cabos",
        "Disjuntores",
        "Tomadas e Interruptores",
        "Lâmpadas",
        "Condutos",
        "Quadros Elétricos",
        "Ferramentas",
        "Outros",
      ]);
    } finally {
      setMaterialsLoading(false);
    }
  };

  useEffect(() => {
    loadMaterials();
  }, []);

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const getUnitDisplay = (unit: MaterialUnit | string): string => {
    const unitMap: { [key: string]: string } = {
      UNIT: "unidade",
      METER: "metro",
      KG: "kg",
      BOX: "caixa",
      ROLL: "rolo",
    };
    return unitMap[unit] || unit.toLowerCase();
  };

  const getCategoryIcon = (category?: string): string => {
    const iconMap: { [key: string]: string } = {
      "Fios e Cabos": "git-branch",
      Disjuntores: "power",
      "Tomadas e Interruptores": "toggle",
      Lâmpadas: "bulb",
      Condutos: "tube",
      "Quadros Elétricos": "grid",
      Ferramentas: "hammer",
      Outros: "cube",
    };
    return iconMap[category || ""] || "cube";
  };

  const filteredMaterials = availableMaterials.filter((material) => {
    const matchesCategory =
      selectedCategory === "all" ||
      selectedCategory === "Todos" ||
      material.category === selectedCategory;
    const matchesSearch = material.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const openCreateModal = () => {
    setFormData({
      name: "",
      category: "",
      price: "",
      unit: "UNIT",
      description: "",
    });
    setEditingMaterial(null);
    setShowCreateModal(true);
  };

  const openEditModal = (material: Material) => {
    setFormData({
      name: material.name,
      category: material.category,
      price: material.price.toString(),
      unit: material.unit as MaterialUnit,
      description: "",
    });
    setEditingMaterial(material);
    setShowCreateModal(true);
  };

  const closeModal = () => {
    setShowCreateModal(false);
    setEditingMaterial(null);
    setFormData({
      name: "",
      category: "",
      price: "",
      unit: "UNIT",
      description: "",
    });
  };

  const saveMaterial = async () => {
    if (!formData.name.trim()) {
      Alert.alert("Atenção", "Digite o nome do material");
      return;
    }

    if (!formData.category.trim()) {
      Alert.alert("Atenção", "Selecione a categoria");
      return;
    }

    if (!formData.price || parseFloat(formData.price) <= 0) {
      Alert.alert("Atenção", "Digite um preço válido");
      return;
    }

    try {
      setIsSubmitting(true);

      const materialData = {
        name: formData.name.trim(),
        category: formData.category.trim(),
        price: parseFloat(formData.price),
        unit: formData.unit,
      };

      if (editingMaterial) {
        await materialService.update(editingMaterial.id, materialData);
        Alert.alert("Sucesso", "Material atualizado com sucesso!");
      } else {
        await materialService.create(materialData);
        Alert.alert("Sucesso", "Material criado com sucesso!");
      }

      await loadMaterials();
      closeModal();
    } catch (error) {
      Alert.alert(
        "Erro",
        error instanceof Error ? error.message : "Erro ao salvar material"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteMaterial = (material: Material) => {
    Alert.alert(
      "Confirmar exclusão",
      `Deseja realmente excluir o material "${material.name}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              await materialService.delete(material.id);
              Alert.alert("Sucesso", "Material excluído com sucesso!");
              await loadMaterials();
            } catch (error) {
              Alert.alert("Erro", "Erro ao excluir material");
            }
          },
        },
      ]
    );
  };

  const retryLoadMaterials = () => {
    loadMaterials();
  };

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

          <Text className="text-white font-inter-black text-sm">MATERIAIS</Text>

          <TouchableOpacity
            onPress={openCreateModal}
            className="w-14 h-14 bg-green-600/20 rounded-3xl items-center justify-center border border-green-600/30"
          >
            <Ionicons name="add" size={24} color="#10B981" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="mx-6 mb-8">
          <View className="bg-zinc-900/60 backdrop-blur-xl rounded-3xl p-6 border border-zinc-800/30">
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="text-gray-400 font-inter-medium text-sm mb-1">
                  Total de Materiais
                </Text>
                <Text className="text-white font-inter-black text-2xl">
                  {materialsLoading ? "..." : availableMaterials.length}
                </Text>
              </View>

              <View className="flex-1 items-center">
                <Text className="text-gray-400 font-inter-medium text-sm mb-1">
                  Categorias
                </Text>
                <Text className="text-blue-400 font-inter-black text-2xl">
                  {materialCategories.length > 1
                    ? materialCategories.length - 1
                    : 0}
                </Text>
              </View>

              <View className="flex-1 items-end">
                <Text className="text-gray-400 font-inter-medium text-sm mb-1">
                  Filtrados
                </Text>
                <Text className="text-green-400 font-inter-black text-2xl">
                  {filteredMaterials.length}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View className="mx-6 mb-6">
          <View className="bg-zinc-800/40 rounded-2xl border border-zinc-700/30 backdrop-blur-sm">
            <View className="flex-row items-center px-5 py-4">
              <Ionicons name="search" size={22} color="#9CA3AF" />
              <TextInput
                value={searchTerm}
                onChangeText={setSearchTerm}
                placeholder="Pesquisar materiais..."
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
              {materialCategories.map((category, index) => (
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
                      colors={["#10B981", "#059669"]}
                      className="flex-row items-center gap-3 px-5 py-3 rounded-2xl"
                      style={{
                        shadowColor: "#10B981",
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

        <View className="mx-6 mb-8">
          <View className="flex-row items-center justify-between mb-6">
            <Text className="text-white font-inter-black text-lg">
              Materiais Disponíveis
            </Text>
            <TouchableOpacity
              onPress={retryLoadMaterials}
              className="bg-blue-600/20 px-4 py-2 rounded-xl border border-blue-600/30"
            >
              <Text className="text-blue-400 font-inter-bold text-sm">
                Atualizar
              </Text>
            </TouchableOpacity>
          </View>

          {materialsLoading ? (
            <View className="bg-zinc-900/60 backdrop-blur-xl rounded-3xl p-8 items-center border border-zinc-800/30">
              <ActivityIndicator size="large" color="#10B981" />
              <Text className="text-white font-inter-black text-xl mt-4 mb-2">
                Carregando materiais...
              </Text>
              <Text className="text-gray-400 font-inter-medium text-sm text-center">
                Buscando materiais disponíveis na API
              </Text>
            </View>
          ) : materialsError ? (
            <View className="bg-zinc-900/60 backdrop-blur-xl rounded-3xl p-8 items-center border border-zinc-800/30">
              <View className="w-16 h-16 bg-red-600/20 rounded-3xl items-center justify-center mb-4">
                <Ionicons name="alert-circle" size={32} color="#EF4444" />
              </View>
              <Text className="text-white font-inter-black text-xl mb-2">
                Erro ao carregar materiais
              </Text>
              <Text className="text-gray-400 font-inter-medium text-sm text-center mb-4">
                {materialsError}
              </Text>
              <TouchableOpacity
                onPress={retryLoadMaterials}
                className="bg-blue-500 px-6 py-3 rounded-xl"
              >
                <Text className="text-white font-inter-bold text-sm">
                  Tentar novamente
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View className="gap-4">
              {filteredMaterials.map((material) => (
                <MaterialItem
                  key={material.id}
                  material={material}
                  onEdit={openEditModal}
                  onDelete={deleteMaterial}
                  formatCurrency={formatCurrency}
                  getUnitDisplay={getUnitDisplay}
                  getCategoryIcon={getCategoryIcon}
                />
              ))}

              {filteredMaterials.length === 0 && !materialsLoading && (
                <View className="bg-zinc-900/60 backdrop-blur-xl rounded-3xl p-8 items-center border border-zinc-800/30">
                  <View className="w-16 h-16 bg-zinc-800/50 rounded-3xl items-center justify-center mb-4">
                    <Ionicons name="search" size={32} color="#6B7280" />
                  </View>
                  <Text className="text-white font-inter-black text-xl mb-2">
                    Nenhum material encontrado
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

      {showCreateModal && (
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="absolute inset-0"
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={closeModal}
            className="flex-1 bg-black/50 justify-end"
          >
            <TouchableOpacity
              activeOpacity={1}
              onPress={(e) => e.stopPropagation()}
            >
              <View className="bg-zinc-900 rounded-t-3xl border-t border-zinc-800">
                <View className="p-6">
                  <View className="flex-row items-center justify-between mb-6">
                    <Text className="text-white font-inter-black text-lg">
                      {editingMaterial ? "Editar Material" : "Novo Material"}
                    </Text>
                    <TouchableOpacity onPress={closeModal}>
                      <Ionicons name="close" size={24} color="#9CA3AF" />
                    </TouchableOpacity>
                  </View>

                  <ScrollView
                    showsVerticalScrollIndicator={false}
                    style={{ maxHeight: 500 }}
                  >
                    <View className="mb-4">
                      <Text className="text-gray-400 font-inter-medium text-sm mb-2">
                        Nome do Material
                      </Text>
                      <TextInput
                        value={formData.name}
                        onChangeText={(text) =>
                          setFormData({ ...formData, name: text })
                        }
                        placeholder="Ex: Cabo flexível 2,5mm"
                        placeholderTextColor="#6B7280"
                        className="text-white font-inter-medium text-base bg-zinc-800/40 rounded-xl px-4 py-3 border border-zinc-700/40"
                      />
                    </View>

                    <View className="mb-4">
                      <Text className="text-gray-400 font-inter-medium text-sm mb-2">
                        Categoria
                      </Text>
                      <TextInput
                        value={formData.category}
                        onChangeText={(text) =>
                          setFormData({ ...formData, category: text })
                        }
                        placeholder="Ex: Fios e Cabos"
                        placeholderTextColor="#6B7280"
                        className="text-white font-inter-medium text-base bg-zinc-800/40 rounded-xl px-4 py-3 border border-zinc-700/40"
                      />
                    </View>

                    <View className="flex-row gap-4 mb-4">
                      <View className="flex-1">
                        <Text className="text-gray-400 font-inter-medium text-sm mb-2">
                          Preço
                        </Text>
                        <TextInput
                          value={formData.price}
                          onChangeText={(text) =>
                            setFormData({ ...formData, price: text })
                          }
                          placeholder="0,00"
                          placeholderTextColor="#6B7280"
                          keyboardType="numeric"
                          className="text-white font-inter-medium text-base bg-zinc-800/40 rounded-xl px-4 py-3 border border-zinc-700/40"
                        />
                      </View>

                      <View className="flex-1">
                        <Text className="text-gray-400 font-inter-medium text-sm mb-2">
                          Unidade
                        </Text>
                        <ScrollView
                          horizontal
                          showsHorizontalScrollIndicator={false}
                        >
                          <View className="flex-row gap-2">
                            {(["UNIT", "METER"] as MaterialUnit[]).map(
                              (unit) => (
                                <TouchableOpacity
                                  key={unit}
                                  onPress={() =>
                                    setFormData({ ...formData, unit })
                                  }
                                  className={`px-4 py-3 rounded-xl border ${
                                    formData.unit === unit
                                      ? "bg-green-600/20 border-green-600/30"
                                      : "bg-zinc-800/40 border-zinc-700/40"
                                  }`}
                                >
                                  <Text
                                    className={`font-inter-medium text-sm ${
                                      formData.unit === unit
                                        ? "text-green-400"
                                        : "text-gray-400"
                                    }`}
                                  >
                                    {getUnitDisplay(unit)}
                                  </Text>
                                </TouchableOpacity>
                              )
                            )}
                          </View>
                        </ScrollView>
                      </View>
                    </View>

                    <View className="flex-row gap-4 mt-6">
                      <TouchableOpacity
                        onPress={closeModal}
                        className="flex-1 bg-zinc-800/50 rounded-xl py-4 items-center border border-zinc-700/40"
                      >
                        <Text className="text-gray-400 font-inter-bold text-base">
                          Cancelar
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={saveMaterial}
                        disabled={isSubmitting}
                        className="flex-1 bg-green-600 rounded-xl py-4 items-center"
                      >
                        {isSubmitting ? (
                          <ActivityIndicator size="small" color="white" />
                        ) : (
                          <Text className="text-white font-inter-bold text-base">
                            {editingMaterial ? "Salvar" : "Criar"}
                          </Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  </ScrollView>
                </View>
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

interface MaterialItemProps {
  material: Material;
  onEdit: (material: Material) => void;
  onDelete: (material: Material) => void;
  formatCurrency: (value: number) => string;
  getUnitDisplay: (unit: MaterialUnit | string) => string;
  getCategoryIcon: (category?: string) => string;
}

function MaterialItem({
  material,
  onEdit,
  onDelete,
  formatCurrency,
  getUnitDisplay,
  getCategoryIcon,
}: MaterialItemProps) {
  return (
    <View className="bg-zinc-900/60 backdrop-blur-xl rounded-3xl p-6 border border-zinc-800/30">
      <View className="flex-row items-start justify-between mb-4">
        <View className="flex-1 pr-4">
          <View className="flex-row items-center gap-3 mb-3">
            <View className="w-12 h-12 bg-green-600/20 rounded-2xl items-center justify-center">
              <Ionicons
                name={getCategoryIcon(material.category) as any}
                size={20}
                color="#10B981"
              />
            </View>
            <View className="flex-1">
              <Text className="text-white font-inter-bold text-base mb-1">
                {material.name}
              </Text>
              <Text className="text-green-400 font-inter-semibold text-sm">
                {formatCurrency(material.price)} /{" "}
                {getUnitDisplay(material.unit)}
              </Text>
              <View className="bg-green-600/10 px-2 py-1 rounded-lg mt-2 self-start">
                <Text className="text-green-400 font-inter-medium text-xs">
                  {material.category}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View className="flex-row gap-2">
          <TouchableOpacity
            onPress={() => onEdit(material)}
            className="w-10 h-10 bg-blue-600/20 rounded-xl items-center justify-center border border-blue-600/30"
          >
            <Ionicons name="create" size={18} color="#3B82F6" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => onDelete(material)}
            className="w-10 h-10 bg-red-600/20 rounded-xl items-center justify-center border border-red-600/30"
          >
            <Ionicons name="trash" size={18} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
