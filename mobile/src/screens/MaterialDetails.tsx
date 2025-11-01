import React, { useState, useEffect, useCallback } from 'react';
import { 
  SafeAreaView, View, TouchableOpacity, Text, ScrollView, TextInput, 
  Alert, Modal, ActivityIndicator 
} from "react-native";
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { materialListContext, MaterialList, MaterialListItem } from '../context/MaterialBudget';
import { materialService, Material } from '../context/MaterialsContext';

interface SelectedMaterial {
  id: string;
  name: string;
  price: number;
  unit: string;
  category?: string;
  icon: string;
  quantity: number;
  total: number;
  materialId?: string;
}

interface RouteParams {
  materialListId: string;
}

interface AddMaterialItemProps {
  material: Material;
  onAdd: (material: Material, quantity: number) => void;
  formatCurrency: (value: number) => string;
}

function AddMaterialItem({ material, onAdd, formatCurrency }: AddMaterialItemProps) {
  const [quantity, setQuantity] = useState('1');
  
  const handleAdd = () => {
    const qty = parseInt(quantity) || 1;
    onAdd(material, qty);
    setQuantity('1');
  };

  const materialPrice = typeof material.price === 'string' ? parseFloat(material.price) : material.price;
  const unitDisplay = material.unit === 'UNIT' ? 'unidade' : 'metro';

  return (
    <View className="bg-zinc-900/60 backdrop-blur-xl rounded-3xl p-6 border border-zinc-800/30">
      <View className="flex-row items-start justify-between mb-4">
        <View className="flex-1 pr-4">
          <View className="flex-row items-center gap-3 mb-3">
            <View className="w-12 h-12 bg-blue-600/20 rounded-2xl items-center justify-center">
              <Ionicons name="cube" size={20} color="#60A5FA" />
            </View>
            <View className="flex-1">
              <Text className="text-white font-inter-bold text-base mb-1">
                {material.name}
              </Text>
              <Text className="text-blue-400 font-inter-semibold text-sm">
                {formatCurrency(materialPrice)} / {unitDisplay}
              </Text>
              {material.category && (
                <View className="bg-blue-600/10 px-2 py-1 rounded-lg mt-2 self-start">
                  <Text className="text-blue-400 font-inter-medium text-xs">
                    {material.category}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </View>

      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-3">
          <Text className="text-gray-400 font-inter-medium text-sm">Quantidade:</Text>
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
            {formatCurrency(materialPrice * (parseInt(quantity) || 1))}
          </Text>
          <TouchableOpacity 
            onPress={handleAdd}
            className="active:scale-90"
          >
            <LinearGradient
              colors={['#10B981', '#059669']}
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

export function MaterialDetails() {
  const route = useRoute();
  const navigation = useNavigation();
  const { materialListId } = route.params as RouteParams;

  const [materialList, setMaterialList] = useState<MaterialList | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [availableMaterials, setAvailableMaterials] = useState<Material[]>([]);
  const [materialsLoading, setMaterialsLoading] = useState(true);

  const loadMaterialList = async () => {
    try {
      setLoading(true);
      
      const listData = await materialListContext.getMaterialListById(materialListId);
      
      setMaterialList(listData);
      setEditedName(listData.name);
      
    } catch (error) {
      Alert.alert("Erro", "Não foi possível carregar os detalhes da lista de materiais");
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableMaterials = async () => {
    try {
      setMaterialsLoading(true);
      
      const materials = await materialService.list();
      
      setAvailableMaterials(materials);
      
    } catch (error) {
      try {
        const cachedMaterials = await materialService.list();
        setAvailableMaterials(cachedMaterials);
      } catch (cacheError) {
        setAvailableMaterials([]);
      }
      
      Alert.alert("Erro", "Não foi possível carregar os materiais disponíveis");
    } finally {
      setMaterialsLoading(false);
    }
  };

  useEffect(() => {
    if (materialListId) {
      loadMaterialList();
      loadAvailableMaterials();
    }
  }, [materialListId]);

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  const formatDate = (dateString: string): string => {
    if (!dateString) return 'Data não informada';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('pt-BR');
    } catch {
      return 'Data inválida';
    }
  };

  const getStatusColor = (status: string | undefined) => {
    const statusLower = (status || 'PENDING').toLowerCase();
    switch (statusLower) {
      case 'approved': return 'text-green-400';
      case 'pending': return 'text-yellow-400';
      case 'rejected': return 'text-red-400';
      case 'expired': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusBgColor = (status: string | undefined) => {
    const statusLower = (status || 'PENDING').toLowerCase();
    switch (statusLower) {
      case 'approved': return 'bg-green-600/20 border-green-600/30';
      case 'pending': return 'bg-yellow-600/20 border-yellow-600/30';
      case 'rejected': return 'bg-red-600/20 border-red-600/30';
      case 'expired': return 'bg-red-600/20 border-red-600/30';
      default: return 'bg-gray-600/20 border-gray-600/30';
    }
  };

  const getStatusText = (status: string | undefined) => {
    const statusLower = (status || 'PENDING').toLowerCase();
    switch (statusLower) {
      case 'approved': return 'Aprovado';
      case 'pending': return 'Pendente';
      case 'rejected': return 'Rejeitado';
      case 'expired': return 'Expirado';
      default: return status || 'Pendente';
    }
  };

  const getSelectedMaterials = (): SelectedMaterial[] => {
    if (!materialList?.items || !Array.isArray(materialList.items)) {
      return [];
    }
    
    const validItems = materialList.items
      .filter(item => {
        const name = item.material?.name || item.name;
        const quantity = item.quantity;
        const unitPrice = item.unitPrice || item.material?.price;
        
        const hasValidData = name && (quantity !== undefined) && (unitPrice !== undefined);
        
        return hasValidData;
      })
      .map(item => {
        const name = item.material?.name || item.name || 'Material sem nome';
        const unitPrice = parseFloat(String(item.unitPrice || item.material?.price || 0));
        const quantity = item.quantity || 0;
        const unit = item.material?.unit || item.unit || 'UNIT';
        const materialId = item.materialId || item.material?.id;
        
        return {
          itemId: item.id,
          materialId,
          name,
          price: unitPrice,
          unit: unit === 'UNIT' ? 'unidade' : 'metro',
          category: item.material?.category || 'Material',
          icon: getMaterialIcon(name),
          quantity
        };
      });
    
    const groupedMap = new Map<string, SelectedMaterial>();
    
    validItems.forEach(item => {
      const key = item.materialId || item.itemId;
      
      if (!key) {
        return;
      }
      
      if (groupedMap.has(key)) {
        const existing = groupedMap.get(key)!;
        existing.quantity += item.quantity;
        existing.total = existing.quantity * existing.price;
      } else {
        groupedMap.set(key, {
          id: item.itemId!,
          materialId: item.materialId,
          name: item.name,
          price: item.price,
          unit: item.unit,
          category: item.category,
          icon: item.icon,
          quantity: item.quantity,
          total: item.quantity * item.price
        });
      }
    });
    
    const groupedMaterials = Array.from(groupedMap.values());
    
    return groupedMaterials;
  };

  const getMaterialIcon = (materialName: string | undefined): string => {
    const name = (materialName || '').toLowerCase();
    if (name.includes('cabo') || name.includes('fio')) return 'flash';
    if (name.includes('tubo') || name.includes('cano')) return 'infinite';
    if (name.includes('tijolo') || name.includes('bloco')) return 'square';
    if (name.includes('cimento') || name.includes('argamassa')) return 'layers';
    if (name.includes('tinta')) return 'color-palette';
    if (name.includes('madeira')) return 'leaf';
    return 'cube';
  };

  const categories = [
    { id: 'all', name: 'Todos', icon: 'apps' },
    { id: 'Elétrico', name: 'Elétrico', icon: 'flash' },
    { id: 'Hidráulico', name: 'Hidráulico', icon: 'water' },
    { id: 'Construção', name: 'Construção', icon: 'hammer' },
    { id: 'Acabamento', name: 'Acabamento', icon: 'color-palette' },
    { id: 'Ferragens', name: 'Ferragens', icon: 'construct' },
    { id: 'Madeira', name: 'Madeira', icon: 'leaf' }
  ];

  const filteredMaterials = availableMaterials.filter(material => {
    const materialName = material.name || '';
    const materialCategory = material.category || '';
    
    const matchesCategory = selectedCategory === 'all' || selectedCategory === 'Todos' || materialCategory === selectedCategory;
    const matchesSearch = materialName.toLowerCase().includes((searchTerm || '').toLowerCase());
    
    return matchesCategory && matchesSearch;
  });

  const updateQuantity = async (materialId: string, newQuantity: number) => {
    if (!materialList) return;

    if (newQuantity <= 0) {
      removeMaterial(materialId);
      return;
    }

    try {
      const itemsToUpdate = materialList.items?.filter(item => 
        (item.materialId || item.material?.id) === materialId
      ) || [];
      
      if (itemsToUpdate.length === 0) {
        return;
      }
      
      if (itemsToUpdate.length === 1) {
        await materialListContext.updateMaterialListItem(materialListId, itemsToUpdate[0].id!, { quantity: newQuantity });
      } else {
        await materialListContext.updateMaterialListItem(materialListId, itemsToUpdate[0].id!, { quantity: newQuantity });
        
        for (let i = 1; i < itemsToUpdate.length; i++) {
          await materialListContext.removeMaterialListItem(materialListId, itemsToUpdate[i].id!);
        }
      }
      
      if (materialList.status !== 'PENDING') {
        await materialListContext.updateMaterialListStatus(materialListId, 'PENDING');
      }
      
      await loadMaterialList();
      
    } catch (error) {
      Alert.alert("Erro", "Não foi possível atualizar a quantidade");
    }
  };

  const removeMaterial = async (materialId: string) => {
    if (!materialList) return;

    Alert.alert(
      "Confirmar exclusão",
      "Deseja realmente remover este material da lista?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Remover",
          style: "destructive",
          onPress: async () => {
            try {
              const itemsToRemove = materialList.items?.filter(item => 
                (item.materialId || item.material?.id) === materialId
              ) || [];
              
              for (const item of itemsToRemove) {
                await materialListContext.removeMaterialListItem(materialListId, item.id!);
              }
              
              if (materialList.status !== 'PENDING') {
                await materialListContext.updateMaterialListStatus(materialListId, 'PENDING');
              }
              
              setTimeout(async () => {
                await loadMaterialList();
                Alert.alert("Sucesso", "Material removido da lista!");
              }, 500);
              
            } catch (error) {
              Alert.alert("Erro", "Não foi possível remover o material");
            }
          }
        }
      ]
    );
  };

  const addMaterial = async (material: Material, quantity: number) => {
    if (!materialList) return;

    try {
      const materialPrice = typeof material.price === 'string' ? parseFloat(material.price) : material.price;
      
      const itemData = {
        materialId: material.id,
        name: material.name,
        description: `Material: ${material.category || 'Sem categoria'}`,
        quantity: quantity,
        unitPrice: materialPrice,
        unit: material.unit
      };

      await materialListContext.addMaterialListItem(materialListId, itemData);
      
      if (materialList.status !== 'PENDING') {
        await materialListContext.updateMaterialListStatus(materialListId, 'PENDING');
      }
      
      setTimeout(async () => {
        await loadMaterialList();
        await loadAvailableMaterials();
        setShowAddModal(false);
        Alert.alert("Sucesso", "Material adicionado à lista!");
      }, 800);
      
    } catch (error) {
      Alert.alert("Erro", "Não foi possível adicionar o material");
    }
  };

  const saveChanges = async () => {
    if (!materialList) return;

    try {
      await materialListContext.updateMaterialList(materialListId, { name: editedName });
      setMaterialList({ ...materialList, name: editedName });
      setIsEditMode(false);
      Alert.alert("Sucesso", "Alterações salvas com sucesso!");
    } catch (error) {
      Alert.alert("Erro", "Não foi possível salvar as alterações");
    }
  };

  const cancelEdit = () => {
    setEditedName(materialList?.name || '');
    setIsEditMode(false);
  };

  const selectedMaterials = getSelectedMaterials();
  const calculatedTotal = selectedMaterials.reduce((sum, material) => sum + material.total, 0);
  const backendTotal = materialList?.totalValue ? parseFloat(String(materialList.totalValue)) : 0;
  const totalAmount = backendTotal > 0 ? backendTotal : calculatedTotal;

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-neutral-900">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text className="text-white mt-4">Carregando lista de materiais...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!materialList) {
    return (
      <SafeAreaView className="flex-1 bg-neutral-900">
        <View className="flex-1 items-center justify-center p-6">
          <Ionicons name="document-text-outline" size={60} color="#6B7280" />
          <Text className="text-white text-xl font-inter-black mt-4 text-center">
            Lista de materiais não encontrada
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
          
          <Text className="text-white font-inter-black text-sm">DETALHES DA LISTA DE MATERIAIS</Text>

          <TouchableOpacity 
            onPress={() => setIsEditMode(!isEditMode)}
            className={`w-14 h-14 rounded-3xl items-center justify-center border ${
              isEditMode 
                ? 'bg-orange-600/20 border-orange-600/30' 
                : 'bg-zinc-800/50 border-zinc-700/40'
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
                    {materialList.name}
                  </Text>
                )}
                
                <View className="flex-row items-center gap-4 mt-3">
                  <View className="flex-row items-center gap-2">
                    <Ionicons name="calendar" size={16} color="#9CA3AF" />
                    <Text className="text-gray-400 font-inter-medium text-sm">
                      {formatDate(materialList.createdAt || '')}
                    </Text>
                  </View>
                  
                  <View className={`px-3 py-1 rounded-xl border ${getStatusBgColor(materialList.status)}`}>
                    <Text className={`font-inter-bold text-xs ${getStatusColor(materialList.status)}`}>
                      {getStatusText(materialList.status)}
                    </Text>
                  </View>
                </View>
              </View>

              <View className="items-end">
                <Text className="text-gray-400 font-inter-medium text-sm mb-1">Total</Text>
                <Text className="text-green-400 font-inter-black text-2xl">
                  {formatCurrency(totalAmount)}
                </Text>
              </View>
            </View>

            <View className="flex-row items-center justify-between pt-4 border-t border-zinc-800/30">
              <View className="flex-row items-center gap-2">
                <View className="w-2 h-2 bg-blue-400 rounded-full" />
                <Text className="text-gray-400 font-inter-medium text-sm">
                  {selectedMaterials.length} {selectedMaterials.length === 1 ? 'material' : 'materiais'}
                </Text>
              </View>

              {isEditMode && (
                <View className="flex-row gap-3">
                  <TouchableOpacity 
                    onPress={cancelEdit}
                    className="bg-red-600/20 px-4 py-2 rounded-xl border border-red-600/30"
                  >
                    <Text className="text-red-400 font-inter-bold text-sm">Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    onPress={saveChanges}
                    className="bg-green-600/20 px-4 py-2 rounded-xl border border-green-600/30"
                  >
                    <Text className="text-green-400 font-inter-bold text-sm">Salvar</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </View>

        <View className="mx-6 mb-8">
          <View className="flex-row items-center justify-between mb-6">
            <Text className="text-white font-inter-black text-lg">
              Materiais da Lista
            </Text>
            <TouchableOpacity 
              onPress={() => setShowAddModal(true)}
              className="bg-blue-600/20 px-4 py-2 rounded-xl border border-blue-600/30 flex-row items-center gap-2"
            >
              <Ionicons name="add" size={16} color="#60A5FA" />
              <Text className="text-blue-400 font-inter-bold text-sm">Adicionar</Text>
            </TouchableOpacity>
          </View>
          
          <View className="gap-4">
            {selectedMaterials.length === 0 ? (
              <View className="bg-zinc-900/60 backdrop-blur-xl rounded-3xl p-8 items-center border border-zinc-800/30">
                <Ionicons name="cube-outline" size={40} color="#6B7280" />
                <Text className="text-white font-inter-black text-lg mt-4 text-center">
                  Nenhum material adicionado
                </Text>
                <Text className="text-gray-400 font-inter-medium text-sm mt-2 text-center">
                  Adicione materiais para compor esta lista
                </Text>
              </View>
            ) : (
              selectedMaterials.map((material) => (
                <View key={material.materialId || material.id} className="bg-zinc-900/60 backdrop-blur-xl rounded-3xl p-6 border border-zinc-800/30">
                  <View className="flex-row items-start justify-between mb-4">
                    <View className="flex-1 pr-4">
                      <View className="flex-row items-center gap-3 mb-3">
                        <View className="w-12 h-12 bg-green-600/20 rounded-2xl items-center justify-center">
                          <Ionicons name={material.icon as any} size={20} color="#10B981" />
                        </View>
                        <View className="flex-1">
                          <Text className="text-white font-inter-bold text-base mb-1">
                            {material.name}
                          </Text>
                          <Text className="text-green-400 font-inter-semibold text-sm">
                            {formatCurrency(material.price)} / {material.unit}
                          </Text>
                        </View>
                      </View>
                    </View>
                    {isEditMode && (
                      <TouchableOpacity 
                        onPress={() => removeMaterial(material.materialId || material.id)}
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
                          onPress={() => updateQuantity(material.materialId || material.id, material.quantity - 1)}
                          className="w-10 h-10 bg-zinc-800/50 rounded-xl items-center justify-center border border-zinc-700/40"
                        >
                          <Ionicons name="remove" size={18} color="#9CA3AF" />
                        </TouchableOpacity>
                      )}

                      <View className="bg-zinc-800/40 rounded-xl px-4 py-3 border border-zinc-700/30 min-w-[70px] items-center">
                        <Text className="text-white font-inter-black text-lg">{material.quantity}</Text>
                        <Text className="text-gray-400 font-inter-medium text-xs">{material.unit}(s)</Text>
                      </View>

                      {isEditMode && (
                        <TouchableOpacity 
                          onPress={() => updateQuantity(material.materialId || material.id, material.quantity + 1)}
                          className="w-10 h-10 bg-zinc-800/50 rounded-xl items-center justify-center border border-zinc-700/40"
                        >
                          <Ionicons name="add" size={18} color="#9CA3AF" />
                        </TouchableOpacity>
                      )}
                    </View>

                    <Text className="text-green-400 font-inter-black text-xl">
                      {formatCurrency(material.total)}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>
        </View>

        <View className="h-32"/>
      </ScrollView>

      <Modal
        visible={showAddModal}
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <SafeAreaView className="flex-1 bg-neutral-900">
          <View className="px-6 py-4 border-b border-zinc-800/30">
            <View className="flex-row items-center justify-between">
              <Text className="text-white font-inter-black text-lg">Adicionar Material</Text>
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
                  placeholder="Pesquisar materiais..."
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
                        colors={['#3B82F6', '#1E40AF']}
                        className="flex-row items-center gap-3 px-5 py-3 rounded-2xl"
                        style={{ borderRadius: 12 }}
                      >
                        <Ionicons name={category.icon as any} size={18} color="white" />
                        <Text className="text-white font-inter-bold text-sm">{category.name}</Text>
                      </LinearGradient>
                    ) : (
                      <View className="flex-row items-center gap-3 px-5 py-3 rounded-2xl bg-zinc-800/40 border border-zinc-700/30">
                        <Ionicons name={category.icon as any} size={18} color="#9CA3AF" />
                        <Text className="text-gray-400 font-inter-medium text-sm">{category.name}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          <ScrollView className="flex-1 px-6">
            {materialsLoading ? (
              <View className="items-center justify-center py-8">
                <ActivityIndicator size="large" color="#3B82F6" />
                <Text className="text-white mt-4">Carregando materiais...</Text>
              </View>
            ) : (
              <View className="gap-4">
                {filteredMaterials.length === 0 && !materialsLoading && (
                  <View className="bg-zinc-900/60 backdrop-blur-xl rounded-3xl p-8 items-center border border-zinc-800/30">
                    <View className="w-16 h-16 bg-zinc-800/50 rounded-3xl items-center justify-center mb-4">
                      <Ionicons name="search" size={32} color="#6B7280" />
                    </View>
                    <Text className="text-white font-inter-black text-xl mb-2">Nenhum material encontrado</Text>
                    <Text className="text-gray-400 font-inter-medium text-sm text-center">
                      {availableMaterials.length === 0 
                        ? "Nenhum material cadastrado. Cadastre materiais primeiro."
                        : "Nenhum material corresponde aos filtros aplicados"}
                    </Text>
                  </View>
                )}
                
                {filteredMaterials.map((material) => (
                  <AddMaterialItem 
                    key={material.id} 
                    material={material} 
                    onAdd={addMaterial}
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