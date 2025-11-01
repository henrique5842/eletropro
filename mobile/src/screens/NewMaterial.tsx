import { useState, useEffect } from 'react';
import { 
  SafeAreaView, 
  View, 
  TouchableOpacity, 
  Text, 
  ScrollView, 
  TextInput, 
  Alert,
  ActivityIndicator 
} from "react-native";
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';

import { materialService, Material } from '../context/MaterialsContext';
import { materialListContext } from '../context/MaterialBudget';

interface SelectedMaterial extends Material {
  quantity: number;
  total: number;
}

interface RouteParams {
  clientId: string;
  budgetId?: string;
}

export function NewMaterial() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<{ params: RouteParams }, "params">>();
  const { clientId, budgetId } = route.params || {};

  const [listName, setListName] = useState('');
  const [listDescription, setListDescription] = useState('');
  const [selectedMaterials, setSelectedMaterials] = useState<SelectedMaterial[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isSaving, setIsSaving] = useState(false);

  const [availableMaterials, setAvailableMaterials] = useState<Material[]>([]);
  const [materialsLoading, setMaterialsLoading] = useState(true);
  const [materialsError, setMaterialsError] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);

  const loadMaterials = async () => {
    try {
      setMaterialsLoading(true);
      setMaterialsError(null);
      
      const [materialsData, categoriesData] = await Promise.all([
        materialService.list(),
        materialService.getCategories()
      ]);
      
      setAvailableMaterials(materialsData);
      setCategories(['Todos', ...categoriesData]);
      
    } catch (error) {
      setMaterialsError(error instanceof Error ? error.message : 'Erro desconhecido');
      
      setCategories([
        'Todos',
        'Fios e Cabos',
        'Eletrodutos',
        'Disjuntores',
        'Tomadas e Interruptores',
        'Luminárias',
        'Quadros de Distribuição',
        'Ferramentas',
        'Outros'
      ]);
    } finally {
      setMaterialsLoading(false);
    }
  };

  useEffect(() => {
    loadMaterials();
  }, []);

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getUnitDisplay = (unit: string): string => {
    const unitMap: { [key: string]: string } = {
      'UNIT': 'unidade',
      'METER': 'metro',
      'SQUARE_METER': 'm²',
      'LINEAR_METER': 'metro linear'
    };
    return unitMap[unit] || unit.toLowerCase();
  };

  const getCategoryIcon = (category?: string): string => {
    const iconMap: { [key: string]: string } = {
      'Fios e Cabos': 'git-network',
      'Eletrodutos': 'layers',
      'Disjuntores': 'power',
      'Tomadas e Interruptores': 'flash',
      'Luminárias': 'bulb',
      'Quadros de Distribuição': 'grid',
      'Ferramentas': 'construct',
      'Outros': 'cube'
    };
    return iconMap[category || ''] || 'cube';
  };

  const filteredMaterials = availableMaterials.filter(material => {
    const matchesCategory = selectedCategory === 'all' || selectedCategory === 'Todos' || material.category === selectedCategory;
    const matchesSearch = material.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         material.category.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const addOrUpdateMaterial = (material: Material, quantity: number) => {
    const existingMaterialIndex = selectedMaterials.findIndex(m => m.id === material.id);
    
    if (existingMaterialIndex >= 0) {
      const updatedMaterials = [...selectedMaterials];
      updatedMaterials[existingMaterialIndex].quantity += quantity;
      updatedMaterials[existingMaterialIndex].total = updatedMaterials[existingMaterialIndex].quantity * material.price;
      setSelectedMaterials(updatedMaterials);
    } else {
      const newMaterial: SelectedMaterial = {
        ...material,
        quantity: quantity,
        total: material.price * quantity
      };
      setSelectedMaterials([...selectedMaterials, newMaterial]);
    }
  };

  const updateQuantity = (materialId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeMaterial(materialId);
      return;
    }

    setSelectedMaterials(selectedMaterials.map(material => 
      material.id === materialId 
        ? { ...material, quantity: newQuantity, total: material.price * newQuantity }
        : material
    ));
  };

  const removeMaterial = (materialId: string) => {
    setSelectedMaterials(selectedMaterials.filter(material => material.id !== materialId));
  };

  const totalAmount = selectedMaterials.reduce((sum, material) => sum + material.total, 0);

  const saveMaterialList = async () => {
    if (!listName.trim()) {
      Alert.alert("Atenção", "Digite um nome para a lista de materiais");
      return;
    }

    if (selectedMaterials.length === 0) {
      Alert.alert("Atenção", "Adicione pelo menos um material à lista");
      return;
    }

    if (!clientId) {
      Alert.alert("Erro", "ID do cliente não encontrado");
      return;
    }

    try {
      setIsSaving(true);

      const materialListData = {
        name: listName.trim(),
        clientId: clientId,
        budgetId: budgetId,
        notes: listDescription.trim() || undefined
      };
      
      const createdMaterialList = await materialListContext.createMaterialList(materialListData);

      for (let i = 0; i < selectedMaterials.length; i++) {
        const material = selectedMaterials[i];
        
        const itemData = {
          materialId: material.id,
          name: material.name,
          description: material.category || `Material: ${material.category || 'Sem categoria'}`,
          quantity: material.quantity,
          unitPrice: material.price,
          unit: material.unit
        };

        try {
          await materialListContext.addMaterialListItem(createdMaterialList.id!, itemData);
        } catch (itemError) {
        }
      }

      Alert.alert(
        "Sucesso", 
        "Lista de materiais salva com sucesso!",
        [
          {
            text: "OK",
            onPress: () => {
              navigation.goBack();
            }
          }
        ]
      );

    } catch (error) {
      Alert.alert(
        "Erro ao salvar",
        error instanceof Error 
          ? error.message 
          : "Ocorreu um erro ao salvar a lista de materiais. Tente novamente."
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleGoBack = () => {
    if (selectedMaterials.length > 0) {
      Alert.alert(
        "Descartar alterações?",
        "Você tem materiais selecionados. Deseja descartar as alterações?",
        [
          { text: "Cancelar", style: "cancel" },
          { 
            text: "Descartar", 
            style: "destructive",
            onPress: () => navigation.goBack()
          }
        ]
      );
    } else {
      navigation.goBack();
    }
  };

  const retryLoadMaterials = () => {
    loadMaterials();
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
          
          <Text className="text-white font-inter-black text-sm">NOVA LISTA DE MATERIAIS</Text>

          <TouchableOpacity 
            onPress={saveMaterialList}
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
              <View className="w-14 h-14 bg-purple-600/20 rounded-2xl items-center justify-center mr-4">
                <Ionicons name="cube" size={28} color="#A855F7" />
              </View>
              <View className="flex-1">
                <Text className="text-gray-400 font-inter-medium text-sm mb-2">Nome da Lista</Text>
                <TextInput
                  value={listName}
                  onChangeText={setListName}
                  placeholder="Ex: Materiais para Instalação Elétrica"
                  placeholderTextColor="#6B7280"
                  className="text-white font-inter-bold text-lg bg-zinc-800/40 rounded-xl px-4 py-3 border border-zinc-700/40"
                />
              </View>
            </View>

            <View className="mb-4">
              <Text className="text-gray-400 font-inter-medium text-sm mb-2">Observações (opcional)</Text>
              <TextInput
                value={listDescription}
                onChangeText={setListDescription}
                placeholder="Adicione observações sobre esta lista de materiais..."
                placeholderTextColor="#6B7280"
                multiline
                numberOfLines={3}
                className="text-white font-inter-medium text-base bg-zinc-800/40 rounded-xl px-4 py-3 border border-zinc-700/40 min-h-[80px]"
              />
            </View>

            {budgetId && (
              <View className="flex-row items-center gap-3 mb-4 p-3 bg-blue-600/10 rounded-xl border border-blue-600/20">
                <Ionicons name="document-text" size={20} color="#60A5FA" />
                <Text className="text-blue-400 font-inter-medium text-sm">
                  Vinculada a um orçamento
                </Text>
              </View>
            )}

            {totalAmount > 0 && (
              <View className="pt-6 border-t border-zinc-800/30">
                <View className="flex-row justify-between items-center mb-2">
                  <Text className="text-gray-400 font-inter-medium text-base">Total da Lista</Text>
                  <Text className="text-green-400 font-inter-black text-3xl">
                    {formatCurrency(totalAmount)}
                  </Text>
                </View>
                <View className="flex-row items-center gap-2">
                  <View className="w-2 h-2 bg-green-400 rounded-full" />
                  <Text className="text-gray-500 font-inter-medium text-sm">
                    {selectedMaterials.length} {selectedMaterials.length === 1 ? 'material' : 'materiais'} selecionado{selectedMaterials.length > 1 ? 's' : ''}
                  </Text>
                </View>
              </View>
            )}
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
                <TouchableOpacity onPress={() => setSearchTerm('')}>
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
                  onPress={() => setSelectedCategory(category === 'Todos' ? 'all' : category)}
                  className="active:scale-95"
                >
                  {(selectedCategory === category || (selectedCategory === 'all' && category === 'Todos')) ? (
                    <LinearGradient
                      colors={['#8B5CF6', '#7C3AED']}
                      className="flex-row items-center gap-3 px-5 py-3 rounded-2xl"
                      style={{
                        shadowColor: "#8B5CF6",
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.3,
                        shadowRadius: 8,
                        elevation: 6,
                        borderRadius: 16,
                      }}
                    >
                      <Ionicons name={getCategoryIcon(category) as any} size={18} color="white" />
                      <Text className="text-white font-inter-bold text-sm">{category}</Text>
                    </LinearGradient>
                  ) : (
                    <View className="flex-row items-center gap-3 px-5 py-3 rounded-2xl bg-zinc-800/40 border border-zinc-700/30">
                      <Ionicons name={getCategoryIcon(category) as any} size={18} color="#9CA3AF" />
                      <Text className="text-gray-400 font-inter-medium text-sm">{category}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {selectedMaterials.length > 0 && (
          <View className="mx-6 mb-8">
            <View className="flex-row items-center justify-between mb-6">
              <Text className="text-white font-inter-black text-lg">
                Materiais Selecionados
              </Text>
              <View className="bg-green-600/20 px-4 py-2 rounded-xl border border-green-600/30">
                <Text className="text-green-400 font-inter-bold text-sm">
                  {selectedMaterials.length}
                </Text>
              </View>
            </View>
            
            <View className="gap-4">
              {selectedMaterials.map((material) => (
                <View key={material.id} className="bg-zinc-900/60 backdrop-blur-xl rounded-3xl p-6 border border-zinc-800/30">
                  <View className="flex-row items-start justify-between mb-4">
                    <View className="flex-1 pr-4">
                      <View className="flex-row items-center gap-3 mb-3">
                        <View className="w-12 h-12 bg-green-600/20 rounded-2xl items-center justify-center">
                          <Ionicons name={getCategoryIcon(material.category) as any} size={20} color="#10B981" />
                        </View>
                        <View className="flex-1">
                          <Text className="text-white font-inter-bold text-base mb-1">
                            {material.name}
                          </Text>
                          <Text className="text-green-400 font-inter-semibold text-sm">
                            {formatCurrency(material.price)} / {getUnitDisplay(material.unit)}
                          </Text>
                          <Text className="text-gray-400 font-inter-medium text-xs mt-1">
                            Categoria: {material.category}
                          </Text>
                        </View>
                      </View>
                    </View>
                    <TouchableOpacity 
                      onPress={() => removeMaterial(material.id)}
                      className="w-10 h-10 bg-red-600/20 rounded-xl items-center justify-center border border-red-600/30"
                    >
                      <Ionicons name="trash" size={18} color="#EF4444" />
                    </TouchableOpacity>
                  </View>

                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center gap-3">
                      <TouchableOpacity 
                        onPress={() => updateQuantity(material.id, material.quantity - 1)}
                        className="w-10 h-10 bg-zinc-800/50 rounded-xl items-center justify-center border border-zinc-700/40"
                      >
                        <Ionicons name="remove" size={18} color="#9CA3AF" />
                      </TouchableOpacity>

                      <View className="bg-zinc-800/40 rounded-xl px-4 py-3 border border-zinc-700/30 min-w-[70px] items-center">
                        <Text className="text-white font-inter-black text-lg">{material.quantity}</Text>
                        <Text className="text-gray-400 font-inter-medium text-xs">{getUnitDisplay(material.unit)}(s)</Text>
                      </View>

                      <TouchableOpacity 
                        onPress={() => updateQuantity(material.id, material.quantity + 1)}
                        className="w-10 h-10 bg-zinc-800/50 rounded-xl items-center justify-center border border-zinc-700/40"
                      >
                        <Ionicons name="add" size={18} color="#9CA3AF" />
                      </TouchableOpacity>
                    </View>

                    <Text className="text-green-400 font-inter-black text-xl">
                      {formatCurrency(material.total)}
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
              Materiais Disponíveis
            </Text>
            <View className="bg-purple-600/20 px-4 py-2 rounded-xl border border-purple-600/30">
              <Text className="text-purple-400 font-inter-bold text-sm">
                {materialsLoading ? '...' : filteredMaterials.length}
              </Text>
            </View>
          </View>
          
          {materialsLoading ? (
            <View className="bg-zinc-900/60 backdrop-blur-xl rounded-3xl p-8 items-center border border-zinc-800/30">
              <ActivityIndicator size="large" color="#8B5CF6" />
              <Text className="text-white font-inter-black text-xl mt-4 mb-2">Carregando materiais...</Text>
              <Text className="text-gray-400 font-inter-medium text-sm text-center">
                Buscando materiais disponíveis na API
              </Text>
            </View>
          ) : materialsError ? (
            <View className="bg-zinc-900/60 backdrop-blur-xl rounded-3xl p-8 items-center border border-zinc-800/30">
              <View className="w-16 h-16 bg-red-600/20 rounded-3xl items-center justify-center mb-4">
                <Ionicons name="alert-circle" size={32} color="#EF4444" />
              </View>
              <Text className="text-white font-inter-black text-xl mb-2">Erro ao carregar materiais</Text>
              <Text className="text-gray-400 font-inter-medium text-sm text-center mb-4">
                {materialsError}
              </Text>
              <TouchableOpacity
                onPress={retryLoadMaterials}
                className="bg-purple-500 px-6 py-3 rounded-xl"
              >
                <Text className="text-white font-inter-bold text-sm">Tentar novamente</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View className="gap-4">
              {filteredMaterials.map((material) => (
                <MaterialItem 
                  key={material.id} 
                  material={material} 
                  onAdd={addOrUpdateMaterial}
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
                  <Text className="text-white font-inter-black text-xl mb-2">Nenhum material encontrado</Text>
                  <Text className="text-gray-400 font-inter-medium text-sm text-center">
                    Tente ajustar os filtros ou termo de pesquisa
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>

        <View className="h-32"/>
      </ScrollView>

      {selectedMaterials.length > 0 && (
        <View className="absolute bottom-8 left-6 right-6">
          <TouchableOpacity
            onPress={saveMaterialList}
            disabled={isSaving}
            className="active:scale-95"
          >
            <LinearGradient
              colors={isSaving ? ['#6B7280', '#4B5563'] : ['#10B981', '#059669']}
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
                  <Text className="text-white font-inter-black text-lg ml-3">Salvando...</Text>
                </>
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={24} color="white" />
                  <Text className="text-white font-inter-black text-lg ml-3">
                    Salvar Lista • {formatCurrency(totalAmount)}
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

interface MaterialItemProps {
  material: Material;
  onAdd: (material: Material, quantity: number) => void;
  formatCurrency: (value: number) => string;
  getUnitDisplay: (unit: string) => string;
  getCategoryIcon: (category?: string) => string;
}

function MaterialItem({ material, onAdd, formatCurrency, getUnitDisplay, getCategoryIcon }: MaterialItemProps) {
  const [quantity, setQuantity] = useState(1);

  const handleAdd = () => {
    onAdd(material, quantity);
    setQuantity(1);
  };

  return (
    <View className="bg-zinc-900/60 backdrop-blur-xl rounded-3xl p-6 border border-zinc-800/30">
      <View className="flex-row items-start justify-between mb-4">
        <View className="flex-1 pr-4">
          <View className="flex-row items-center gap-3 mb-3">
            <View className="w-12 h-12 bg-purple-600/20 rounded-2xl items-center justify-center">
              <Ionicons name={getCategoryIcon(material.category) as any} size={20} color="#A855F7" />
            </View>
            <View className="flex-1">
              <Text className="text-white font-inter-bold text-base mb-1">
                {material.name}
              </Text>
              <Text className="text-purple-400 font-inter-semibold text-sm">
                {formatCurrency(material.price)} / {getUnitDisplay(material.unit)}
              </Text>
              <Text className="text-gray-400 font-inter-medium text-xs mt-1">
                Categoria: {material.category}
              </Text>
              <View className="bg-purple-600/10 px-2 py-1 rounded-lg mt-2 self-start">
                <Text className="text-purple-400 font-inter-medium text-xs">
                  {material.category}
                </Text>
              </View>
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
            <Text className="text-white font-inter-black text-lg">{quantity}</Text>
            <Text className="text-gray-400 font-inter-medium text-xs">{getUnitDisplay(material.unit)}(s)</Text>
          </View>

          <TouchableOpacity 
            onPress={() => setQuantity(quantity + 1)}
            className="w-10 h-10 bg-zinc-800/50 rounded-xl items-center justify-center border border-zinc-700/40"
          >
            <Ionicons name="add" size={18} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={handleAdd}
          className="active:scale-95"
        >
          <LinearGradient
            colors={['#8B5CF6', '#7C3AED']}
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