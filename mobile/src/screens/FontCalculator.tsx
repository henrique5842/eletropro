import { SafeAreaView, View, TouchableOpacity, Text, ScrollView, TextInput, Animated } from "react-native";
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useState, useRef, useEffect, useCallback } from 'react';

const LED_STRIP_TYPES = [
  { value: '4.8', label: '4.8 W/m', description: 'Básica - 60 LEDs/m' },
  { value: '7.2', label: '7.2 W/m', description: 'Média - 60 LEDs/m' },
  { value: '9.6', label: '9.6 W/m', description: 'Alta - 120 LEDs/m' },
  { value: '14.4', label: '14.4 W/m', description: 'Premium - 120 LEDs/m' },
  { value: '19.2', label: '19.2 W/m', description: 'Profissional - 240 LEDs/m' },
  { value: '24', label: '24 W/m', description: 'Ultra - 240 LEDs/m' },
  { value: 'custom', label: 'Personalizado', description: 'Inserir valor manual' }
];

const VOLTAGES = [
  { value: '12', label: '12V', icon: 'flash' },
  { value: '24', label: '24V', icon: 'flash-outline' }
];

const SAFETY_MARGINS = [
  { value: '1.2', label: '20%', description: 'Padrão' },
  { value: '1.25', label: '25%', description: 'Recomendado' },
  { value: '1.3', label: '30%', description: 'Conservador' }
];

const COMMERCIAL_SOURCES_12V = [
  { power: 36, current: 3, label: '12V 3A (36W)' },
  { power: 60, current: 5, label: '12V 5A (60W)' },
  { power: 96, current: 8, label: '12V 8A (96W)' },
  { power: 120, current: 10, label: '12V 10A (120W)' },
  { power: 150, current: 12.5, label: '12V 12.5A (150W)' },
  { power: 180, current: 15, label: '12V 15A (180W)' },
  { power: 240, current: 20, label: '12V 20A (240W)' },
  { power: 360, current: 30, label: '12V 30A (360W)' }
];

const COMMERCIAL_SOURCES_24V = [
  { power: 60, current: 2.5, label: '24V 2.5A (60W)' },
  { power: 96, current: 4, label: '24V 4A (96W)' },
  { power: 150, current: 6.25, label: '24V 6.25A (150W)' },
  { power: 192, current: 8, label: '24V 8A (192W)' },
  { power: 240, current: 10, label: '24V 10A (240W)' },
  { power: 300, current: 12.5, label: '24V 12.5A (300W)' },
  { power: 480, current: 20, label: '24V 20A (480W)' },
  { power: 600, current: 25, label: '24V 25A (600W)' }
];

interface FormData {
  voltage: string;
  powerPerMeter: string;
  customPowerPerMeter: string;
  totalLength: string;
  numberOfRuns: string;
  safetyMargin: string;
  hasDimmer: boolean;
}

interface FormErrors {
  [key: string]: string | null;
}

interface CalculationResult {
  totalPower: number;
  powerWithMargin: number;
  requiredCurrent: number;
  suggestedSource: {
    power: number;
    current: number;
    label: string;
  } | null;
  alternativeSources: Array<{
    power: number;
    current: number;
    label: string;
  }>;
  cableRecommendations: {
    lowCurrent: string;
    mediumCurrent: string;
    highCurrent: string;
  };
}

export function FontCalculator() {
  const [formData, setFormData] = useState<FormData>({
    voltage: '12',
    powerPerMeter: '14.4',
    customPowerPerMeter: '',
    totalLength: '',
    numberOfRuns: '1',
    safetyMargin: '1.25',
    hasDimmer: false
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
    
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  }, [errors]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    const powerPerMeter = formData.powerPerMeter === 'custom' 
      ? parseFloat(formData.customPowerPerMeter)
      : parseFloat(formData.powerPerMeter);

    if (!powerPerMeter || powerPerMeter <= 0) {
      if (formData.powerPerMeter === 'custom') {
        newErrors.customPowerPerMeter = 'Potência por metro deve ser maior que 0';
      } else {
        newErrors.powerPerMeter = 'Selecione a potência por metro';
      }
    }

    if (!formData.totalLength || parseFloat(formData.totalLength) <= 0) {
      newErrors.totalLength = 'Comprimento deve ser maior que 0';
    }

    const numberOfRuns = parseInt(formData.numberOfRuns);
    if (!numberOfRuns || numberOfRuns <= 0) {
      newErrors.numberOfRuns = 'Número de runs deve ser maior que 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const calculateSource = async (): Promise<void> => {
    if (!validateForm()) return;

    setIsCalculating(true);
    
    setTimeout(() => {
      const voltage = parseFloat(formData.voltage);
      const powerPerMeter = formData.powerPerMeter === 'custom' 
        ? parseFloat(formData.customPowerPerMeter)
        : parseFloat(formData.powerPerMeter);
      const totalLength = parseFloat(formData.totalLength);
      const safetyMargin = parseFloat(formData.safetyMargin);
      
      let totalPower = powerPerMeter * totalLength;
      
      let powerWithMargin = totalPower * safetyMargin;
      
      if (formData.hasDimmer) {
        powerWithMargin = powerWithMargin * 1.2;
      }
      
      const requiredCurrent = powerWithMargin / voltage;
      
      const availableSources = voltage === 12 ? COMMERCIAL_SOURCES_12V : COMMERCIAL_SOURCES_24V;
      
      const suggestedSource = availableSources.find(source => 
        source.power >= powerWithMargin && source.current >= requiredCurrent
      );
      
      const alternativeSources = availableSources
        .filter(source => source.power >= powerWithMargin * 0.9)
        .slice(0, 3);

      const cableRecommendations = {
        lowCurrent: requiredCurrent <= 5 ? '1.0 mm²' : '1.5 mm²',
        mediumCurrent: requiredCurrent <= 10 ? '1.5 mm²' : '2.5 mm²',
        highCurrent: requiredCurrent > 15 ? '4.0 mm²' : '2.5 mm²'
      };

      setResult({
        totalPower,
        powerWithMargin,
        requiredCurrent,
        suggestedSource: suggestedSource || null,
        alternativeSources,
        cableRecommendations
      });

      setIsCalculating(false);
    }, 800);
  };

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
  }: {
    label: string;
    value: string;
    onChangeText: (text: string) => void;
    placeholder: string;
    icon: keyof typeof Ionicons.glyphMap;
    keyboardType?: 'default' | 'numeric' | 'decimal-pad';
    required?: boolean;
    error?: string | null;
    disabled?: boolean;
  }) => (
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
                <Text className="text-white font-bold text-sm">CALCULADORA FITA LED</Text>
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
                      Tensão de Trabalho
                    </Text>
                    <Text className="text-amber-400/60 font-medium text-sm">
                      Selecione 12V ou 24V
                    </Text>
                  </View>
                </View>

                <View className="flex-row gap-3">
                  {VOLTAGES.map((voltage) => (
                    <TouchableOpacity
                      key={voltage.value}
                      onPress={() => updateField('voltage', voltage.value)}
                      className={`flex-1 p-4 rounded-xl border ${
                        formData.voltage === voltage.value
                          ? 'border-amber-500/50 bg-amber-500/10'
                          : 'border-gray-600/40 bg-gray-800/20'
                      }`}
                      activeOpacity={0.8}
                    >
                      <View className="items-center gap-2">
                        <View className={`w-8 h-8 rounded-lg items-center justify-center ${
                          formData.voltage === voltage.value ? 'bg-amber-500/20' : 'bg-gray-600/20'
                        }`}>
                          <Ionicons 
                            name={voltage.icon as keyof typeof Ionicons.glyphMap} 
                            size={16} 
                            color={formData.voltage === voltage.value ? "#F59E0B" : "#9CA3AF"} 
                          />
                        </View>
                        <Text className={`font-semibold text-base ${
                          formData.voltage === voltage.value ? 'text-amber-200' : 'text-gray-300'
                        }`}>
                          {voltage.label}
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
                    <Ionicons name="speedometer" size={18} color="#3B82F6" />
                  </View>
                  <View>
                    <Text className="text-blue-300 font-bold text-lg">
                      Potência por Metro
                    </Text>
                    <Text className="text-blue-400/60 font-medium text-sm">
                      Especificação da fita LED
                    </Text>
                  </View>
                </View>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="gap-2 mb-4">
                  <View className="flex-row gap-2 pr-4">
                    {LED_STRIP_TYPES.map((type) => (
                      <TouchableOpacity
                        key={type.value}
                        onPress={() => updateField('powerPerMeter', type.value)}
                        className={`px-4 py-3 rounded-xl border min-w-[100px] ${
                          formData.powerPerMeter === type.value
                            ? 'border-blue-500/50 bg-blue-500/10'
                            : 'border-gray-600/40 bg-gray-800/20'
                        }`}
                        activeOpacity={0.8}
                      >
                        <Text className={`font-semibold text-center text-sm mb-1 ${
                          formData.powerPerMeter === type.value ? 'text-blue-200' : 'text-gray-300'
                        }`}>
                          {type.label}
                        </Text>
                        <Text className={`text-xs text-center ${
                          formData.powerPerMeter === type.value ? 'text-blue-300/70' : 'text-gray-400'
                        }`}>
                          {type.description}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>

                {formData.powerPerMeter === 'custom' && (
                  <InputField
                    label="Potência Personalizada"
                    value={formData.customPowerPerMeter}
                    onChangeText={(text) => updateField('customPowerPerMeter', text)}
                    placeholder="Ex: 18.5"
                    icon="create-outline"
                    keyboardType="decimal-pad"
                    required
                    error={errors.customPowerPerMeter}
                  />
                )}
              </LinearGradient>
            </View>

            <View className="relative mb-8">
              <LinearGradient
                colors={['rgba(139, 92, 246, 0.08)', 'rgba(124, 58, 237, 0.04)']}
                className="rounded-2xl p-6 border border-purple-500/20"
              >
                <View className="flex-row items-center gap-3 mb-6">
                  <View className="w-10 h-10 bg-purple-500/20 rounded-xl items-center justify-center">
                    <Ionicons name="resize" size={18} color="#8B5CF6" />
                  </View>
                  <View>
                    <Text className="text-purple-300 font-bold text-lg">
                      Dimensões da Instalação
                    </Text>
                    <Text className="text-purple-400/60 font-medium text-sm">
                      Comprimento e configuração
                    </Text>
                  </View>
                </View>

                <View className="flex-row gap-3 mb-5">
                  <View className="flex-1">
                    <InputField
                      label="Comprimento Total"
                      value={formData.totalLength}
                      onChangeText={(text) => updateField('totalLength', text)}
                      placeholder="Ex: 10"
                      icon="swap-horizontal-outline"
                      keyboardType="decimal-pad"
                      required
                      error={errors.totalLength}
                    />
                  </View>
                  <View className="flex-1">
                    <InputField
                      label="Número de Runs"
                      value={formData.numberOfRuns}
                      onChangeText={(text) => updateField('numberOfRuns', text)}
                      placeholder="1, 2, 3..."
                      icon="git-branch-outline"
                      keyboardType="numeric"
                      required
                      error={errors.numberOfRuns}
                    />
                  </View>
                </View>
              </LinearGradient>
            </View>

            <View className="relative mb-8">
              <LinearGradient
                colors={['rgba(16, 185, 129, 0.08)', 'rgba(5, 150, 105, 0.04)']}
                className="rounded-2xl p-6 border border-green-500/20"
              >
                <View className="flex-row items-center gap-3 mb-6">
                  <View className="w-10 h-10 bg-green-500/20 rounded-xl items-center justify-center">
                    <Ionicons name="settings" size={18} color="#10B981" />
                  </View>
                  <View>
                    <Text className="text-green-300 font-bold text-lg">
                      Configurações Avançadas
                    </Text>
                    <Text className="text-green-400/60 font-medium text-sm">
                      Margem de segurança e controles
                    </Text>
                  </View>
                </View>

                <View className="mb-5">
                  <View className="flex-row items-center gap-3 mb-3">
                    <View className="w-7 h-7 rounded-lg items-center justify-center bg-green-500/15">
                      <Ionicons name="shield-checkmark-outline" size={16} color="#10B981" />
                    </View>
                    <Text className="text-white font-semibold text-base">
                      Margem de Segurança <Text className="text-blue-400 font-bold">*</Text>
                    </Text>
                  </View>
                  
                  <View className="flex-row gap-3">
                    {SAFETY_MARGINS.map((margin) => (
                      <TouchableOpacity
                        key={margin.value}
                        onPress={() => updateField('safetyMargin', margin.value)}
                        className={`flex-1 p-3 rounded-xl border ${
                          formData.safetyMargin === margin.value
                            ? 'border-green-500/50 bg-green-500/10'
                            : 'border-gray-600/40 bg-gray-800/20'
                        }`}
                        activeOpacity={0.8}
                      >
                        <View className="items-center gap-1">
                          <Text className={`font-bold text-base ${
                            formData.safetyMargin === margin.value ? 'text-green-200' : 'text-gray-300'
                          }`}>
                            {margin.label}
                          </Text>
                          <Text className={`text-xs ${
                            formData.safetyMargin === margin.value ? 'text-green-300/70' : 'text-gray-400'
                          }`}>
                            {margin.description}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <TouchableOpacity
                  onPress={() => updateField('hasDimmer', !formData.hasDimmer)}
                  className={`flex-row items-center gap-4 p-4 rounded-xl border ${
                    formData.hasDimmer
                      ? 'border-green-500/50 bg-green-500/10'
                      : 'border-gray-600/40 bg-gray-800/20'
                  }`}
                  activeOpacity={0.8}
                >
                  <View className={`w-8 h-8 rounded-lg items-center justify-center ${
                    formData.hasDimmer ? 'bg-green-500/20' : 'bg-gray-600/20'
                  }`}>
                    <Ionicons 
                      name={formData.hasDimmer ? "checkmark-circle" : "radio-button-off"} 
                      size={18} 
                      color={formData.hasDimmer ? "#10B981" : "#9CA3AF"} 
                    />
                  </View>
                  <View className="flex-1">
                    <Text className={`font-semibold text-base ${
                      formData.hasDimmer ? 'text-green-200' : 'text-gray-300'
                    }`}>
                      Usar Dimmer PWM
                    </Text>
                    <Text className={`text-sm ${
                      formData.hasDimmer ? 'text-green-300/70' : 'text-gray-400'
                    }`}>
                      Adiciona +20% para picos de corrente
                    </Text>
                  </View>
                </TouchableOpacity>
              </LinearGradient>
            </View>

            {result && (
              <View className="relative mb-8">
                <LinearGradient
                  colors={result.suggestedSource ? 
                    ['rgba(16, 185, 129, 0.08)', 'rgba(5, 150, 105, 0.04)'] :
                    ['rgba(239, 68, 68, 0.08)', 'rgba(220, 38, 38, 0.04)']
                  }
                  className={`rounded-2xl p-6 border ${
                    result.suggestedSource ? 'border-green-500/20' : 'border-red-500/20'
                  }`}
                >
                  <View className="flex-row items-center gap-3 mb-6">
                    <View className={`w-10 h-10 rounded-xl items-center justify-center ${
                      result.suggestedSource ? 'bg-green-500/20' : 'bg-red-500/20'
                    }`}>
                      <Ionicons 
                        name={result.suggestedSource ? "checkmark-circle" : "warning"} 
                        size={18} 
                        color={result.suggestedSource ? "#10B981" : "#EF4444"} 
                      />
                    </View>
                    <View>
                      <Text className={`font-bold text-lg ${
                        result.suggestedSource ? 'text-green-300' : 'text-red-300'
                      }`}>
                        {result.suggestedSource ? 'Fonte Encontrada!' : 'Atenção Necessária'}
                      </Text>
                      <Text className={`font-medium text-sm ${
                        result.suggestedSource ? 'text-green-400/60' : 'text-red-400/60'
                      }`}>
                        {result.suggestedSource ? 'Configuração adequada' : 'Verifique as especificações'}
                      </Text>
                    </View>
                  </View>

                  <View className="space-y-4 mb-6">
                    <View className="flex-row gap-3">
                      <View className="flex-1 bg-slate-800/40 rounded-xl p-4 border border-slate-700/30">
                        <Text className="text-slate-300 font-medium text-sm mb-1">Potência Total</Text>
                        <Text className="text-white font-bold text-xl">{result.totalPower.toFixed(1)}W</Text>
                      </View>
                      <View className="flex-1 bg-slate-800/40 rounded-xl p-4 border border-slate-700/30">
                        <Text className="text-slate-300 font-medium text-sm mb-1">Com Margem</Text>
                        <Text className="text-blue-400 font-bold text-xl">{result.powerWithMargin.toFixed(1)}W</Text>
                      </View>
                    </View>

                    <View className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/30 mt-3">
                      <Text className="text-slate-300 font-medium text-sm mb-1">Corrente Necessária</Text>
                      <Text className="text-yellow-400 font-bold text-2xl">{result.requiredCurrent.toFixed(2)}A</Text>
                    </View>
                  </View>

                  {result.suggestedSource && (
                    <View className="mb-6">
                      <View className="flex-row items-center gap-2 mb-4">
                        <View className="w-8 h-8 bg-green-500/20 rounded-lg items-center justify-center">
                          <Ionicons name="flash" size={16} color="#10B981" />
                        </View>
                        <Text className="text-green-300 font-bold text-lg">
                          Fonte Recomendada
                        </Text>
                      </View>
                      
                      <View className="bg-green-500/10 rounded-xl p-4 border border-green-500/30">
                        <Text className="text-green-200 font-bold text-xl mb-2">
                          {result.suggestedSource.label}
                        </Text>
                        <View className="flex-row justify-between items-center">
                          <Text className="text-green-300/80 text-sm">
                            Potência: {result.suggestedSource.power}W
                          </Text>
                          <Text className="text-green-300/80 text-sm">
                            Corrente: {result.suggestedSource.current}A
                          </Text>
                        </View>
                      </View>
                    </View>
                  )}

                  {result.alternativeSources.length > 0 && (
                    <View className="mb-6">
                      <View className="flex-row items-center gap-2 mb-4">
                        <View className="w-8 h-8 bg-blue-500/20 rounded-lg items-center justify-center">
                          <Ionicons name="options" size={16} color="#3B82F6" />
                        </View>
                        <Text className="text-blue-300 font-bold text-base">
                          Outras Opções
                        </Text>
                      </View>
                      
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="gap-3">
                        <View className="flex-row gap-3 pr-4">
                          {result.alternativeSources.slice(0, 4).map((source, index) => (
                            <View key={index} className="bg-slate-800/60 rounded-lg p-3 border border-slate-600/30 min-w-[140px]">
                              <Text className="text-white font-semibold text-sm mb-1">
                                {source.label}
                              </Text>
                              <Text className="text-slate-300 text-xs">
                                {source.power}W • {source.current}A
                              </Text>
                            </View>
                          ))}
                        </View>
                      </ScrollView>
                    </View>
                  )}

                  <View className="mb-6">
                    <View className="flex-row items-center gap-2 mb-4">
                      <View className="w-8 h-8 bg-purple-500/20 rounded-lg items-center justify-center">
                        <Ionicons name="git-branch" size={16} color="#8B5CF6" />
                      </View>
                      <Text className="text-purple-300 font-bold text-base">
                        Bitola de Cabo Recomendada
                      </Text>
                    </View>
                    
                    <View className="bg-purple-500/5 rounded-xl p-4 border border-purple-500/20">
                      <View className="space-y-3">
                        <View className="flex-row justify-between items-center">
                          <Text className="text-purple-200 font-medium">Até 5A:</Text>
                          <Text className="text-white font-bold">{result.cableRecommendations.lowCurrent}</Text>
                        </View>
                        <View className="flex-row justify-between items-center">
                          <Text className="text-purple-200 font-medium">5A - 15A:</Text>
                          <Text className="text-white font-bold">{result.cableRecommendations.mediumCurrent}</Text>
                        </View>
                        <View className="flex-row justify-between items-center">
                          <Text className="text-purple-200 font-medium">Acima de 15A:</Text>
                          <Text className="text-white font-bold">{result.cableRecommendations.highCurrent}</Text>
                        </View>
                      </View>
                      
                      <View className="mt-4 pt-4 border-t border-purple-500/20">
                        <Text className="text-purple-300/70 text-xs leading-5">
                          Para sua corrente de {result.requiredCurrent.toFixed(2)}A, recomendamos: {' '}
                          <Text className="text-purple-200 font-semibold">
                            {result.requiredCurrent <= 5 ? result.cableRecommendations.lowCurrent :
                             result.requiredCurrent <= 15 ? result.cableRecommendations.mediumCurrent :
                             result.cableRecommendations.highCurrent}
                          </Text>
                        </Text>
                      </View>
                    </View>
                  </View>

                  {!result.suggestedSource && (
                    <View className="bg-red-500/5 rounded-xl p-4 border border-red-500/20">
                      <View className="flex-row items-center gap-2 mb-3">
                        <View className="w-8 h-8 bg-red-500/20 rounded-lg items-center justify-center">
                          <Ionicons name="warning" size={16} color="#EF4444" />
                        </View>
                        <Text className="text-red-300 font-bold text-base">
                          Fonte Não Encontrada
                        </Text>
                      </View>
                      <Text className="text-red-200 text-sm leading-5 mb-4">
                        Não encontramos uma fonte comercial padrão para sua necessidade de {result.powerWithMargin.toFixed(1)}W / {result.requiredCurrent.toFixed(2)}A.
                      </Text>
                      
                      <View className="space-y-2">
                        <Text className="text-red-300 font-semibold text-sm">Sugestões:</Text>
                        <Text className="text-red-200/80 text-xs">• Reduzir o comprimento da fita</Text>
                        <Text className="text-red-200/80 text-xs">• Dividir em múltiplos circuitos</Text>
                        <Text className="text-red-200/80 text-xs">• Considerar fita com menor potência/metro</Text>
                        <Text className="text-red-200/80 text-xs">• Buscar fonte personalizada/industrial</Text>
                      </View>
                    </View>
                  )}
                </LinearGradient>
              </View>
            )}

            <View className="mb-8">
              <TouchableOpacity 
                onPress={calculateSource}
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
                    {isCalculating ? 'Calculando...' : 'Calcular Fonte Necessária'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            <View className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/30 mb-8">
              <View className="flex-row items-center gap-2 mb-3">
                <Ionicons name="bulb" size={16} color="#F59E0B" />
                <Text className="text-amber-300 font-semibold text-sm">Exemplo Prático</Text>
              </View>
              <Text className="text-slate-300 text-xs leading-5">
                Fita 14.4W/m, 5m, 12V:
                Potência total: 72W
                Com margem 25%: 90W
                Corrente: 7.5A
                Fonte sugerida: 12V 10A (120W)
              </Text>
            </View>

            <View className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/30 mb-8">
              <View className="flex-row items-center gap-2 mb-3">
                <Ionicons name="information-circle" size={16} color="#64748B" />
                <Text className="text-slate-300 font-semibold text-sm">Dicas Importantes</Text>
              </View>
              <Text className="text-slate-400 text-xs leading-5">
                • Sempre use margem de segurança de 20-30%
                • Dimmers PWM geram picos de corrente
                • Para distâncias maiores, prefira 24V
                • Use fusível entre fonte e fita
                • Fontes certificadas são mais seguras
              </Text>
            </View>

          </View>
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
}