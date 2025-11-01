import { SafeAreaView, View, TouchableOpacity, Text, ScrollView, TextInput, Animated } from "react-native";
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useState, useRef, useEffect, useCallback } from 'react';

const CABLE_RESISTANCE = {
  copper: {
    1.5: 12.1,
    2.5: 7.41,
    4: 4.61,
    6: 3.08,
    10: 1.83,
    16: 1.15,
    25: 0.727,
    35: 0.524,
    50: 0.387,
    70: 0.268,
    95: 0.193,
    120: 0.153,
    150: 0.124,
    185: 0.0991,
    240: 0.0754,
    300: 0.0601,
    400: 0.047,
    500: 0.0366,
    630: 0.0283
  },
  aluminum: {
    16: 1.91,
    25: 1.20,
    35: 0.868,
    50: 0.641,
    70: 0.443,
    95: 0.320,
    120: 0.253,
    150: 0.206,
    185: 0.164,
    240: 0.125,
    300: 0.100,
    400: 0.0778,
    500: 0.0605,
    630: 0.0469
  }
};

const REACTANCE = 0.08;

const COPPER_SECTIONS = [1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95, 120, 150, 185, 240, 300, 400, 500, 630];
const ALUMINUM_SECTIONS = [16, 25, 35, 50, 70, 95, 120, 150, 185, 240, 300, 400, 500, 630];

const CIRCUIT_TYPES = [
  { value: 'monofasico', label: 'Monofásico', icon: 'flash' },
  { value: 'bifasico', label: 'Bifásico', icon: 'pulse' },
  { value: 'trifasico', label: 'Trifásico', icon: 'trending-up' },
  { value: 'cc', label: 'CC', icon: 'battery-charging' }
];

interface FormData {
  circuitType: string;
  voltage: string;
  current: string;
  distance: string;
  section: string;
  material: string;
  powerFactor: string;
}

interface FormErrors {
  [key: string]: string | null;
}

interface CalculationResult {
  voltageDrop: string;
  percentageDrop: string;
  isWithinLimit: boolean;
  resistance: string;
  impedance: string;
  suggestedSection?: string;
  suggestedVoltageDrop?: string;
  suggestedPercentageDrop?: string;
}

export function DropCalculator() {
  const [formData, setFormData] = useState<FormData>({
    circuitType: 'monofasico',
    voltage: '',
    current: '',
    distance: '',
    section: '',
    material: 'copper',
    powerFactor: '0.85'
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

  const updateField = useCallback((field: keyof FormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }

    if (field === 'material') {
      setFormData(prev => ({
        ...prev,
        material: value,
        section: ''
      }));
    }

    if (field === 'circuitType' && value === 'cc') {
      setFormData(prev => ({
        ...prev,
        circuitType: value,
        powerFactor: '1.0'
      }));
    } else if (field === 'circuitType' && value !== 'cc' && formData.powerFactor === '1.0') {
      setFormData(prev => ({
        ...prev,
        circuitType: value,
        powerFactor: '0.85'
      }));
    }
  }, [errors, formData.powerFactor]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.voltage || parseFloat(formData.voltage) <= 0) {
      newErrors.voltage = 'Tensão deve ser maior que 0';
    }

    if (!formData.current || parseFloat(formData.current) <= 0) {
      newErrors.current = 'Corrente deve ser maior que 0';
    }

    if (!formData.distance || parseFloat(formData.distance) <= 0) {
      newErrors.distance = 'Distância deve ser maior que 0';
    }

    if (!formData.section) {
      newErrors.section = 'Selecione a seção do cabo';
    }

    const pf = parseFloat(formData.powerFactor);
    if (!formData.powerFactor || pf <= 0 || pf > 1) {
      newErrors.powerFactor = 'Fator de potência deve estar entre 0 e 1';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const calculateVoltageDrop = async (): Promise<void> => {
    if (!validateForm()) return;

    setIsCalculating(true);
    
    setTimeout(() => {
      const voltage = parseFloat(formData.voltage);
      const current = parseFloat(formData.current);
      const distance = parseFloat(formData.distance);
      const section = parseFloat(formData.section);
      const powerFactor = parseFloat(formData.powerFactor);

      const resistanceTable = CABLE_RESISTANCE[formData.material as keyof typeof CABLE_RESISTANCE];
      const resistance = resistanceTable[section as keyof typeof resistanceTable];

      if (!resistance) {
        setErrors({ section: 'Seção não encontrada na tabela' });
        setIsCalculating(false);
        return;
      }

      const R = (resistance / 1000) * distance;
      const X = (REACTANCE / 1000) * distance;

      let voltageDrop: number;
      const sinPhi = Math.sqrt(1 - Math.pow(powerFactor, 2));

      switch (formData.circuitType) {
        case 'monofasico':
          voltageDrop = 2 * current * (R * powerFactor + X * sinPhi);
          break;
        case 'bifasico':
          voltageDrop = 2 * current * (R * powerFactor + X * sinPhi);
          break;
        case 'trifasico':
          voltageDrop = Math.sqrt(3) * current * (R * powerFactor + X * sinPhi);
          break;
        case 'cc':
          voltageDrop = 2 * current * R;
          break;
        default:
          voltageDrop = 0;
      }

      const percentageDrop = (voltageDrop / voltage) * 100;

      const isWithinLimit = percentageDrop <= 5;

      setResult({
        voltageDrop: voltageDrop.toFixed(2),
        percentageDrop: percentageDrop.toFixed(2),
        isWithinLimit,
        resistance: resistance.toFixed(4),
        impedance: Math.sqrt(R * R + X * X).toFixed(4)
      });

      setIsCalculating(false);
    }, 800);
  };

  const getAvailableSections = (): number[] => {
    return formData.material === 'copper' ? COPPER_SECTIONS : ALUMINUM_SECTIONS;
  };

  const findSuggestedSection = (
    voltage: number,
    current: number,
    distance: number,
    material: string,
    circuitType: string,
    powerFactor: number
  ) => {
    const availableSections = material === 'copper' ? COPPER_SECTIONS : ALUMINUM_SECTIONS;
    const resistanceTable = CABLE_RESISTANCE[material as keyof typeof CABLE_RESISTANCE];
    
    for (const section of availableSections) {
      const resistance = resistanceTable[section as keyof typeof resistanceTable];
      if (!resistance) continue;

      const R = (resistance / 1000) * distance;
      const X = (REACTANCE / 1000) * distance;
      
      let voltageDrop: number;
      const sinPhi = Math.sqrt(1 - Math.pow(powerFactor, 2));

      switch (circuitType) {
        case 'monofasico':
        case 'bifasico':
          voltageDrop = 2 * current * (R * powerFactor + X * sinPhi);
          break;
        case 'trifasico':
          voltageDrop = Math.sqrt(3) * current * (R * powerFactor + X * sinPhi);
          break;
        case 'cc':
          voltageDrop = 2 * current * R;
          break;
        default:
          continue;
      }

      const percentageDrop = (voltageDrop / voltage) * 100;
      
      if (percentageDrop <= 5) {
        return {
          section: section.toString(),
          voltageDrop: voltageDrop.toFixed(2),
          percentageDrop: percentageDrop.toFixed(2)
        };
      }
    }
    
    return null;
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
    disabled?: boolean;
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
    disabled = false
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
        </Text>
      </View>
      
      <View className="relative">
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#6B7280"
          keyboardType={keyboardType}
          editable={!disabled}
          autoCorrect={false}
          className={`rounded-xl px-4 py-4 text-white font-medium text-base border ${
            disabled ? 'bg-gray-700/20 border-gray-600/20 text-gray-400' :
            error ? 'border-red-500/50 bg-red-500/5' : 
            value ? 'border-blue-500/50 bg-blue-500/5' : 'border-gray-600/30 bg-gray-800/40'
          }`}
          style={{
            textAlignVertical: 'center',
            ...(value && !error && !disabled && {
              shadowColor: "#3B82F6",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 2,
            })
          }}
        />
        
        {value && !error && !disabled && (
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
                <Text className="text-white font-bold text-sm">QUEDA DE TENSÃO</Text>
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

                <View className="flex-row gap-3">
                  {CIRCUIT_TYPES.map((type) => (
                    <TouchableOpacity
                      key={type.value}
                      onPress={() => updateField('circuitType', type.value)}
                      className={`flex-1 p-3 rounded-xl border ${
                        formData.circuitType === type.value
                          ? 'border-amber-500/50 bg-amber-500/10'
                          : 'border-gray-600/40 bg-gray-800/20'
                      }`}
                      activeOpacity={0.8}
                    >
                      <View className="items-center gap-2">
                        <View className={`w-7 h-7 rounded-lg items-center justify-center ${
                          formData.circuitType === type.value ? 'bg-amber-500/20' : 'bg-gray-600/20'
                        }`}>
                          <Ionicons 
                            name={type.icon as keyof typeof Ionicons.glyphMap} 
                            size={14} 
                            color={formData.circuitType === type.value ? "#F59E0B" : "#9CA3AF"} 
                          />
                        </View>
                        <Text className={`font-semibold text-xs text-center ${
                          formData.circuitType === type.value ? 'text-amber-200' : 'text-gray-300'
                        }`}>
                          {type.label}
                        </Text>
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
                      Parâmetros Elétricos
                    </Text>
                    <Text className="text-blue-400/60 font-medium text-sm">
                      Dados do circuito
                    </Text>
                  </View>
                </View>

                <View className="flex-row gap-3 mb-5">
                  <View className="flex-1">
                    <InputField
                      label="Tensão"
                      value={formData.voltage}
                      onChangeText={(text) => updateField('voltage', text)}
                      placeholder="220, 380, 440..."
                      icon="flash-outline"
                      keyboardType="decimal-pad"
                      required
                      error={errors.voltage}
                    />
                  </View>
                  <View className="flex-1">
                    <InputField
                      label="Corrente"
                      value={formData.current}
                      onChangeText={(text) => updateField('current', text)}
                      placeholder="10, 25, 50..."
                      icon="trending-up-outline"
                      keyboardType="decimal-pad"
                      required
                      error={errors.current}
                    />
                  </View>
                </View>

                <InputField
                  label="Distância"
                  value={formData.distance}
                  onChangeText={(text) => updateField('distance', text)}
                  placeholder="Distância em metros"
                  icon="resize-outline"
                  keyboardType="decimal-pad"
                  required
                  error={errors.distance}
                />

                <InputField
                  label="Fator de Potência"
                  value={formData.powerFactor}
                  onChangeText={(text) => updateField('powerFactor', text)}
                  placeholder="0.85"
                  icon="stats-chart-outline"
                  keyboardType="decimal-pad"
                  required={formData.circuitType !== 'cc'}
                  error={errors.powerFactor}
                  disabled={formData.circuitType === 'cc'}
                />
              </LinearGradient>
            </View>

            <View className="relative mb-8">
              <LinearGradient
                colors={['rgba(139, 92, 246, 0.08)', 'rgba(124, 58, 237, 0.04)']}
                className="rounded-2xl p-6 border border-purple-500/20"
              >
                <View className="flex-row items-center gap-3 mb-6">
                  <View className="w-10 h-10 bg-purple-500/20 rounded-xl items-center justify-center">
                    <Ionicons name="git-branch" size={18} color="#8B5CF6" />
                  </View>
                  <View>
                    <Text className="text-purple-300 font-bold text-lg">
                      Cabo Condutor
                    </Text>
                    <Text className="text-purple-400/60 font-medium text-sm">
                      Material e seção transversal
                    </Text>
                  </View>
                </View>

                <View className="mb-5">
                  <View className="flex-row items-center gap-3 mb-3">
                    <View className={`w-7 h-7 rounded-lg items-center justify-center ${
                      'bg-purple-500/15'
                    }`}>
                      <Ionicons name="layers-outline" size={16} color="#8B5CF6" />
                    </View>
                    <Text className="text-white font-semibold text-base">
                      Material do Cabo <Text className="text-blue-400 font-bold">*</Text>
                    </Text>
                  </View>
                  
                  <View className="flex-row gap-3">
                    {[
                      { value: 'copper', label: 'Cobre', icon: 'medal' },
                      { value: 'aluminum', label: 'Alumínio', icon: 'diamond' }
                    ].map((material) => (
                      <TouchableOpacity
                        key={material.value}
                        onPress={() => updateField('material', material.value)}
                        className={`flex-1 p-4 rounded-xl border ${
                          formData.material === material.value
                            ? 'border-purple-500/50 bg-purple-500/10'
                            : 'border-gray-600/40 bg-gray-800/20'
                        }`}
                        activeOpacity={0.8}
                      >
                        <View className="items-center gap-2">
                          <View className={`w-8 h-8 rounded-lg items-center justify-center ${
                            formData.material === material.value ? 'bg-purple-500/20' : 'bg-gray-600/20'
                          }`}>
                            <Ionicons 
                              name={material.icon as keyof typeof Ionicons.glyphMap} 
                              size={16} 
                              color={formData.material === material.value ? "#8B5CF6" : "#9CA3AF"} 
                            />
                          </View>
                          <Text className={`font-semibold text-sm ${
                            formData.material === material.value ? 'text-purple-200' : 'text-gray-300'
                          }`}>
                            {material.label}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View className="mb-5">
                  <View className="flex-row items-center gap-3 mb-3">
                    <View className={`w-7 h-7 rounded-lg items-center justify-center ${
                      errors.section ? 'bg-red-500/15' : formData.section ? 'bg-purple-500/15' : 'bg-gray-600/20'
                    }`}>
                      <Ionicons name="radio-outline" size={16} color={errors.section ? "#EF4444" : formData.section ? "#8B5CF6" : "#9CA3AF"} />
                    </View>
                    <Text className="text-white font-semibold text-base">
                      Seção do Cabo <Text className="text-blue-400 font-bold">*</Text>
                    </Text>
                  </View>
                  
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} className="gap-2">
                    <View className="flex-row gap-2 pr-4">
                      {getAvailableSections().map((section: number) => (
                        <TouchableOpacity
                          key={section}
                          onPress={() => updateField('section', section.toString())}
                          className={`px-4 py-3 rounded-lg border min-w-[80px] ${
                            formData.section === section.toString()
                              ? 'border-purple-500/50 bg-purple-500/20'
                              : 'border-gray-600/40 bg-gray-800/30'
                          }`}
                          activeOpacity={0.8}
                        >
                          <Text className={`font-semibold text-center ${
                            formData.section === section.toString() ? 'text-purple-200' : 'text-gray-300'
                          }`}>
                            {section}mm²
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                  
                  {errors.section && (
                    <View className="flex-row items-center gap-2 mt-2">
                      <Ionicons name="alert-circle" size={14} color="#EF4444" />
                      <Text className="text-red-400 font-medium text-sm">
                        {errors.section}
                      </Text>
                    </View>
                  )}
                </View>
              </LinearGradient>
            </View>

            {result && (
              <View className="relative mb-8">
                <LinearGradient
                  colors={result.isWithinLimit ? 
                    ['rgba(16, 185, 129, 0.08)', 'rgba(5, 150, 105, 0.04)'] :
                    ['rgba(239, 68, 68, 0.08)', 'rgba(220, 38, 38, 0.04)']
                  }
                  className={`rounded-2xl p-6 border ${
                    result.isWithinLimit ? 'border-green-500/20' : 'border-red-500/20'
                  }`}
                >
                  <View className="flex-row items-center gap-3 mb-6">
                    <View className={`w-10 h-10 rounded-xl items-center justify-center ${
                      result.isWithinLimit ? 'bg-green-500/20' : 'bg-red-500/20'
                    }`}>
                      <Ionicons 
                        name={result.isWithinLimit ? "checkmark-circle" : "warning"} 
                        size={18} 
                        color={result.isWithinLimit ? "#10B981" : "#EF4444"} 
                      />
                    </View>
                    <View>
                      <Text className={`font-bold text-lg ${
                        result.isWithinLimit ? 'text-green-300' : 'text-red-300'
                      }`}>
                        {result.isWithinLimit ? 'Dentro do Limite' : 'Acima do Limite'}
                      </Text>
                      <Text className={`font-medium text-sm ${
                        result.isWithinLimit ? 'text-green-400/60' : 'text-red-400/60'
                      }`}>
                        {result.isWithinLimit ? 'Queda aceitável (≤5%)' : 'Considere aumentar a seção'}
                      </Text>
                    </View>
                  </View>

                  <View className="flex-row gap-4 mb-6">
                    <View className="flex-1 bg-slate-800/40 rounded-xl p-4 border border-slate-700/30">
                      <Text className="text-slate-300 font-medium text-sm mb-1">Queda de Tensão</Text>
                      <Text className="text-white font-bold text-2xl">{result.voltageDrop}V</Text>
                    </View>
                    <View className="flex-1 bg-slate-800/40 rounded-xl p-4 border border-slate-700/30">
                      <Text className="text-slate-300 font-medium text-sm mb-1">Percentual</Text>
                      <Text className={`font-bold text-2xl ${
                        result.isWithinLimit ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {result.percentageDrop}%
                      </Text>
                    </View>
                  </View>

                  <View className="space-y-3">
                    <View className="flex-row justify-between items-center py-2 border-b border-slate-700/30">
                      <Text className="text-slate-300 font-medium">Resistência do cabo:</Text>
                      <Text className="text-white font-mono text-sm">{result.resistance} Ω/km</Text>
                    </View>
                    <View className="flex-row justify-between items-center py-2">
                      <Text className="text-slate-300 font-medium">Impedância total:</Text>
                      <Text className="text-white font-mono text-sm">{result.impedance} Ω</Text>
                    </View>
                  </View>

                  {!result.isWithinLimit && result.suggestedSection && (
                    <View className="mt-6 pt-6 border-t border-slate-700/30">
                      <View className="flex-row items-center gap-2 mb-4">
                        <View className="w-8 h-8 bg-green-500/20 rounded-lg items-center justify-center">
                          <Ionicons name="bulb" size={16} color="#10B981" />
                        </View>
                        <Text className="text-green-300 font-bold text-lg">
                          Sugestão de Cabo
                        </Text>
                      </View>
                      
                      <View className="bg-green-500/5 rounded-xl p-4 border border-green-500/20">
                        <View className="flex-row items-center justify-between mb-3">
                          <Text className="text-green-200 font-semibold">
                            Seção recomendada:
                          </Text>
                          <Text className="text-white font-bold text-lg">
                            {result.suggestedSection}mm²
                          </Text>
                        </View>
                        
                        <View className="flex-row gap-3">
                          <View className="flex-1 bg-slate-800/60 rounded-lg p-3">
                            <Text className="text-slate-300 text-xs mb-1">Nova queda</Text>
                            <Text className="text-white font-bold">{result.suggestedVoltageDrop}V</Text>
                          </View>
                          <View className="flex-1 bg-slate-800/60 rounded-lg p-3">
                            <Text className="text-slate-300 text-xs mb-1">Percentual</Text>
                            <Text className="text-green-400 font-bold">{result.suggestedPercentageDrop}%</Text>
                          </View>
                        </View>
                        
                        <TouchableOpacity
                          onPress={() => updateField('section', result.suggestedSection!)}
                          className="mt-4 bg-green-500/20 rounded-lg py-3 px-4 border border-green-500/30 active:scale-98"
                          activeOpacity={0.8}
                        >
                          <View className="flex-row items-center justify-center gap-2">
                            <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                            <Text className="text-green-200 font-semibold text-sm">
                              Aplicar Sugestão
                            </Text>
                          </View>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}

                  {!result.isWithinLimit && !result.suggestedSection && (
                    <View className="mt-6 pt-6 border-t border-slate-700/30">
                      <View className="flex-row items-center gap-2 mb-3">
                        <View className="w-8 h-8 bg-orange-500/20 rounded-lg items-center justify-center">
                          <Ionicons name="warning" size={16} color="#F97316" />
                        </View>
                        <Text className="text-orange-300 font-bold text-base">
                          Atenção
                        </Text>
                      </View>
                      <View className="bg-orange-500/5 rounded-xl p-4 border border-orange-500/20">
                        <Text className="text-orange-200 text-sm leading-5">
                          Nenhuma seção disponível atende ao limite de 5%. 
                          Considere reduzir a distância ou usar outro material condutor.
                        </Text>
                      </View>
                    </View>
                  )}
                </LinearGradient>
              </View>
            )}

            <View className="mb-8">
              <TouchableOpacity 
                onPress={calculateVoltageDrop}
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
                    {isCalculating ? 'Calculando...' : 'Calcular Queda de Tensão'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            <View className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/30 mb-8">
              <View className="flex-row items-center gap-2 mb-3">
                <Ionicons name="information-circle" size={16} color="#64748B" />
                <Text className="text-slate-300 font-semibold text-sm">Informações</Text>
              </View>
              <Text className="text-slate-400 text-xs leading-5">
                • Limite recomendado: 5% para circuitos terminais{'\n'}
                • Reatância considerada: 0,08 Ω/km{'\n'}
                • Cálculos baseados na NBR 5410
              </Text>
            </View>

          </View>
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
}