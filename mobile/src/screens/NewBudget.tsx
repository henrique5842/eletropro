import { useState, useEffect } from 'react';
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
  Platform
} from "react-native";
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import { servicesContext, Service, ServiceUnit } from '../context/ServicesContext';

export function NewService() {
  const navigation = useNavigation();

  const [availableServices, setAvailableServices] = useState<Service[]>([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [servicesError, setServicesError] = useState<string | null>(null);
  const [serviceCategories, setServiceCategories] = useState<string[]>([]);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    price: '',
    unit: 'UNIT' as ServiceUnit,
    description: ''
  });

  const loadServices = async () => {
    try {
      setServicesLoading(true);
      setServicesError(null);
      
      const [servicesData, categoriesData] = await Promise.all([
        servicesContext.getServices(),
        servicesContext.getServiceCategories()
      ]);
      
      setAvailableServices(servicesData);
      setServiceCategories(['Todos', ...categoriesData]);
      
    } catch (error) {
      setServicesError(error instanceof Error ? error.message : 'Erro desconhecido');
      
      setServiceCategories([
        'Todos',
        'Instalação Elétrica',
        'Manutenção',
        'Projeto Elétrico',
        'Automação',
        'Iluminação',
        'SPDA',
        'Energia Solar',
        'Outros'
      ]);
    } finally {
      setServicesLoading(false);
    }
  };

  useEffect(() => {
    loadServices();
  }, []);

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getUnitDisplay = (unit: ServiceUnit): string => {
    const unitMap: { [key in ServiceUnit]: string } = {
      'UNIT': 'unidade',
      'METER': 'm²'
    };
    return unitMap[unit] || unit.toLowerCase();
  };

  const getCategoryIcon = (category?: string): string => {
    const iconMap: { [key: string]: string } = {
      'Instalação Elétrica': 'flash',
      'Manutenção': 'construct',
      'Projeto Elétrico': 'document-text',
      'Automação': 'settings',
      'Iluminação': 'bulb',
      'SPDA': 'shield',
      'Energia Solar': 'sunny',
      'Outros': 'build'
    };
    return iconMap[category || ''] || 'build';
  };

  const filteredServices = availableServices.filter(service => {
    const matchesCategory = selectedCategory === 'all' || selectedCategory === 'Todos' || service.category === selectedCategory;
    const matchesSearch = service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (service.description && service.description.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const openCreateModal = () => {
    setFormData({
      name: '',
      category: '',
      price: '',
      unit: 'UNIT',
      description: ''
    });
    setEditingService(null);
    setShowCreateModal(true);
  };

  const openEditModal = (service: Service) => {
    setFormData({
      name: service.name,
      category: service.category || '',
      price: service.price.toString(),
      unit: service.unit,
      description: service.description || ''
    });
    setEditingService(service);
    setShowCreateModal(true);
  };

  const closeModal = () => {
    setShowCreateModal(false);
    setEditingService(null);
    setFormData({
      name: '',
      category: '',
      price: '',
      unit: 'UNIT',
      description: ''
    });
  };

  const saveService = async () => {
    const validation = servicesContext.validateService({
      name: formData.name.trim(),
      price: parseFloat(formData.price) || 0,
      unit: formData.unit,
      category: formData.category.trim() || undefined,
      description: formData.description.trim() || undefined
    });

    if (!validation.isValid) {
      Alert.alert("Atenção", validation.error);
      return;
    }

    try {
      setIsSubmitting(true);

      const serviceData = {
        name: formData.name.trim(),
        price: parseFloat(formData.price),
        unit: formData.unit,
        category: formData.category.trim() || undefined,
        description: formData.description.trim() || undefined
      };

      if (editingService) {
        await servicesContext.updateService(editingService.id, serviceData);
        Alert.alert("Sucesso", "Serviço atualizado com sucesso!");
      } else {
        await servicesContext.createService(serviceData);
        Alert.alert("Sucesso", "Serviço criado com sucesso!");
      }

      await loadServices();
      closeModal();

    } catch (error) {
      Alert.alert("Erro", 
        error instanceof Error ? error.message : "Erro ao salvar serviço"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteService = (service: Service) => {
    Alert.alert(
      "Confirmar exclusão",
      `Deseja realmente excluir o serviço "${service.name}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Excluir", 
          style: "destructive",
          onPress: async () => {
            try {
              await servicesContext.deleteService(service.id);
              Alert.alert("Sucesso", "Serviço excluído com sucesso!");
              await loadServices();
            } catch (error) {
              Alert.alert("Erro", "Erro ao excluir serviço");
            }
          }
        }
      ]
    );
  };

  const retryLoadServices = () => {
    loadServices();
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
          
          <Text className="text-white font-inter-black text-sm">SERVIÇOS</Text>

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
                <Text className="text-gray-400 font-inter-medium text-sm mb-1">Total de Serviços</Text>
                <Text className="text-white font-inter-black text-2xl">
                  {servicesLoading ? '...' : availableServices.length}
                </Text>
              </View>
              
              <View className="flex-1 items-center">
                <Text className="text-gray-400 font-inter-medium text-sm mb-1">Categorias</Text>
                <Text className="text-blue-400 font-inter-black text-2xl">
                  {serviceCategories.length > 1 ? serviceCategories.length - 1 : 0}
                </Text>
              </View>
              
              <View className="flex-1 items-end">
                <Text className="text-gray-400 font-inter-medium text-sm mb-1">Filtrados</Text>
                <Text className="text-green-400 font-inter-black text-2xl">
                  {filteredServices.length}
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
                placeholder="Pesquisar serviços..."
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
              {serviceCategories.map((category, index) => (
                <TouchableOpacity 
                  key={index}
                  onPress={() => setSelectedCategory(category === 'Todos' ? 'all' : category)}
                  className="active:scale-95"
                >
                  {(selectedCategory === category || (selectedCategory === 'all' && category === 'Todos')) ? (
                    <LinearGradient
                      colors={['#10B981', '#059669']}
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

        <View className="mx-6 mb-8">
          <View className="flex-row items-center justify-between mb-6">
            <Text className="text-white font-inter-black text-lg">
              Serviços Disponíveis
            </Text>
            <TouchableOpacity
              onPress={retryLoadServices}
              className="bg-blue-600/20 px-4 py-2 rounded-xl border border-blue-600/30"
            >
              <Text className="text-blue-400 font-inter-bold text-sm">
                Atualizar
              </Text>
            </TouchableOpacity>
          </View>
          
          {servicesLoading ? (
            <View className="bg-zinc-900/60 backdrop-blur-xl rounded-3xl p-8 items-center border border-zinc-800/30">
              <ActivityIndicator size="large" color="#10B981" />
              <Text className="text-white font-inter-black text-xl mt-4 mb-2">Carregando serviços...</Text>
              <Text className="text-gray-400 font-inter-medium text-sm text-center">
                Buscando serviços disponíveis na API
              </Text>
            </View>
          ) : servicesError ? (
            <View className="bg-zinc-900/60 backdrop-blur-xl rounded-3xl p-8 items-center border border-zinc-800/30">
              <View className="w-16 h-16 bg-red-600/20 rounded-3xl items-center justify-center mb-4">
                <Ionicons name="alert-circle" size={32} color="#EF4444" />
              </View>
              <Text className="text-white font-inter-black text-xl mb-2">Erro ao carregar serviços</Text>
              <Text className="text-gray-400 font-inter-medium text-sm text-center mb-4">
                {servicesError}
              </Text>
              <TouchableOpacity
                onPress={retryLoadServices}
                className="bg-blue-500 px-6 py-3 rounded-xl"
              >
                <Text className="text-white font-inter-bold text-sm">Tentar novamente</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View className="gap-4">
              {filteredServices.map((service) => (
                <ServiceItem 
                  key={service.id} 
                  service={service} 
                  onEdit={openEditModal}
                  onDelete={deleteService}
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
                  <Text className="text-white font-inter-black text-xl mb-2">Nenhum serviço encontrado</Text>
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

      {showCreateModal && (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="absolute inset-0"
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <TouchableOpacity 
            activeOpacity={1} 
            onPress={closeModal}
            className="flex-1 bg-black/50 justify-end"
          >
            <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
              <View className="bg-zinc-900 rounded-t-3xl border-t border-zinc-800">
                <View className="p-6">
                  <View className="flex-row items-center justify-between mb-6">
                    <Text className="text-white font-inter-black text-lg">
                      {editingService ? 'Editar Serviço' : 'Novo Serviço'}
                    </Text>
                    <TouchableOpacity onPress={closeModal}>
                      <Ionicons name="close" size={24} color="#9CA3AF" />
                    </TouchableOpacity>
                  </View>

                  <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 500 }}>
                    <View className="mb-4">
                      <Text className="text-gray-400 font-inter-medium text-sm mb-2">Nome do Serviço</Text>
                      <TextInput
                        value={formData.name}
                        onChangeText={(text) => setFormData({...formData, name: text})}
                        placeholder="Ex: Instalação de tomada"
                        placeholderTextColor="#6B7280"
                        className="text-white font-inter-medium text-base bg-zinc-800/40 rounded-xl px-4 py-3 border border-zinc-700/40"
                      />
                    </View>

                    <View className="mb-4">
                      <Text className="text-gray-400 font-inter-medium text-sm mb-2">Categoria</Text>
                      <TextInput
                        value={formData.category}
                        onChangeText={(text) => setFormData({...formData, category: text})}
                        placeholder="Ex: Instalação Elétrica"
                        placeholderTextColor="#6B7280"
                        className="text-white font-inter-medium text-base bg-zinc-800/40 rounded-xl px-4 py-3 border border-zinc-700/40"
                      />
                    </View>

                    <View className="flex-row gap-4 mb-4">
                      <View className="flex-1">
                        <Text className="text-gray-400 font-inter-medium text-sm mb-2">Preço</Text>
                        <TextInput
                          value={formData.price}
                          onChangeText={(text) => setFormData({...formData, price: text})}
                          placeholder="0,00"
                          placeholderTextColor="#6B7280"
                          keyboardType="numeric"
                          className="text-white font-inter-medium text-base bg-zinc-800/40 rounded-xl px-4 py-3 border border-zinc-700/40"
                        />
                      </View>
                      
                      <View className="flex-1">
                        <Text className="text-gray-400 font-inter-medium text-sm mb-2">Unidade</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                          <View className="flex-row gap-2">
                            {(['UNIT', 'METER'] as ServiceUnit[]).map((unit) => (
                              <TouchableOpacity
                                key={unit}
                                onPress={() => setFormData({...formData, unit})}
                                className={`px-4 py-3 rounded-xl border ${
                                  formData.unit === unit
                                    ? 'bg-green-600/20 border-green-600/30'
                                    : 'bg-zinc-800/40 border-zinc-700/40'
                                }`}
                              >
                                <Text className={`font-inter-medium text-sm ${
                                  formData.unit === unit ? 'text-green-400' : 'text-gray-400'
                                }`}>
                                  {getUnitDisplay(unit)}
                                </Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                        </ScrollView>
                      </View>
                    </View>

                    <View className="mb-6">
                      <Text className="text-gray-400 font-inter-medium text-sm mb-2">Descrição (opcional)</Text>
                      <TextInput
                        value={formData.description}
                        onChangeText={(text) => setFormData({...formData, description: text})}
                        placeholder="Detalhes do serviço, o que está incluso..."
                        placeholderTextColor="#6B7280"
                        multiline
                        numberOfLines={3}
                        className="text-white font-inter-medium text-base bg-zinc-800/40 rounded-xl px-4 py-3 border border-zinc-700/40"
                        textAlignVertical="top"
                      />
                    </View>

                    <View className="flex-row gap-4">
                      <TouchableOpacity
                        onPress={closeModal}
                        className="flex-1 bg-zinc-800/50 rounded-xl py-4 items-center border border-zinc-700/40"
                      >
                        <Text className="text-gray-400 font-inter-bold text-base">Cancelar</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        onPress={saveService}
                        disabled={isSubmitting}
                        className="flex-1 bg-green-600 rounded-xl py-4 items-center"
                      >
                        {isSubmitting ? (
                          <ActivityIndicator size="small" color="white" />
                        ) : (
                          <Text className="text-white font-inter-bold text-base">
                            {editingService ? 'Salvar' : 'Criar'}
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

interface ServiceItemProps {
  service: Service;
  onEdit: (service: Service) => void;
  onDelete: (service: Service) => void;
  formatCurrency: (value: number) => string;
  getUnitDisplay: (unit: ServiceUnit) => string;
  getCategoryIcon: (category?: string) => string;
}

function ServiceItem({ 
  service, 
  onEdit, 
  onDelete, 
  formatCurrency, 
  getUnitDisplay, 
  getCategoryIcon 
}: ServiceItemProps) {
  return (
    <View className="bg-zinc-900/60 backdrop-blur-xl rounded-3xl p-6 border border-zinc-800/30">
      <View className="flex-row items-start justify-between mb-4">
        <View className="flex-1 pr-4">
          <View className="flex-row items-center gap-3 mb-3">
            <View className="w-12 h-12 bg-blue-600/20 rounded-2xl items-center justify-center">
              <Ionicons name={getCategoryIcon(service.category) as any} size={20} color="#3B82F6" />
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
        
        <View className="flex-row gap-2">
          <TouchableOpacity 
            onPress={() => onEdit(service)}
            className="w-10 h-10 bg-blue-600/20 rounded-xl items-center justify-center border border-blue-600/30"
          >
            <Ionicons name="create" size={18} color="#3B82F6" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            onPress={() => onDelete(service)}
            className="w-10 h-10 bg-red-600/20 rounded-xl items-center justify-center border border-red-600/30"
          >
            <Ionicons name="trash" size={18} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}