import React, { useState } from 'react';
import { SafeAreaView, View, TouchableOpacity, Text, ScrollView, TextInput, Alert, Modal } from "react-native";
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

interface Service {
  id: number;
  name: string;
  price: number;
  unit: string;
  category: string;
  icon: string;
}

interface SelectedService extends Service {
  quantity: number;
  total: number;
}

interface ProjectPhase {
  id: number;
  name: string;
  description: string;
  services: number[];
  estimatedDays: number;
  status: 'pending' | 'in_progress' | 'completed';
  startDate?: string;
  endDate?: string;
  notes?: string;
  completedServices: number[];
}

interface Project {
  id: number;
  name: string;
  client: string;
  phone: string;
  address: string;
  description: string;
  services: SelectedService[];
  phases: ProjectPhase[];
  totalAmount: number;
  startDate: string;
  status: 'planning' | 'in_progress' | 'completed' | 'paused';
  progress: number;
}

export function ProjectManagement() {
  const [project, setProject] = useState<Project>({
    id: 1,
    name: "Reforma Elétrica Completa",
    client: "João Silva",
    phone: "(11) 99999-9999",
    address: "Rua das Flores, 123 - São Paulo, SP",
    description: "Reforma completa da instalação elétrica residencial",
    services: [
      {
        id: 1,
        name: "Instalar tomada dupla",
        price: 10.00,
        unit: "unidade",
        category: "tomadas",
        icon: "power",
        quantity: 15,
        total: 150.00
      },
      {
        id: 7,
        name: "Instalar quadro elétrico",
        price: 150.00,
        unit: "unidade",
        category: "instalacao",
        icon: "grid",
        quantity: 1,
        total: 150.00
      },
      {
        id: 4,
        name: "Passar fio 2,5mm²",
        price: 5.00,
        unit: "metro",
        category: "fiacao",
        icon: "flash",
        quantity: 50,
        total: 250.00
      }
    ],
    phases: [
      {
        id: 1,
        name: "Planejamento e Projeto",
        description: "Levantamento, medições e elaboração do projeto elétrico",
        services: [11],
        estimatedDays: 3,
        status: 'completed',
        startDate: "05/01/2024",
        endDate: "08/01/2024",
        notes: "Projeto aprovado pelo cliente",
        completedServices: [11]
      },
      {
        id: 2,
        name: "Preparação da Infraestrutura",
        description: "Furação de paredes e instalação de eletrodutos",
        services: [8, 9],
        estimatedDays: 5,
        status: 'completed',
        startDate: "09/01/2024",
        endDate: "14/01/2024",
        notes: "Infraestrutura concluída conforme projeto",
        completedServices: [8, 9]
      },
      {
        id: 3,
        name: "Instalação Elétrica",
        description: "Passagem de fiação e instalação do quadro elétrico",
        services: [4, 5, 7],
        estimatedDays: 7,
        status: 'in_progress',
        startDate: "15/01/2024",
        notes: "Quadro instalado, iniciando passagem dos fios",
        completedServices: [7]
      },
      {
        id: 4,
        name: "Instalação de Componentes",
        description: "Instalação de tomadas, interruptores e proteções",
        services: [1, 2, 3, 6],
        estimatedDays: 4,
        status: 'pending',
        completedServices: []
      }
    ],
    totalAmount: 550.00,
    startDate: "05/01/2024",
    status: 'in_progress',
    progress: 75
  });

  const [isEditMode, setIsEditMode] = useState(false);
  const [showAddServiceModal, setShowAddServiceModal] = useState(false);
  const [showPhaseModal, setShowPhaseModal] = useState(false);
  const [selectedPhase, setSelectedPhase] = useState<ProjectPhase | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const availableServices: Service[] = [
    { id: 1, name: "Instalar tomada dupla", price: 10.00, unit: "unidade", category: "tomadas", icon: "power" },
    { id: 2, name: "Instalar interruptor simples", price: 15.00, unit: "unidade", category: "interruptores", icon: "toggle" },
    { id: 3, name: "Instalar interruptor duplo", price: 20.00, unit: "unidade", category: "interruptores", icon: "toggle" },
    { id: 4, name: "Passar fio 2,5mm²", price: 5.00, unit: "metro", category: "fiacao", icon: "flash" },
    { id: 5, name: "Passar fio 4,0mm²", price: 7.50, unit: "metro", category: "fiacao", icon: "flash" },
    { id: 6, name: "Instalar disjuntor 20A", price: 35.00, unit: "unidade", category: "protecao", icon: "shield-checkmark" },
    { id: 7, name: "Instalar quadro elétrico", price: 150.00, unit: "unidade", category: "instalacao", icon: "grid" },
    { id: 8, name: "Furar parede para eletroduto", price: 8.00, unit: "metro", category: "instalacao", icon: "construct" },
    { id: 9, name: "Instalar eletroduto 3/4\"", price: 12.00, unit: "metro", category: "instalacao", icon: "infinite" },
    { id: 10, name: "Instalar luminária LED", price: 45.00, unit: "unidade", category: "iluminacao", icon: "bulb" },
    { id: 11, name: "Teste de continuidade", price: 10.00, unit: "ponto", category: "manutencao", icon: "checkmark-circle" },
    { id: 12, name: "Aterramento", price: 80.00, unit: "ponto", category: "protecao", icon: "arrow-down" }
  ];

  const categories = [
    { id: 'all', name: 'Todos', icon: 'apps' },
    { id: 'tomadas', name: 'Tomadas', icon: 'power' },
    { id: 'interruptores', name: 'Interruptores', icon: 'toggle' },
    { id: 'fiacao', name: 'Fiação', icon: 'flash' },
    { id: 'iluminacao', name: 'Iluminação', icon: 'bulb' },
    { id: 'protecao', name: 'Proteção', icon: 'shield-checkmark' },
    { id: 'instalacao', name: 'Instalação', icon: 'construct' },
    { id: 'manutencao', name: 'Manutenção', icon: 'build' }
  ];

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-400';
      case 'in_progress': return 'text-blue-400';
      case 'pending': return 'text-yellow-400';
      case 'paused': return 'text-orange-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-600/20 border-green-600/30';
      case 'in_progress': return 'bg-blue-600/20 border-blue-600/30';
      case 'pending': return 'bg-yellow-600/20 border-yellow-600/30';
      case 'paused': return 'bg-orange-600/20 border-orange-600/30';
      default: return 'bg-gray-600/20 border-gray-600/30';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Concluída';
      case 'in_progress': return 'Em Andamento';
      case 'pending': return 'Pendente';
      case 'paused': return 'Pausada';
      default: return 'Desconhecido';
    }
  };

  const filteredServices = availableServices.filter(service => {
    const matchesCategory = selectedCategory === 'all' || service.category === selectedCategory;
    const matchesSearch = service.name.toLowerCase().includes(searchTerm.toLowerCase());
    const notInProject = !project.services.some(s => s.id === service.id);
    return matchesCategory && matchesSearch && notInProject;
  });

  const updatePhaseStatus = (phaseId: number, newStatus: 'pending' | 'in_progress' | 'completed') => {
    const updatedPhases = project.phases.map(phase => 
      phase.id === phaseId 
        ? { 
            ...phase, 
            status: newStatus,
            endDate: newStatus === 'completed' ? new Date().toLocaleDateString('pt-BR') : undefined
          }
        : phase
    );
    
    const completedPhases = updatedPhases.filter(p => p.status === 'completed').length;
    const newProgress = Math.round((completedPhases / updatedPhases.length) * 100);
    
    setProject({
      ...project,
      phases: updatedPhases,
      progress: newProgress,
      status: newProgress === 100 ? 'completed' : 'in_progress'
    });
  };

  const addService = (service: Service, quantity: number) => {
    const newService: SelectedService = {
      ...service,
      quantity: quantity,
      total: service.price * quantity
    };
    
    const updatedServices = [...project.services, newService];
    const newTotal = updatedServices.reduce((sum, s) => sum + s.total, 0);
    
    setProject({
      ...project,
      services: updatedServices,
      totalAmount: newTotal
    });
  };

  const updatePhaseNotes = (phaseId: number, notes: string) => {
    const updatedPhases = project.phases.map(phase => 
      phase.id === phaseId ? { ...phase, notes } : phase
    );
    
    setProject({
      ...project,
      phases: updatedPhases
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-neutral-900">
      <View className="px-6 mt-16 mb-8">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity className="w-14 h-14 bg-zinc-800/50 rounded-3xl items-center justify-center border border-zinc-700/40">
            <Ionicons name="chevron-back" size={24} color="#60A5FA" />
          </TouchableOpacity>
          
          <Text className="text-white font-inter-black text-sm">GERENCIAR PROJETO</Text>

          <TouchableOpacity 
            onPress={() => setIsEditMode(!isEditMode)}
            className={`w-14 h-14 rounded-3xl items-center justify-center border ${
              isEditMode 
                ? 'bg-orange-600/20 border-orange-600/30' 
                : 'bg-zinc-800/50 border-zinc-700/40'
            }`}
          >
            <Ionicons 
              name={isEditMode ? "close" : "settings"} 
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
                <View className="flex-row items-center gap-3 mb-3">
                  <View className="w-14 h-14 bg-purple-600/20 rounded-2xl items-center justify-center">
                    <Ionicons name="folder-open" size={28} color="#A855F7" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-white font-inter-bold text-xl mb-1">
                      {project.name}
                    </Text>
                    <Text className="text-gray-400 font-inter-medium text-sm">
                      Cliente: {project.client}
                    </Text>
                  </View>
                </View>
                
                <View className="flex-row items-center gap-4 mb-4">
                  <View className="flex-row items-center gap-2">
                    <Ionicons name="calendar" size={16} color="#9CA3AF" />
                    <Text className="text-gray-400 font-inter-medium text-sm">
                      Início: {project.startDate}
                    </Text>
                  </View>
                  
                  <View className={`px-3 py-1 rounded-xl border ${getStatusBgColor(project.status)}`}>
                    <Text className={`font-inter-bold text-xs ${getStatusColor(project.status)}`}>
                      {getStatusText(project.status)}
                    </Text>
                  </View>
                </View>

                <View className="mb-4">
                  <View className="flex-row items-center justify-between mb-2">
                    <Text className="text-gray-400 font-inter-medium text-sm">Progresso Geral</Text>
                    <Text className="text-white font-inter-bold text-sm">{project.progress}%</Text>
                  </View>
                  <View className="bg-zinc-800/50 rounded-full h-2">
                    <LinearGradient
                      colors={['#A855F7', '#7C3AED']}
                      className="h-2 rounded-full"
                      style={{ width: `${project.progress}%` }}
                    />
                  </View>
                </View>
              </View>

              <View className="items-end">
                <Text className="text-gray-400 font-inter-medium text-sm mb-1">Valor Total</Text>
                <Text className="text-green-400 font-inter-black text-2xl">
                  {formatCurrency(project.totalAmount)}
                </Text>
              </View>
            </View>

            <View className="flex-row items-center justify-between pt-4 border-t border-zinc-800/30">
              <View className="flex-row items-center gap-4">
                <View className="flex-row items-center gap-2">
                  <View className="w-2 h-2 bg-green-400 rounded-full" />
                  <Text className="text-gray-400 font-inter-medium text-sm">
                    {project.services.length} serviços
                  </Text>
                </View>
                <View className="flex-row items-center gap-2">
                  <View className="w-2 h-2 bg-purple-400 rounded-full" />
                  <Text className="text-gray-400 font-inter-medium text-sm">
                    {project.phases.length} fases
                  </Text>
                </View>
              </View>

              <TouchableOpacity 
                onPress={() => setShowAddServiceModal(true)}
                className="bg-blue-600/20 px-4 py-2 rounded-xl border border-blue-600/30 flex-row items-center gap-2"
              >
                <Ionicons name="add" size={16} color="#60A5FA" />
                <Text className="text-blue-400 font-inter-bold text-sm">Adicionar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View className="mx-6 mb-8">
          <View className="flex-row items-center justify-between mb-6">
            <Text className="text-white font-inter-black text-lg">
              Fases do Projeto
            </Text>
            <View className="bg-purple-600/20 px-4 py-2 rounded-xl border border-purple-600/30">
              <Text className="text-purple-400 font-inter-bold text-sm">
                {project.phases.filter(p => p.status === 'completed').length}/{project.phases.length}
              </Text>
            </View>
          </View>
          
          <View className="gap-4">
            {project.phases.map((phase, index) => (
              <TouchableOpacity
                key={phase.id}
                onPress={() => {
                  setSelectedPhase(phase);
                  setShowPhaseModal(true);
                }}
                className="bg-zinc-900/60 backdrop-blur-xl rounded-3xl p-6 border border-zinc-800/30"
              >
                <View className="flex-row items-start justify-between mb-4">
                  <View className="flex-1 pr-4">
                    <View className="flex-row items-center gap-3 mb-3">
                      <View className={`w-10 h-10 rounded-2xl items-center justify-center ${getStatusBgColor(phase.status)}`}>
                        <Text className={`font-inter-black text-sm ${getStatusColor(phase.status)}`}>
                          {index + 1}
                        </Text>
                      </View>
                      <View className="flex-1">
                        <Text className="text-white font-inter-bold text-base mb-1">
                          {phase.name}
                        </Text>
                        <Text className="text-gray-400 font-inter-medium text-sm">
                          {phase.description}
                        </Text>
                      </View>
                    </View>
                  </View>
                  
                  <View className="items-end gap-2">
                    <View className={`px-3 py-1 rounded-xl border ${getStatusBgColor(phase.status)}`}>
                      <Text className={`font-inter-bold text-xs ${getStatusColor(phase.status)}`}>
                        {getStatusText(phase.status)}
                      </Text>
                    </View>
                    <Text className="text-gray-500 font-inter-medium text-xs">
                      {phase.estimatedDays} dias
                    </Text>
                  </View>
                </View>

                {phase.status === 'in_progress' && (
                  <View className="mb-4">
                    <View className="bg-blue-600/10 rounded-2xl p-4 border border-blue-600/20">
                      <View className="flex-row items-center gap-3">
                        <View className="w-8 h-8 bg-blue-600/20 rounded-xl items-center justify-center">
                          <Ionicons name="play" size={16} color="#60A5FA" />
                        </View>
                        <Text className="text-blue-400 font-inter-medium text-sm flex-1">
                          Esta fase está em andamento
                        </Text>
                      </View>
                    </View>
                  </View>
                )}

                {phase.notes && (
                  <View className="pt-4 border-t border-zinc-800/30">
                    <Text className="text-gray-400 font-inter-medium text-sm">
                      "{phase.notes}"
                    </Text>
                  </View>
                )}

                <View className="flex-row items-center justify-between pt-4 border-t border-zinc-800/30">
                  <View className="flex-row items-center gap-2">
                    {phase.startDate && (
                      <Text className="text-gray-500 font-inter-medium text-xs">
                        Iniciado: {phase.startDate}
                      </Text>
                    )}
                    {phase.endDate && (
                      <Text className="text-gray-500 font-inter-medium text-xs">
                        • Concluído: {phase.endDate}
                      </Text>
                    )}
                  </View>
                  
                  <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View className="mx-6 mb-8">
          <View className="flex-row items-center justify-between mb-6">
            <Text className="text-white font-inter-black text-lg">
              Serviços do Projeto
            </Text>
            <View className="bg-green-600/20 px-4 py-2 rounded-xl border border-green-600/30">
              <Text className="text-green-400 font-inter-bold text-sm">
                {project.services.length}
              </Text>
            </View>
          </View>
          
          <View className="gap-4">
            {project.services.map((service) => (
              <View key={service.id} className="bg-zinc-900/60 backdrop-blur-xl rounded-3xl p-6 border border-zinc-800/30">
                <View className="flex-row items-center justify-between">
                  <View className="flex-1 pr-4">
                    <View className="flex-row items-center gap-3 mb-3">
                      <View className="w-12 h-12 bg-green-600/20 rounded-2xl items-center justify-center">
                        <Ionicons name={service.icon as any} size={20} color="#10B981" />
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

                  <View className="items-end">
                    <View className="bg-zinc-800/40 rounded-xl px-4 py-2 border border-zinc-700/30 mb-2">
                      <Text className="text-white font-inter-black text-base text-center">{service.quantity}</Text>
                      <Text className="text-gray-400 font-inter-medium text-xs text-center">{service.unit}(s)</Text>
                    </View>
                    <Text className="text-green-400 font-inter-black text-lg">
                      {formatCurrency(service.total)}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View className="h-20" />
      </ScrollView>

      <Modal
        visible={showPhaseModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowPhaseModal(false)}
      >
        <SafeAreaView className="flex-1 bg-neutral-900">
          {selectedPhase && (
            <>
              <View className="px-6 py-4 border-b border-zinc-800/30">
                <View className="flex-row items-center justify-between">
                  <Text className="text-white font-inter-black text-lg">{selectedPhase.name}</Text>
                  <TouchableOpacity 
                    onPress={() => setShowPhaseModal(false)}
                    className="w-10 h-10 bg-zinc-800/50 rounded-xl items-center justify-center border border-zinc-700/40"
                  >
                    <Ionicons name="close" size={20} color="#9CA3AF" />
                  </TouchableOpacity>
                </View>
              </View>

              <ScrollView className="flex-1 px-6 py-6">
                <View className="bg-zinc-900/60 backdrop-blur-xl rounded-3xl p-6 border border-zinc-800/30 mb-6">
                  <Text className="text-white font-inter-bold text-base mb-4">Status da Fase</Text>
                  
                  <View className="gap-3">
                    {(['pending', 'in_progress', 'completed'] as const).map((status) => (
                      <TouchableOpacity
                        key={status}
                        onPress={() => {
                          updatePhaseStatus(selectedPhase.id, status);
                          setSelectedPhase({ ...selectedPhase, status });
                        }}
                        className={`flex-row items-center gap-3 p-4 rounded-2xl border ${
                          selectedPhase.status === status 
                            ? getStatusBgColor(status) 
                            : 'bg-zinc-800/40 border-zinc-700/30'
                        }`}
                      >
                        <View className={`w-6 h-6 rounded-full border-2 items-center justify-center ${
                          selectedPhase.status === status
                            ? 'border-current bg-current'
                            : 'border-gray-400'
                        }`}>
                          {selectedPhase.status === status && (
                            <Ionicons name="checkmark" size={16} color="white" />
                          )}
                        </View>
                        <Text className={`font-inter-medium text-base ${
                          selectedPhase.status === status 
                            ? getStatusColor(status)
                            : 'text-gray-400'
                        }`}>
                          {getStatusText(status)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View className="bg-zinc-900/60 backdrop-blur-xl rounded-3xl p-6 border border-zinc-800/30 mb-6">
                  <Text className="text-white font-inter-bold text-base mb-4">Informações</Text>
                  
                  <View className="gap-4">
                    <View>
                      <Text className="text-gray-400 font-inter-medium text-sm mb-2">Descrição</Text>
                      <Text className="text-white font-inter-medium text-base">
                        {selectedPhase.description}
                      </Text>
                    </View>

                    <View className="flex-row gap-4">
                      <View className="flex-1">
                        <Text className="text-gray-400 font-inter-medium text-sm mb-2">Prazo Estimado</Text>
                        <View className="bg-zinc-800/40 rounded-xl px-4 py-3 border border-zinc-700/30">
                          <Text className="text-white font-inter-bold text-base">
                            {selectedPhase.estimatedDays} dias
                          </Text>
                        </View>
                      </View>
                      
                      {selectedPhase.startDate && (
                        <View className="flex-1">
                          <Text className="text-gray-400 font-inter-medium text-sm mb-2">Data de Início</Text>
                          <View className="bg-zinc-800/40 rounded-xl px-4 py-3 border border-zinc-700/30">
                            <Text className="text-white font-inter-bold text-base">
                              {selectedPhase.startDate}
                            </Text>
                          </View>
                        </View>
                      )}
                    </View>

                    {selectedPhase.endDate && (
                      <View>
                        <Text className="text-gray-400 font-inter-medium text-sm mb-2">Data de Conclusão</Text>
                        <View className="bg-green-600/20 rounded-xl px-4 py-3 border border-green-600/30">
                          <Text className="text-green-400 font-inter-bold text-base">
                            {selectedPhase.endDate}
                          </Text>
                        </View>
                      </View>
                    )}
                  </View>
                </View>

                <View className="bg-zinc-900/60 backdrop-blur-xl rounded-3xl p-6 border border-zinc-800/30 mb-6">
                  <Text className="text-white font-inter-bold text-base mb-4">Notas e Observações</Text>
                  
                  <TextInput
                    value={selectedPhase.notes || ''}
                    onChangeText={(text) => {
                      setSelectedPhase({ ...selectedPhase, notes: text });
                      updatePhaseNotes(selectedPhase.id, text);
                    }}
                    placeholder="Adicione notas sobre esta fase..."
                    placeholderTextColor="#6B7280"
                    multiline
                    numberOfLines={4}
                    className="text-white font-inter-medium text-base bg-zinc-800/40 rounded-xl px-4 py-3 border border-zinc-700/30"
                    style={{ textAlignVertical: 'top' }}
                  />
                </View>

                <View className="bg-zinc-900/60 backdrop-blur-xl rounded-3xl p-6 border border-zinc-800/30">
                  <Text className="text-white font-inter-bold text-base mb-4">Serviços desta Fase</Text>
                  
                  <View className="gap-3">
                    {selectedPhase.services.map((serviceId) => {
                      const service = availableServices.find(s => s.id === serviceId);
                      const isCompleted = selectedPhase.completedServices.includes(serviceId);
                      
                      return service ? (
                        <View key={serviceId} className={`flex-row items-center gap-3 p-4 rounded-2xl border ${
                          isCompleted 
                            ? 'bg-green-600/20 border-green-600/30' 
                            : 'bg-zinc-800/40 border-zinc-700/30'
                        }`}>
                          <View className={`w-12 h-12 rounded-2xl items-center justify-center ${
                            isCompleted ? 'bg-green-600/30' : 'bg-blue-600/20'
                          }`}>
                            <Ionicons 
                              name={service.icon as any} 
                              size={20} 
                              color={isCompleted ? "#10B981" : "#60A5FA"} 
                            />
                          </View>
                          
                          <View className="flex-1">
                            <Text className={`font-inter-bold text-base mb-1 ${
                              isCompleted ? 'text-green-400' : 'text-white'
                            }`}>
                              {service.name}
                            </Text>
                            <Text className={`font-inter-medium text-sm ${
                              isCompleted ? 'text-green-400/70' : 'text-gray-400'
                            }`}>
                              {formatCurrency(service.price)} / {service.unit}
                            </Text>
                          </View>

                          {isCompleted && (
                            <View className="w-8 h-8 bg-green-600/30 rounded-full items-center justify-center">
                              <Ionicons name="checkmark" size={20} color="#10B981" />
                            </View>
                          )}
                        </View>
                      ) : null;
                    })}
                  </View>
                </View>

                <View className="h-20" />
              </ScrollView>
            </>
          )}
        </SafeAreaView>
      </Modal>

      <Modal
        visible={showAddServiceModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddServiceModal(false)}
      >
        <SafeAreaView className="flex-1 bg-neutral-900">
          <View className="px-6 py-4 border-b border-zinc-800/30">
            <View className="flex-row items-center justify-between">
              <Text className="text-white font-inter-black text-lg">Adicionar Serviço</Text>
              <TouchableOpacity 
                onPress={() => setShowAddServiceModal(false)}
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
                        colors={['#3B82F6', '#1E40AF']}
                        className="flex-row items-center gap-3 px-5 py-3 rounded-2xl"
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
            <View className="gap-4">
              {filteredServices.map((service) => (
                <AddServiceItem 
                  key={service.id} 
                  service={service} 
                  onAdd={(service, quantity) => {
                    addService(service, quantity);
                    setShowAddServiceModal(false);
                  }}
                  formatCurrency={formatCurrency}
                />
              ))}
              
              {filteredServices.length === 0 && (
                <View className="bg-zinc-900/60 backdrop-blur-xl rounded-3xl p-8 items-center border border-zinc-800/30">
                  <View className="w-16 h-16 bg-zinc-800/50 rounded-3xl items-center justify-center mb-4">
                    <Ionicons name="search" size={32} color="#6B7280" />
                  </View>
                  <Text className="text-white font-inter-black text-xl mb-2">Nenhum serviço encontrado</Text>
                  <Text className="text-gray-400 font-inter-medium text-sm text-center">
                    Todos os serviços disponíveis já estão no projeto ou não correspondem aos filtros
                  </Text>
                </View>
              )}
            </View>
            <View className="h-20" />
          </ScrollView>
        </SafeAreaView>
      </Modal>

    </SafeAreaView>
  );
}

interface AddServiceItemProps {
  service: Service;
  onAdd: (service: Service, quantity: number) => void;
  formatCurrency: (value: number) => string;
}

function AddServiceItem({ service, onAdd, formatCurrency }: AddServiceItemProps) {
  const [quantity, setQuantity] = useState('1');
  
  const handleAdd = () => {
    const qty = parseInt(quantity) || 1;
    onAdd(service, qty);
    setQuantity('1');
  };

  return (
    <View className="bg-zinc-900/60 backdrop-blur-xl rounded-3xl p-6 border border-zinc-800/30">
      <View className="flex-row items-start justify-between mb-4">
        <View className="flex-1 pr-4">
          <View className="flex-row items-center gap-3 mb-3">
            <View className="w-12 h-12 bg-blue-600/20 rounded-2xl items-center justify-center">
              <Ionicons name={service.icon as any} size={20} color="#60A5FA" />
            </View>
            <View className="flex-1">
              <Text className="text-white font-inter-bold text-base mb-1">
                {service.name}
              </Text>
              <Text className="text-blue-400 font-inter-semibold text-sm">
                {formatCurrency(service.price)} / {service.unit}
              </Text>
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
            {formatCurrency(service.price * (parseInt(quantity) || 1))}
          </Text>
          <TouchableOpacity 
            onPress={handleAdd}
            className="active:scale-90"
          >
            <LinearGradient
              colors={['#10B981', '#059669']}
              className="w-12 h-12 rounded-2xl items-center justify-center"
            >
              <Ionicons name="add" size={20} color="white" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}