import { SafeAreaView, View, TouchableOpacity, Text, ScrollView, TextInput, Animated } from "react-native";
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useState, useRef, useEffect, useCallback } from 'react';

const REGIONAL_TARIFFS = {
  'sudeste': { name: 'Sudeste', tariff: 0.92 },
  'sul': { name: 'Sul', tariff: 0.89 },
  'nordeste': { name: 'Nordeste', tariff: 0.87 },
  'norte': { name: 'Norte', tariff: 0.85 },
  'centro-oeste': { name: 'Centro-Oeste', tariff: 0.94 },
  'custom': { name: 'Personalizada', tariff: 0 }
};

const APPLIANCE_CATEGORIES = [
  {
    category: 'Iluminação',
    icon: 'bulb',
    color: 'amber',
    appliances: [
      { name: 'Lâmpada LED', power: 12 },
      { name: 'Lâmpada Fluorescente', power: 20 },
      { name: 'Lâmpada Incandescente', power: 60 },
      { name: 'Refletor LED', power: 50 }
    ]
  },
  {
    category: 'Climatização',
    icon: 'snow',
    color: 'blue',
    appliances: [
      { name: 'Ar Condicionado 9000 BTU', power: 900 },
      { name: 'Ar Condicionado 12000 BTU', power: 1200 },
      { name: 'Ar Condicionado 18000 BTU', power: 1800 },
      { name: 'Ventilador de Teto', power: 100 },
      { name: 'Ventilador de Mesa', power: 60 }
    ]
  },
  {
    category: 'Eletrodomésticos',
    icon: 'home',
    color: 'green',
    appliances: [
      { name: 'Geladeira', power: 150 },
      { name: 'Micro-ondas', power: 1200 },
      { name: 'Máquina de Lavar', power: 500 },
      { name: 'Ferro de Passar', power: 1000 },
      { name: 'Chuveiro Elétrico', power: 5500 },
      { name: 'Televisão LED 32"', power: 80 },
      { name: 'Televisão LED 55"', power: 150 }
    ]
  },
  {
    category: 'Escritório',
    icon: 'desktop',
    color: 'purple',
    appliances: [
      { name: 'Notebook', power: 65 },
      { name: 'Desktop', power: 300 },
      { name: 'Monitor', power: 25 },
      { name: 'Impressora', power: 15 }
    ]
  }
];

interface FormData {
  applianceName: string;
  power: string;
  hoursPerDay: string;
  minutesPerDay: string;
  daysPerMonth: string;
  region: string;
  customTariff: string;
}

interface FormErrors {
  [key: string]: string | null;
}

interface CalculationResult {
  dailyConsumption: string;
  monthlyConsumption: string;
  monthlyCost: string;
  tariffUsed: string;
  yearlyConsumption: string;
  yearlyCost: string;
}

export function EnergyCalculator() {
  const [formData, setFormData] = useState<FormData>({
    applianceName: '',
    power: '',
    hoursPerDay: '',
    minutesPerDay: '',
    daysPerMonth: '30',
    region: 'sudeste',
    customTariff: ''
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const [showAppliances, setShowAppliances] = useState<boolean>(false);
  
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
  }, [errors]);

  const selectAppliance = (appliance: { name: string; power: number }) => {
    setFormData(prev => ({
      ...prev,
      applianceName: appliance.name,
      power: appliance.power.toString()
    }));
    setShowAppliances(false);
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.power || parseFloat(formData.power) <= 0) {
      newErrors.power = 'Potência deve ser maior que 0';
    }

    const hours = parseFloat(formData.hoursPerDay) || 0;
    const minutes = parseFloat(formData.minutesPerDay) || 0;
    const totalHours = hours + (minutes / 60);

    if (hours < 0 || hours > 24) {
      newErrors.hoursPerDay = 'Horas deve estar entre 0 e 24';
    }

    if (minutes < 0 || minutes >= 60) {
      newErrors.minutesPerDay = 'Minutos deve estar entre 0 e 59';
    }

    if (totalHours <= 0 || totalHours > 24) {
      if (totalHours > 24) {
        newErrors.hoursPerDay = 'Total não pode exceder 24 horas por dia';
      } else {
        newErrors.hoursPerDay = 'Informe pelo menos alguns minutos de uso';
      }
    }

    if (!formData.daysPerMonth || parseFloat(formData.daysPerMonth) <= 0 || parseFloat(formData.daysPerMonth) > 31) {
      newErrors.daysPerMonth = 'Dias por mês deve estar entre 1 e 31';
    }

    if (formData.region === 'custom' && (!formData.customTariff || parseFloat(formData.customTariff) <= 0)) {
      newErrors.customTariff = 'Tarifa personalizada deve ser maior que 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const calculateConsumption = async (): Promise<void> => {
    if (!validateForm()) return;

    setIsCalculating(true);
    
    setTimeout(() => {
      const power = parseFloat(formData.power);
      const hours = parseFloat(formData.hoursPerDay) || 0;
      const minutes = parseFloat(formData.minutesPerDay) || 0;
      const totalHoursPerDay = hours + (minutes / 60);
      const daysPerMonth = parseFloat(formData.daysPerMonth);
      
      let tariff: number;
      if (formData.region === 'custom') {
        tariff = parseFloat(formData.customTariff);
      } else {
        tariff = REGIONAL_TARIFFS[formData.region as keyof typeof REGIONAL_TARIFFS].tariff;
      }

      const dailyConsumption = (power * totalHoursPerDay) / 1000;
      const monthlyConsumption = dailyConsumption * daysPerMonth;
      const monthlyCost = monthlyConsumption * tariff;
      const yearlyConsumption = monthlyConsumption * 12;
      const yearlyCost = monthlyCost * 12;

      setResult({
        dailyConsumption: dailyConsumption.toFixed(3),
        monthlyConsumption: monthlyConsumption.toFixed(2),
        monthlyCost: monthlyCost.toFixed(2),
        tariffUsed: tariff.toFixed(3),
        yearlyConsumption: yearlyConsumption.toFixed(2),
        yearlyCost: yearlyCost.toFixed(2)
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
    disabled?: boolean;
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
    disabled = false,
    unit
  }: InputFieldProps) => (
    <View className="mb-5">
      <View className="flex-row items-center gap-3 mb-3">
        <View className={`w-7 h-7 rounded-lg items-center justify-center ${
          error ? 'bg-red-500/15' : value ? 'bg-green-500/15' : 'bg-gray-600/20'
        }`}>
          <Ionicons name={icon} size={16} color={error ? "#EF4444" : value ? "#10B981" : "#9CA3AF"} />
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
            value ? 'border-green-500/50 bg-green-500/5' : 'border-gray-600/30 bg-gray-800/40'
          } ${unit ? 'pr-16' : ''}`}
        />
        
        {unit && (
          <View className="absolute right-4 top-1/2 -translate-y-2">
            <Text className="text-gray-400 font-semibold text-sm">{unit}</Text>
          </View>
        )}
        
        {value && !error && !disabled && !unit && (
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

  const getColorClasses = (color: string) => {
    const colors = {
      amber: {
        bg: 'bg-amber-500/20',
        border: 'border-amber-500/30',
        text: 'text-amber-300',
        icon: '#F59E0B'
      },
      blue: {
        bg: 'bg-blue-500/20',
        border: 'border-blue-500/30', 
        text: 'text-blue-300',
        icon: '#3B82F6'
      },
      green: {
        bg: 'bg-green-500/20',
        border: 'border-green-500/30',
        text: 'text-green-300', 
        icon: '#10B981'
      },
      purple: {
        bg: 'bg-purple-500/20',
        border: 'border-purple-500/30',
        text: 'text-purple-300',
        icon: '#8B5CF6'
      }
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

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
              >
                <Ionicons name="chevron-back" size={18} color="#60A5FA" />
              </TouchableOpacity>
              
              <View className="flex-1 items-center">
                <Text className="text-white font-bold text-sm">CONSUMO ENERGÉTICO</Text>
                <View className="w-16 h-0.5 bg-green-500 rounded-full mt-1" />
              </View>

              <View className="w-10 h-10" />
            </View>
          </View>

          <View className="px-6">
            
            <View className="relative mb-8">
              <LinearGradient
                colors={['rgba(16, 185, 129, 0.08)', 'rgba(5, 150, 105, 0.04)']}
                className="rounded-2xl p-6 border border-green-500/20"
              >
                <TouchableOpacity
                  onPress={() => setShowAppliances(!showAppliances)}
                  className="flex-row items-center justify-between mb-4"
                  activeOpacity={0.8}
                >
                  <View className="flex-row items-center gap-3">
                    <View className="w-10 h-10 bg-green-500/20 rounded-xl items-center justify-center">
                      <Ionicons name="grid" size={18} color="#10B981" />
                    </View>
                    <View>
                      <Text className="text-green-300 font-bold text-lg">
                        Aparelhos Comuns
                      </Text>
                      <Text className="text-green-400/60 font-medium text-sm">
                        Selecione um aparelho com potência típica
                      </Text>
                    </View>
                  </View>
                  <Ionicons 
                    name={showAppliances ? "chevron-up" : "chevron-down"} 
                    size={20} 
                    color="#10B981" 
                  />
                </TouchableOpacity>

                {showAppliances && (
                  <View className="space-y-4">
                    {APPLIANCE_CATEGORIES.map((category) => {
                      const colorClasses = getColorClasses(category.color);
                      return (
                        <View key={category.category} className="space-y-2">
                          <View className="flex-row items-center gap-2">
                            <View className={`w-6 h-6 rounded-lg items-center justify-center ${colorClasses.bg}`}>
                              <Ionicons name={category.icon as keyof typeof Ionicons.glyphMap} size={14} color={colorClasses.icon} />
                            </View>
                            <Text className={`font-semibold text-sm ${colorClasses.text}`}>
                              {category.category}
                            </Text>
                          </View>
                          <View className="flex-row flex-wrap gap-2">
                            {category.appliances.map((appliance) => (
                              <TouchableOpacity
                                key={appliance.name}
                                onPress={() => selectAppliance(appliance)}
                                className={`px-3 py-2 rounded-lg border ${colorClasses.border} ${colorClasses.bg} active:scale-95`}
                                activeOpacity={0.8}
                              >
                                <Text className="text-white font-medium text-xs text-center">
                                  {appliance.name}
                                </Text>
                                <Text className="text-gray-300 font-mono text-xs text-center">
                                  {appliance.power}W
                                </Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                        </View>
                      );
                    })}
                  </View>
                )}
              </LinearGradient>
            </View>

            <View className="relative mb-8">
              <LinearGradient
                colors={['rgba(59, 130, 246, 0.08)', 'rgba(30, 64, 175, 0.04)']}
                className="rounded-2xl p-6 border border-blue-500/20"
              >
                <View className="flex-row items-center gap-3 mb-6">
                  <View className="w-10 h-10 bg-blue-500/20 rounded-xl items-center justify-center">
                    <Ionicons name="settings" size={18} color="#3B82F6" />
                  </View>
                  <View>
                    <Text className="text-blue-300 font-bold text-lg">
                      Dados do Aparelho
                    </Text>
                    <Text className="text-blue-400/60 font-medium text-sm">
                      Informações sobre o equipamento
                    </Text>
                  </View>
                </View>

                <InputField
                  label="Nome do Aparelho"
                  value={formData.applianceName}
                  onChangeText={(text) => updateField('applianceName', text)}
                  placeholder="Ex: Ar condicionado, geladeira..."
                  icon="home-outline"
                />

                <InputField
                  label="Potência"
                  value={formData.power}
                  onChangeText={(text) => updateField('power', text)}
                  placeholder="1200"
                  icon="flash-outline"
                  keyboardType="decimal-pad"
                  required
                  error={errors.power}
                  unit="W"
                />
              </LinearGradient>
            </View>

            <View className="relative mb-8">
              <LinearGradient
                colors={['rgba(245, 158, 11, 0.08)', 'rgba(217, 119, 6, 0.04)']}
                className="rounded-2xl p-6 border border-amber-500/20"
              >
                <View className="flex-row items-center gap-3 mb-6">
                  <View className="w-10 h-10 bg-amber-500/20 rounded-xl items-center justify-center">
                    <Ionicons name="time" size={18} color="#F59E0B" />
                  </View>
                  <View>
                    <Text className="text-amber-300 font-bold text-lg">
                      Padrão de Uso
                    </Text>
                    <Text className="text-amber-400/60 font-medium text-sm">
                      Tempo de funcionamento
                    </Text>
                  </View>
                </View>

                <View className="flex-row gap-3">
                  <View className="flex-1">
                    <InputField
                      label="Horas por Dia"
                      value={formData.hoursPerDay}
                      onChangeText={(text) => updateField('hoursPerDay', text)}
                      placeholder="8"
                      icon="time-outline"
                      keyboardType="numeric"
                      error={errors.hoursPerDay}
                      unit="h"
                    />
                  </View>
                  <View className="flex-1">
                    <InputField
                      label="Minutos por Dia"
                      value={formData.minutesPerDay}
                      onChangeText={(text) => updateField('minutesPerDay', text)}
                      placeholder="30"
                      icon="timer-outline"
                      keyboardType="numeric"
                      error={errors.minutesPerDay}
                      unit="min"
                    />
                  </View>
                </View>

                <View>
                  <InputField
                    label="Dias por Mês"
                    value={formData.daysPerMonth}
                    onChangeText={(text) => updateField('daysPerMonth', text)}
                    placeholder="30"
                    icon="calendar-outline"
                    keyboardType="decimal-pad"
                    required
                    error={errors.daysPerMonth}
                    unit="dias"
                  />
                </View>
              </LinearGradient>
            </View>

            <View className="relative mb-8">
              <LinearGradient
                colors={['rgba(139, 92, 246, 0.08)', 'rgba(124, 58, 237, 0.04)']}
                className="rounded-2xl p-6 border border-purple-500/20"
              >
                <View className="flex-row items-center gap-3 mb-6">
                  <View className="w-10 h-10 bg-purple-500/20 rounded-xl items-center justify-center">
                    <Ionicons name="cash" size={18} color="#8B5CF6" />
                  </View>
                  <View>
                    <Text className="text-purple-300 font-bold text-lg">
                      Tarifa de Energia
                    </Text>
                    <Text className="text-purple-400/60 font-medium text-sm">
                      Valor cobrado pela distribuidora
                    </Text>
                  </View>
                </View>

                <View className="mb-5">
                  <View className="flex-row items-center gap-3 mb-3">
                    <View className="w-7 h-7 rounded-lg items-center justify-center bg-purple-500/15">
                      <Ionicons name="location-outline" size={16} color="#8B5CF6" />
                    </View>
                    <Text className="text-white font-semibold text-base">
                      Região <Text className="text-blue-400 font-bold">*</Text>
                    </Text>
                  </View>
                  
                  <View className="space-y-2">
                    {Object.entries(REGIONAL_TARIFFS).map(([key, data]) => (
                      <TouchableOpacity
                        key={key}
                        onPress={() => updateField('region', key)}
                        className={`p-4 rounded-xl border flex-row items-center justify-between ${
                          formData.region === key
                            ? 'border-purple-500/50 bg-purple-500/10'
                            : 'border-gray-600/40 bg-gray-800/20'
                        }`}
                        activeOpacity={0.8}
                      >
                        <Text className={`font-semibold ${
                          formData.region === key ? 'text-purple-200' : 'text-gray-300'
                        }`}>
                          {data.name}
                        </Text>
                        {key !== 'custom' && (
                          <Text className={`font-mono text-sm ${
                            formData.region === key ? 'text-purple-300' : 'text-gray-400'
                          }`}>
                            R$ {data.tariff.toFixed(3)}/kWh
                          </Text>
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {formData.region === 'custom' && (
                  <InputField
                    label="Tarifa Personalizada"
                    value={formData.customTariff}
                    onChangeText={(text) => updateField('customTariff', text)}
                    placeholder="0.850"
                    icon="pricetag-outline"
                    keyboardType="decimal-pad"
                    required
                    error={errors.customTariff}
                    unit="R$/kWh"
                  />
                )}
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
                      <Ionicons name="analytics" size={18} color="#10B981" />
                    </View>
                    <View>
                      <Text className="text-green-300 font-bold text-lg">
                        Resultados do Cálculo
                      </Text>
                      <Text className="text-green-400/60 font-medium text-sm">
                        {formData.applianceName || 'Aparelho'} - {result.tariffUsed} R$/kWh
                      </Text>
                    </View>
                  </View>

                  <View className="mb-6">
                    <Text className="text-green-200 font-semibold text-base mb-3">Consumo de Energia</Text>
                    <View className="flex-row gap-3 mb-3">
                      <View className="flex-1 bg-slate-800/40 rounded-xl p-4 border border-slate-700/30">
                        <Text className="text-slate-300 font-medium text-xs mb-1">Diário</Text>
                        <Text className="text-white font-bold text-xl">{result.dailyConsumption}</Text>
                        <Text className="text-slate-400 text-xs">kWh/dia</Text>
                      </View>
                      <View className="flex-1 bg-slate-800/40 rounded-xl p-4 border border-slate-700/30">
                        <Text className="text-slate-300 font-medium text-xs mb-1">Mensal</Text>
                        <Text className="text-white font-bold text-xl">{result.monthlyConsumption}</Text>
                        <Text className="text-slate-400 text-xs">kWh/mês</Text>
                      </View>
                    </View>
                    <View className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/30">
                      <Text className="text-slate-300 font-medium text-xs mb-1">Anual</Text>
                      <Text className="text-white font-bold text-2xl">{result.yearlyConsumption}</Text>
                      <Text className="text-slate-400 text-xs">kWh/ano</Text>
                    </View>
                  </View>

                  <View>
                    <Text className="text-green-200 font-semibold text-base mb-3">Custos</Text>
                    <View className="flex-row gap-3 mb-3">
                      <View className="flex-1 bg-green-500/10 rounded-xl p-4 border border-green-500/20">
                        <Text className="text-green-300 font-medium text-xs mb-1">Mensal</Text>
                        <Text className="text-green-200 font-bold text-xl">R$ {result.monthlyCost}</Text>
                        <Text className="text-green-400/60 text-xs">por mês</Text>
                      </View>
                      <View className="flex-1 bg-green-500/10 rounded-xl p-4 border border-green-500/20">
                        <Text className="text-green-300 font-medium text-xs mb-1">Anual</Text>
                        <Text className="text-green-200 font-bold text-xl">R$ {result.yearlyCost}</Text>
                        <Text className="text-green-400/60 text-xs">por ano</Text>
                      </View>
                    </View>

                    <View className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/30 mt-4">
                      <Text className="text-slate-300 font-semibold text-sm mb-2">Como foi calculado:</Text>
                      <Text className="text-slate-400 text-xs leading-5 font-mono">
                        Tempo total = {formData.hoursPerDay || '0'}h {formData.minutesPerDay || '0'}min = {((parseFloat(formData.hoursPerDay) || 0) + ((parseFloat(formData.minutesPerDay) || 0) / 60)).toFixed(2)}h{'\n'}
                        Consumo = {formData.power}W × {((parseFloat(formData.hoursPerDay) || 0) + ((parseFloat(formData.minutesPerDay) || 0) / 60)).toFixed(2)}h × {formData.daysPerMonth}d ÷ 1000{'\n'}
                        Custo = {result.monthlyConsumption} kWh × R$ {result.tariffUsed}
                      </Text>
                    </View>
                  </View>
                </LinearGradient>
              </View>
            )}

            <View className="mb-8">
              <TouchableOpacity 
                onPress={calculateConsumption}
                disabled={isCalculating}
                className="active:scale-98" 
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={isCalculating ? 
                    ['#6B7280', '#4B5563'] : 
                    ['#10B981', '#059669']
                  }
                  className="flex-row items-center justify-center gap-3 py-5 rounded-xl"
                  style={{
                    shadowColor: isCalculating ? "#6B7280" : "#10B981",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 8,
                    elevation: 8,
                    borderRadius: 12
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
                    {isCalculating ? 'Calculando...' : 'Calcular Consumo'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            <View className="bg-slate-800/40 rounded-xl p-5 border border-slate-700/30 mb-8">
              <View className="flex-row items-center gap-2 mb-4">
                <Ionicons name="leaf" size={18} color="#10B981" />
                <Text className="text-green-300 font-bold text-lg">Dicas de Economia</Text>
              </View>
              <View className="space-y-3">
                <View className="flex-row items-start gap-3">
                  <View className="w-5 h-5 bg-green-500/20 rounded-full items-center justify-center mt-0.5">
                    <Text className="text-green-400 font-bold text-xs">1</Text>
                  </View>
                  <Text className="text-slate-300 text-sm flex-1 leading-5">
                    Substitua lâmpadas: LEDs consomem até 80% menos energia que incandescentes
                  </Text>
                </View>
                <View className="flex-row items-start gap-3">
                  <View className="w-5 h-5 bg-green-500/20 rounded-full items-center justify-center mt-0.5">
                    <Text className="text-green-400 font-bold text-xs">2</Text>
                  </View>
                  <Text className="text-slate-300 text-sm flex-1 leading-5">
                    Ar condicionado: Cada grau a mais economiza cerca de 8% de energia
                  </Text>
                </View>
                <View className="flex-row items-start gap-3">
                  <View className="w-5 h-5 bg-green-500/20 rounded-full items-center justify-center mt-0.5">
                    <Text className="text-green-400 font-bold text-xs">3</Text>
                  </View>
                  <Text className="text-slate-300 text-sm flex-1 leading-5">
                    Standby: Tire aparelhos da tomada quando não estiver usando
                  </Text>
                </View>
                <View className="flex-row items-start gap-3">
                  <View className="w-5 h-5 bg-green-500/20 rounded-full items-center justify-center mt-0.5">
                    <Text className="text-green-400 font-bold text-xs">4</Text>
                  </View>
                  <Text className="text-slate-300 text-sm flex-1 leading-5">
                    Chuveiro elétrico: Banhos mais curtos fazem grande diferença na conta
                  </Text>
                </View>
              </View>
            </View>

            <View className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/30 mb-8">
              <View className="flex-row items-center gap-2 mb-3">
                <Ionicons name="information-circle" size={16} color="#64748B" />
                <Text className="text-slate-300 font-semibold text-sm">Informações Técnicas</Text>
              </View>
              <Text className="text-slate-400 text-xs leading-5">
                • Fórmula: Consumo (kWh) = Potência (W) × Tempo (h) ÷ 1000{'\n'}
                • Custo: Consumo (kWh) × Tarifa (R$/kWh){'\n'}
                • Tarifas baseadas em médias regionais de 2024{'\n'}
                • 1 kWh = 1000 Wh (watt-hora)
              </Text>
            </View>

          </View>
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
}