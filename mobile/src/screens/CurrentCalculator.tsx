import { SafeAreaView, View, TouchableOpacity, Text, ScrollView, TextInput, Animated } from "react-native";
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useState, useRef, useEffect, useCallback } from 'react';

const CIRCUIT_TYPES = [
  { value: 'monofasico', label: 'Monofásico', icon: 'flash', description: 'I = P / V' },
  { value: 'bifasico_total', label: 'Bifásico Total', icon: 'pulse', description: 'Carga entre duas fases' },
  { value: 'bifasico_dividido', label: 'Bifásico Dividido', icon: 'git-branch', description: 'Carga dividida entre fases' },
  { value: 'trifasico', label: 'Trifásico', icon: 'trending-up', description: 'I = P / (√3 × V × cosφ)' }
];

const BREAKER_STANDARDS = [
  { amperage: 10, label: '10A' },
  { amperage: 16, label: '16A' },
  { amperage: 20, label: '20A' },
  { amperage: 25, label: '25A' },
  { amperage: 32, label: '32A' },
  { amperage: 40, label: '40A' },
  { amperage: 50, label: '50A' },
  { amperage: 63, label: '63A' },
  { amperage: 80, label: '80A' },
  { amperage: 100, label: '100A' },
  { amperage: 125, label: '125A' },
  { amperage: 160, label: '160A' },
  { amperage: 200, label: '200A' }
];

const COPPER_AMPACITY = [
  { section: 1.5, ampacity: 17.5, label: '1,5mm²' },
  { section: 2.5, ampacity: 24, label: '2,5mm²' },
  { section: 4, ampacity: 32, label: '4mm²' },
  { section: 6, ampacity: 41, label: '6mm²' },
  { section: 10, ampacity: 57, label: '10mm²' },
  { section: 16, ampacity: 76, label: '16mm²' },
  { section: 25, ampacity: 101, label: '25mm²' },
  { section: 35, ampacity: 125, label: '35mm²' },
  { section: 50, ampacity: 151, label: '50mm²' },
  { section: 70, ampacity: 192, label: '70mm²' },
  { section: 95, ampacity: 232, label: '95mm²' },
  { section: 120, ampacity: 269, label: '120mm²' },
  { section: 150, ampacity: 309, label: '150mm²' },
  { section: 185, ampacity: 353, label: '185mm²' },
  { section: 240, ampacity: 415, label: '240mm²' },
  { section: 300, ampacity: 477, label: '300mm²' }
];

interface FormData {
  circuitType: string;
  power: string;
  voltage: string;
  powerFactor: string;
  isContinuous: boolean;
}

interface FormErrors {
  [key: string]: string | null;
}

interface CalculationResult {
  current: number;
  currentPerPhase?: number;
  adjustedCurrent: number;
  suggestedBreaker: number;
  nextBreaker: number;
  suggestedCable: {
    section: number;
    ampacity: number;
    label: string;
  };
  calculations: {
    type: string;
    formula: string;
    steps: string[];
  };
}

export default function CurrentCalculator() {
  const [formData, setFormData] = useState<FormData>({
    circuitType: 'monofasico',
    power: '',
    voltage: '',
    powerFactor: '0.85',
    isContinuous: true
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    if (isCalculating) {
      const rotate = () => {
        rotateAnim.setValue(0);
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }).start(() => rotate());
      };
      rotate();
    }
  }, [isCalculating]);

  const updateField = useCallback((field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    if (errors[field as string]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  }, [errors]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.power || parseFloat(formData.power) <= 0) {
      newErrors.power = 'Potência deve ser maior que 0';
    }

    if (!formData.voltage || parseFloat(formData.voltage) <= 0) {
      newErrors.voltage = 'Tensão deve ser maior que 0';
    }

    const pf = parseFloat(formData.powerFactor);
    if (!formData.powerFactor || pf <= 0 || pf > 1) {
      newErrors.powerFactor = 'Fator de potência deve estar entre 0 e 1';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const calculateCurrent = async (): Promise<void> => {
    if (!validateForm()) return;

    setIsCalculating(true);
    
    setTimeout(() => {
      const power = parseFloat(formData.power);
      const voltage = parseFloat(formData.voltage);
      const powerFactor = parseFloat(formData.powerFactor);

      let current: number;
      let currentPerPhase: number | undefined;
      let formula: string;
      let steps: string[] = [];

      switch (formData.circuitType) {
        case 'monofasico':
          current = power / voltage;
          formula = 'I = P / V';
          steps = [
            `I = ${power}W / ${voltage}V`,
            `I = ${current.toFixed(2)}A`
          ];
          break;

        case 'bifasico_total':
          current = power / voltage;
          formula = 'I = P / V';
          steps = [
            `Carga total entre duas fases (${voltage}V)`,
            `I = ${power}W / ${voltage}V`,
            `I = ${current.toFixed(2)}A`
          ];
          break;

        case 'bifasico_dividido':
          currentPerPhase = (power / 2) / voltage;
          current = currentPerPhase;
          formula = 'I_fase = (P/2) / V';
          steps = [
            `Potência por fase = ${power}W / 2 = ${power/2}W`,
            `I_cada_fase = ${power/2}W / ${voltage}V`,
            `I_cada_fase = ${currentPerPhase.toFixed(2)}A`
          ];
          break;

        case 'trifasico':
          current = power / (Math.sqrt(3) * voltage * powerFactor);
          formula = 'I = P / (√3 × V × cosφ)';
          steps = [
            `I = ${power}W / (√3 × ${voltage}V × ${powerFactor})`,
            `I = ${power} / ${(Math.sqrt(3) * voltage * powerFactor).toFixed(2)}`,
            `I = ${current.toFixed(2)}A`
          ];
          break;

        default:
          current = 0;
          formula = '';
      }

      const adjustedCurrent = formData.isContinuous ? current * 1.25 : current;

      const suggestedBreaker = BREAKER_STANDARDS.find(b => b.amperage >= adjustedCurrent);
      const nextBreaker = BREAKER_STANDARDS.find(b => b.amperage > adjustedCurrent);

      const suggestedCable = COPPER_AMPACITY.find(c => c.ampacity >= adjustedCurrent);

      setResult({
        current,
        currentPerPhase,
        adjustedCurrent,
        suggestedBreaker: suggestedBreaker?.amperage || 0,
        nextBreaker: nextBreaker?.amperage || 0,
        suggestedCable: suggestedCable || COPPER_AMPACITY[COPPER_AMPACITY.length - 1],
        calculations: {
          type: CIRCUIT_TYPES.find(t => t.value === formData.circuitType)?.label || '',
          formula,
          steps
        }
      });

      setIsCalculating(false);
    }, 800);
  };

  interface InputFieldProps {
    label: string;
    value: string;
    onChangeText: (text: string) => void;
    placeholder: string;
    icon: keyof typeof Ionicons.glyphMap;
    keyboardType?: 'default' | 'numeric' | 'decimal-pad';
    required?: boolean;
    error?: string | null;
    unit?: string;
  }

  const InputField = useCallback(({ 
    label, 
    value, 
    onChangeText, 
    placeholder, 
    icon, 
    keyboardType = 'default',
    required = false,
    error = null,
    unit
  }: InputFieldProps) => (
    <View className="mb-5">
      <View className="flex-row items-center gap-3 mb-3">
        <View className={`w-7 h-7 rounded-lg items-center justify-center ${
          error ? 'bg-red-500/15' : value ? 'bg-blue-500/15' : 'bg-gray-600/20'
        }`}>
          <Ionicons name={icon} size={16} color={error ? "#EF4444" : value ? "#3B82F6" : "#9CA3AF"} />
        </View>
        <Text className="text-white font-semibold text-base">
          {label} {required && <Text className="text-blue-400 font-bold">*</Text>}
          {unit && <Text className="text-gray-400 text-sm"> ({unit})</Text>}
        </Text>
      </View>
      
      <View className="relative">
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#6B7280"
          keyboardType={keyboardType}
          autoCorrect={false}
          className={`rounded-xl px-4 py-4 text-white font-medium text-base border ${
            error ? 'border-red-500/50 bg-red-500/5' : 
            value ? 'border-blue-500/50 bg-blue-500/5' : 'border-gray-600/30 bg-gray-800/40'
          }`}
          style={{
            textAlignVertical: 'center',
            ...(value && !error && {
              shadowColor: "#3B82F6",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 2,
            })
          }}
        />
        
        {value && !error && (
          <View className="absolute right-3 top-1/2 -translate-y-2">
            <View className="w-5 h-5 bg-green-500/20 rounded-full items-center justify-center">
              <Ionicons name="checkmark" size={12} color="#10B981" />
            </View>
          </View>
        )}
      </View>
      
      {error && (
        <View className="flex-row items-center gap-2 mt-2">
          <Ionicons name="alert-circle" size={14} color="#EF4444" />
          <Text className="text-red-400 font-medium text-sm">
            {error}
          </Text>
        </View>
      )}
    </View>
  ), []);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  return (
    <SafeAreaView className="flex-1 bg-neutral-900">
      <Animated.View style={{ opacity: fadeAnim }} className="flex-1">
        <ScrollView 
          className="flex-1" 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View className="px-6 mt-16 pb-6">
            <View className="flex-row items-center justify-between mb-8">
              <TouchableOpacity 
                className="w-10 h-10 bg-gray-800/60 rounded-xl items-center justify-center border border-gray-700/40 active:scale-95"
                style={{
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.2,
                  shadowRadius: 4,
                  elevation: 4,
                }}
              >
                <Ionicons name="chevron-back" size={18} color="#60A5FA" />
              </TouchableOpacity>
              
              <View className="flex-1 items-center">
                <Text className="text-white font-bold text-sm">CÁLCULO DE CORRENTE</Text>
                <View className="w-16 h-0.5 bg-yellow-500 rounded-full mt-1" />
              </View>

              <View className="w-10 h-10" />
            </View>
          </View>

          <View className="px-6">
            <View className="relative mb-8">
              <LinearGradient
                colors={['rgba(245, 158, 11, 0.08)', 'rgba(217, 119, 6, 0.04)']}
                className="rounded-2xl p-6 border border-amber-500/20"
              >
                <View className="flex-row items-center gap-3 mb-6">
                  <View className="w-10 h-10 bg-amber-500/20 rounded-xl items-center justify-center">
                    <Ionicons name="flash" size={18} color="#F59E0B" />
                  </View>
                  <View>
                    <Text className="text-amber-300 font-bold text-lg">
                      Tipo de Circuito
                    </Text>
                    <Text className="text-amber-400/60 font-medium text-sm">
                      Selecione o tipo de alimentação
                    </Text>
                  </View>
                </View>

                <View className="gap-3">
                  {CIRCUIT_TYPES.map((type) => (
                    <TouchableOpacity
                      key={type.value}
                      onPress={() => updateField('circuitType', type.value)}
                      className={`p-4 rounded-xl border ${
                        formData.circuitType === type.value
                          ? 'border-amber-500/50 bg-amber-500/10'
                          : 'border-gray-600/40 bg-gray-800/20'
                      }`}
                      activeOpacity={0.8}
                    >
                      <View className="flex-row items-center gap-3">
                        <View className={`w-8 h-8 rounded-lg items-center justify-center ${
                          formData.circuitType === type.value ? 'bg-amber-500/20' : 'bg-gray-600/20'
                        }`}>
                          <Ionicons 
                            name={type.icon as keyof typeof Ionicons.glyphMap} 
                            size={16} 
                            color={formData.circuitType === type.value ? "#F59E0B" : "#9CA3AF"} 
                          />
                        </View>
                        <View className="flex-1">
                          <Text className={`font-semibold text-base ${
                            formData.circuitType === type.value ? 'text-amber-200' : 'text-gray-300'
                          }`}>
                            {type.label}
                          </Text>
                          <Text className={`text-xs ${
                            formData.circuitType === type.value ? 'text-amber-300/70' : 'text-gray-400'
                          }`}>
                            {type.description}
                          </Text>
                        </View>
                        {formData.circuitType === type.value && (
                          <View className="w-5 h-5 bg-amber-500/20 rounded-full items-center justify-center">
                            <Ionicons name="checkmark" size={12} color="#F59E0B" />
                          </View>
                        )}
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </LinearGradient>
            </View>

            <View className="relative mb-8">
              <LinearGradient
                colors={['rgba(59, 130, 246, 0.08)', 'rgba(30, 64, 175, 0.04)']}
                className="rounded-2xl p-6 border border-blue-500/20"
              >
                <View className="flex-row items-center gap-3 mb-6">
                  <View className="w-10 h-10 bg-blue-500/20 rounded-xl items-center justify-center">
                    <Ionicons name="calculator" size={18} color="#3B82F6" />
                  </View>
                  <View>
                    <Text className="text-blue-300 font-bold text-lg">
                      Parâmetros de Entrada
                    </Text>
                    <Text className="text-blue-400/60 font-medium text-sm">
                      Dados para o cálculo
                    </Text>
                  </View>
                </View>

                <View className="flex-row gap-3 mb-5">
                  <View className="flex-1">
                    <InputField
                      label="Potência"
                      value={formData.power}
                      onChangeText={(text) => updateField('power', text)}
                      placeholder="7500"
                      icon="flame-outline"
                      keyboardType="decimal-pad"
                      required
                      error={errors.power}
                      unit="W"
                    />
                  </View>
                  <View className="flex-1">
                    <InputField
                      label="Tensão"
                      value={formData.voltage}
                      onChangeText={(text) => updateField('voltage', text)}
                      placeholder="220"
                      icon="flash-outline"
                      keyboardType="decimal-pad"
                      required
                      error={errors.voltage}
                      unit="V"
                    />
                  </View>
                </View>

                {formData.circuitType === 'trifasico' && (
                  <InputField
                    label="Fator de Potência"
                    value={formData.powerFactor}
                    onChangeText={(text) => updateField('powerFactor', text)}
                    placeholder="0.85"
                    icon="stats-chart-outline"
                    keyboardType="decimal-pad"
                    required
                    error={errors.powerFactor}
                    unit="cosφ"
                  />
                )}

                <View className="mb-2">
                  <View className="flex-row items-center gap-3 mb-3">
                    <View className="w-7 h-7 rounded-lg items-center justify-center bg-blue-500/15">
                      <Ionicons name="time-outline" size={16} color="#3B82F6" />
                    </View>
                    <Text className="text-white font-semibold text-base">
                      Tipo de Carga
                    </Text>
                  </View>
                  
                  <View className="flex-row gap-3">
                    <TouchableOpacity
                      onPress={() => updateField('isContinuous', true)}
                      className={`flex-1 p-4 rounded-xl border ${
                        formData.isContinuous
                          ? 'border-blue-500/50 bg-blue-500/10'
                          : 'border-gray-600/40 bg-gray-800/20'
                      }`}
                      activeOpacity={0.8}
                    >
                      <View className="items-center gap-2">
                        <View className={`w-8 h-8 rounded-lg items-center justify-center ${
                          formData.isContinuous ? 'bg-blue-500/20' : 'bg-gray-600/20'
                        }`}>
                          <Ionicons 
                            name="infinite-outline" 
                            size={16} 
                            color={formData.isContinuous ? "#3B82F6" : "#9CA3AF"} 
                          />
                        </View>
                        <Text className={`font-semibold text-sm text-center ${
                          formData.isContinuous ? 'text-blue-200' : 'text-gray-300'
                        }`}>
                          Contínua
                        </Text>
                        <Text className={`text-xs text-center ${
                          formData.isContinuous ? 'text-blue-300/70' : 'text-gray-400'
                        }`}>
                          3h uso
                        </Text>
                      </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => updateField('isContinuous', false)}
                      className={`flex-1 p-4 rounded-xl border ${
                        !formData.isContinuous
                          ? 'border-blue-500/50 bg-blue-500/10'
                          : 'border-gray-600/40 bg-gray-800/20'
                      }`}
                      activeOpacity={0.8}
                    >
                      <View className="items-center gap-2">
                        <View className={`w-8 h-8 rounded-lg items-center justify-center ${
                          !formData.isContinuous ? 'bg-blue-500/20' : 'bg-gray-600/20'
                        }`}>
                          <Ionicons 
                            name="hourglass-outline" 
                            size={16} 
                            color={!formData.isContinuous ? "#3B82F6" : "#9CA3AF"} 
                          />
                        </View>
                        <Text className={`font-semibold text-sm text-center ${
                          !formData.isContinuous ? 'text-blue-200' : 'text-gray-300'
                        }`}>
                          Não Contínua
                        </Text>
                        <Text className={`text-xs text-center ${
                          !formData.isContinuous ? 'text-blue-300/70' : 'text-gray-400'
                        }`}>
                          3h uso
                        </Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                </View>
              </LinearGradient>
            </View>

            {result && (
              <View className="relative mb-8">
                <LinearGradient
                  colors={['rgba(16, 185, 129, 0.08)', 'rgba(5, 150, 105, 0.04)']}
                  className="rounded-2xl p-6 border border-green-500/20"
                >
                  <View className="flex-row items-center gap-3 mb-6">
                    <View className="w-10 h-10 bg-green-500/20 rounded-xl items-center justify-center">
                      <Ionicons name="checkmark-circle" size={18} color="#10B981" />
                    </View>
                    <View>
                      <Text className="text-green-300 font-bold text-lg">
                        Resultados do Cálculo
                      </Text>
                      <Text className="text-green-400/60 font-medium text-sm">
                        {result.calculations.type}
                      </Text>
                    </View>
                  </View>

                  <View className="bg-slate-800/40 rounded-xl p-5 border border-slate-700/30 mb-6">
                    <Text className="text-slate-300 font-medium text-sm mb-3">Corrente Calculada</Text>
                    
                    {formData.circuitType === 'bifasico_dividido' ? (
                      <View className="space-y-3">
                        <View className="flex-row items-center justify-between">
                          <Text className="text-white font-semibold">Por fase:</Text>
                          <Text className="text-cyan-400 font-bold text-xl">{result.currentPerPhase?.toFixed(2)}A</Text>
                        </View>
                        <View className="h-px bg-slate-600/50" />
                        <View className="flex-row items-center justify-between">
                          <Text className="text-white font-semibold">Total:</Text>
                          <Text className="text-white font-bold text-xl">{(result.current * 2).toFixed(2)}A</Text>
                        </View>
                      </View>
                    ) : (
                      <View className="flex-row items-center justify-between">
                        <Text className="text-white font-semibold">Corrente:</Text>
                        <Text className="text-cyan-400 font-bold text-3xl">{result.current.toFixed(2)}A</Text>
                      </View>
                    )}
                  </View>

                  <View className="bg-slate-800/40 rounded-xl p-5 border border-slate-700/30 mb-6">
                    <Text className="text-slate-300 font-medium text-sm mb-4">Dimensionamento do Disjuntor</Text>
                    
                    <View className="space-y-4">
                      <View className="flex-row items-center justify-between">
                        <Text className="text-slate-200 font-medium">
                          Corrente {formData.isContinuous ? 'ajustada (×1.25):' : 'nominal:'}
                        </Text>
                        <Text className="text-yellow-400 font-bold text-xl">
                          {result.adjustedCurrent.toFixed(2)}A
                        </Text>
                      </View>
                      
                      {formData.isContinuous && (
                        <View className="bg-orange-500/5 rounded-lg p-3 border border-orange-500/20">
                          <Text className="text-orange-200 text-xs">
                            Para cargas contínuas (3h), aplicamos fator de 125% conforme norma
                          </Text>
                        </View>
                      )}

                      <View className="h-px bg-slate-600/50" />
                      
                      <View className="flex-row items-center justify-between">
                        <Text className="text-slate-200 font-medium">Disjuntor recomendado:</Text>
                        <View className="bg-green-500/20 px-4 py-2 rounded-lg border border-green-500/30 mt-2">
                          <Text className="text-green-200 font-bold text-lg">
                            {result.suggestedBreaker}A
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  <View className="bg-slate-800/40 rounded-xl p-5 border border-slate-700/30 mb-6">
                    <Text className="text-slate-300 font-medium text-sm mb-4">Dimensionamento do Cabo</Text>
                    
                    <View className="space-y-4">
                      <View className="flex-row items-center justify-between">
                        <Text className="text-slate-200 font-medium">Corrente de projeto:</Text>
                        <Text className="text-blue-400 font-bold text-lg">
                          {result.adjustedCurrent.toFixed(2)}A
                        </Text>
                      </View>
                      
                      <View className="h-px bg-slate-600/50" />
                      
                      <View className="flex-row items-center justify-between">
                        <Text className="text-slate-200 font-medium">Cabo recomendado:</Text>
                        <View className="bg-purple-500/20 px-4 py-2 rounded-lg border border-purple-500/30 mt-3">
                          <Text className="text-purple-200 font-bold text-lg">
                            {result.suggestedCable.label}
                          </Text>
                        </View>
                      </View>
                      
                      <View className="flex-row items-center justify-between mt-3">
                        <Text className="text-slate-300 text-sm">Ampacidade do cabo:</Text>
                        <Text className="text-slate-200 font-semibold">
                          {result.suggestedCable.ampacity}A
                        </Text>
                      </View>
                      
                      <View className="bg-blue-500/5 rounded-lg p-3 border border-blue-500/20">
                        <Text className="text-blue-200 text-xs">
                          Método B1 (eletrodutos em parede) - 2 condutores carregados - Cobre
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-xl p-5 border border-indigo-500/30 mb-6">
                    <View className="flex-row items-center gap-3 mb-4">
                      <View className="w-9 h-9 bg-indigo-500/20 rounded-xl items-center justify-center">
                        <Ionicons name="construct" size={18} color="#6366F1" />
                      </View>
                      <Text className="text-indigo-300 font-bold text-lg">
                        Resumo da Instalação
                      </Text>
                    </View>
                    
                    <View className="space-y-4">
                      <View className="flex-row items-center justify-between py-3 border-b border-slate-600/30">
                        <Text className="text-slate-300 font-medium">Tipo de circuito:</Text>
                        <Text className="text-white font-semibold">{result.calculations.type}</Text>
                      </View>
                      
                      <View className="flex-row items-center justify-between py-3 border-b border-slate-600/30">
                        <Text className="text-slate-300 font-medium">Corrente nominal:</Text>
                        <Text className="text-cyan-400 font-bold text-lg">{result.current.toFixed(2)}A</Text>
                      </View>
                      
                      <View className="flex-row items-center justify-between py-3 border-b border-slate-600/30">
                        <Text className="text-slate-300 font-medium">Disjuntor:</Text>
                        <View className="bg-green-500/20 px-3 py-1 rounded-lg">
                          <Text className="text-green-200 font-bold">{result.suggestedBreaker}A</Text>
                        </View>
                      </View>
                      
                      <View className="flex-row items-center justify-between py-3">
                        <Text className="text-slate-300 font-medium">Cabo condutor:</Text>
                        <View className="bg-purple-500/20 px-3 py-1 rounded-lg">
                          <Text className="text-purple-200 font-bold">{result.suggestedCable.label}</Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  <View className="bg-slate-800/40 rounded-xl p-5 border border-slate-700/30">
                    <View className="flex-row items-center gap-2 mb-4">
                      <Ionicons name="document-text-outline" size={16} color="#64748B" />
                      <Text className="text-slate-300 font-medium text-sm">Passos do Cálculo</Text>
                    </View>
                    
                    <View className="bg-slate-900/60 rounded-lg p-4 border border-slate-700/20">
                      <Text className="text-blue-300 font-mono text-sm mb-3">
                        {result.calculations.formula}
                      </Text>
                      
                      <View className="space-y-2">
                        {result.calculations.steps.map((step, index) => (
                          <Text key={index} className="text-slate-300 text-sm font-mono">
                            {index + 1}. {step}
                          </Text>
                        ))}
                      </View>
                    </View>
                  </View>
                </LinearGradient>
              </View>
            )}

            <View className="mb-8">
              <TouchableOpacity 
                onPress={calculateCurrent}
                disabled={isCalculating}
                className="active:scale-98" 
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={isCalculating ? 
                    ['#6B7280', '#4B5563'] : 
                    ['#F59E0B', '#D97706']
                  }
                  className="flex-row items-center justify-center gap-3 py-4 rounded-xl"
                  style={{
                    shadowColor: isCalculating ? "#6B7280" : "#F59E0B",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 8,
                    elevation: 8,
                    borderRadius: 12,
                  }}
                >
                  {isCalculating ? (
                    <Animated.View 
                      className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                      style={{
                        transform: [{ rotate: spin }]
                      }}
                    />
                  ) : (
                    <Ionicons name="calculator" size={20} color="white" />
                  )}
                  
                  <Text className="text-white font-bold text-lg">
                    {isCalculating ? 'Calculando...' : 'Calcular Corrente'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            <View className="bg-slate-800/40 rounded-xl p-5 border border-slate-700/30 mb-8">
              <View className="flex-row items-center gap-2 mb-4">
                <Ionicons name="bulb-outline" size={16} color="#64748B" />
                <Text className="text-slate-300 font-semibold text-sm">Exemplo Prático</Text>
              </View>
              
              <View className="bg-slate-900/60 rounded-lg p-4 border border-slate-700/20">
                <Text className="text-amber-300 font-semibold text-sm mb-2">
                  Carga de 7500W em 220V:
                </Text>
                
                <View className="space-y-2">
                  <Text className="text-slate-300 text-xs">
                    • Monofásico: I = 7500/220 = 34,09A
                  </Text>
                  <Text className="text-slate-300 text-xs">
                    • Bifásico dividido: I = 3750/220 = 17,05A por fase
                  </Text>
                  <Text className="text-slate-300 text-xs">
                    • Trifásico (cosφ=0,85): I = 7500/(√3×220×0,85) = 23,16A
                  </Text>
                </View>
              </View>
            </View>

            <View className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/30 mb-8">
              <View className="flex-row items-center gap-2 mb-3">
                <Ionicons name="information-circle" size={16} color="#64748B" />
                <Text className="text-slate-300 font-semibold text-sm">Informações Importantes</Text>
              </View>
              <Text className="text-slate-400 text-xs leading-5">
                • Para cargas contínuas: aplicar fator 1,25 conforme NBR 5410{'\n'}
                • Fator de potência típico: 0,8-0,9 (motores), ~1,0 (resistivo){'\n'}
                • Ampacidade: método B1 (eletrodutos em parede), 2 condutores{'\n'}
                • Sempre consulte um profissional para instalações definitivas{'\n'}
                • Considere também temperatura ambiente e agrupamento de cabos
              </Text>
            </View>

            <View className="bg-slate-800/40 rounded-xl p-5 border border-slate-700/30 mb-8">
              <View className="flex-row items-center gap-2 mb-4">
                <Ionicons name="hammer-outline" size={16} color="#64748B" />
                <Text className="text-slate-300 font-semibold text-sm">Dicas de Instalação</Text>
              </View>
              
              <View className="space-y-3">
                <View className="flex-row items-start gap-3">
                  <View className="w-5 h-5 bg-amber-500/20 rounded-full items-center justify-center mt-0.5">
                    <Ionicons name="shield-checkmark" size={12} color="#F59E0B" />
                  </View>
                  <Text className="text-slate-300 text-xs flex-1">
                    <Text className="font-semibold">Proteção:</Text> O disjuntor deve proteger o cabo, não apenas a carga
                  </Text>
                </View>
                
                <View className="flex-row items-start gap-3">
                  <View className="w-5 h-5 bg-purple-500/20 rounded-full items-center justify-center mt-0.5">
                    <Ionicons name="thermometer" size={12} color="#8B5CF6" />
                  </View>
                  <Text className="text-slate-300 text-xs flex-1">
                    <Text className="font-semibold">Temperatura:</Text> Considere fatores de correção para temperatura 30°C
                  </Text>
                </View>
                
                <View className="flex-row items-start gap-3">
                  <View className="w-5 h-5 bg-blue-500/20 rounded-full items-center justify-center mt-0.5">
                    <Ionicons name="layers" size={12} color="#3B82F6" />
                  </View>
                  <Text className="text-slate-300 text-xs flex-1">
                    <Text className="font-semibold">Agrupamento:</Text> Aplique fator de correção para múltiplos cabos
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
}