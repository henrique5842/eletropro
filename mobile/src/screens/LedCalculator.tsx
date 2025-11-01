import { SafeAreaView, View, TouchableOpacity, Text, ScrollView, TextInput, Animated } from "react-native";
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useState, useRef, useEffect, useCallback } from 'react';

const ENVIRONMENT_TYPES = [
  { value: 'residencial', label: 'Residencial', lux: 150, icon: 'home', description: '100-200 lux' },
  { value: 'escritorio', label: 'Escritório', lux: 400, icon: 'briefcase', description: '300-500 lux' },
  { value: 'cozinha', label: 'Cozinha/Banheiro', lux: 325, icon: 'restaurant', description: '250-400 lux' },
  { value: 'sala', label: 'Sala/Decorativa', lux: 200, icon: 'tv', description: '150-250 lux' },
  { value: 'custom', label: 'Personalizado', lux: 0, icon: 'settings', description: 'Definir manualmente' }
];

const LED_STRIP_TYPES = [
  { value: '2835_60', label: 'SMD 2835 - 60 LEDs/m', lumensPerMeter: 480, wattsPerMeter: 4.8, description: 'Básica' },
  { value: '2835_120', label: 'SMD 2835 - 120 LEDs/m', lumensPerMeter: 960, wattsPerMeter: 9.6, description: 'Média' },
  { value: '5050_60', label: 'SMD 5050 - 60 LEDs/m', lumensPerMeter: 900, wattsPerMeter: 14.4, description: 'Alta' },
  { value: '5050_120', label: 'SMD 5050 - 120 LEDs/m', lumensPerMeter: 1800, wattsPerMeter: 28.8, description: 'Premium' },
  { value: 'cob', label: 'COB High Density', lumensPerMeter: 1200, wattsPerMeter: 12, description: 'Profissional' },
  { value: 'custom', label: 'Personalizada', lumensPerMeter: 0, wattsPerMeter: 0, description: 'Definir valores' }
];

interface FormData {
  environmentType: string;
  area: string;
  customLux: string;
  ledStripType: string;
  customLumensPerMeter: string;
  customWattsPerMeter: string;
}

interface FormErrors {
  [key: string]: string | null;
}

interface CalculationResult {
  luxUsed: number;
  lumensNeeded: number;
  metersNeeded: string;
  totalWatts: string;
  monthlyConsumption: string;
  monthlyCost: string;
}

export function LedCalculator() {
  const [formData, setFormData] = useState<FormData>({
    environmentType: 'residencial',
    area: '',
    customLux: '',
    ledStripType: '2835_60',
    customLumensPerMeter: '',
    customWattsPerMeter: ''
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

    if (field === 'environmentType' && value !== 'custom') {
      setFormData(prev => ({
        ...prev,
        environmentType: value,
        customLux: ''
      }));
    }

    if (field === 'ledStripType' && value !== 'custom') {
      setFormData(prev => ({
        ...prev,
        ledStripType: value,
        customLumensPerMeter: '',
        customWattsPerMeter: ''
      }));
    }
  }, [errors]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.area || parseFloat(formData.area) <= 0) {
      newErrors.area = 'Área deve ser maior que 0';
    }

    if (formData.environmentType === 'custom') {
      if (!formData.customLux || parseFloat(formData.customLux) <= 0) {
        newErrors.customLux = 'Lux deve ser maior que 0';
      }
    }

    if (formData.ledStripType === 'custom') {
      if (!formData.customLumensPerMeter || parseFloat(formData.customLumensPerMeter) <= 0) {
        newErrors.customLumensPerMeter = 'Lúmens/m deve ser maior que 0';
      }
      if (!formData.customWattsPerMeter || parseFloat(formData.customWattsPerMeter) <= 0) {
        newErrors.customWattsPerMeter = 'Watts/m deve ser maior que 0';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const calculateLEDStrip = async (): Promise<void> => {
    if (!validateForm()) return;

    setIsCalculating(true);
    
    setTimeout(() => {
      const area = parseFloat(formData.area);
      
      let luxUsed: number;
      if (formData.environmentType === 'custom') {
        luxUsed = parseFloat(formData.customLux);
      } else {
        const envType = ENVIRONMENT_TYPES.find(env => env.value === formData.environmentType);
        luxUsed = envType?.lux || 150;
      }

      let lumensPerMeter: number;
      let wattsPerMeter: number;
      
      if (formData.ledStripType === 'custom') {
        lumensPerMeter = parseFloat(formData.customLumensPerMeter);
        wattsPerMeter = parseFloat(formData.customWattsPerMeter);
      } else {
        const stripType = LED_STRIP_TYPES.find(strip => strip.value === formData.ledStripType);
        lumensPerMeter = stripType?.lumensPerMeter || 480;
        wattsPerMeter = stripType?.wattsPerMeter || 4.8;
      }

      const lumensNeeded = area * luxUsed;
      const metersNeeded = lumensNeeded / lumensPerMeter;
      const totalWatts = metersNeeded * wattsPerMeter;
      
      const monthlyKWh = (totalWatts * 8 * 30) / 1000;
      const monthlyCost = monthlyKWh * 0.75;

      setResult({
        luxUsed,
        lumensNeeded: Math.round(lumensNeeded),
        metersNeeded: metersNeeded.toFixed(1),
        totalWatts: totalWatts.toFixed(1),
        monthlyConsumption: monthlyKWh.toFixed(2),
        monthlyCost: monthlyCost.toFixed(2)
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
    unit = ''
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
          {unit && <Text className="text-gray-400 font-normal text-sm"> ({unit})</Text>}
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
                    <Ionicons name="home" size={18} color="#F59E0B" />
                  </View>
                  <View>
                    <Text className="text-amber-300 font-bold text-lg">
                      Tipo de Ambiente
                    </Text>
                    <Text className="text-amber-400/60 font-medium text-sm">
                      Selecione para definir lux recomendado
                    </Text>
                  </View>
                </View>

                <View className="flex space-y-3">
                  {ENVIRONMENT_TYPES.map((env) => (
                    <TouchableOpacity
                      key={env.value}
                      onPress={() => updateField('environmentType', env.value)}
                      className={`p-4 rounded-xl border flex-row items-center gap-4 mt-3 ${
                        formData.environmentType === env.value
                          ? 'border-amber-500/50 bg-amber-500/10'
                          : 'border-gray-600/40 bg-gray-800/20'
                      }`}
                      activeOpacity={0.8}
                    >
                      <View className={`w-10 h-10 rounded-lg items-center justify-center ${
                        formData.environmentType === env.value ? 'bg-amber-500/20' : 'bg-gray-600/20'
                      }`}>
                        <Ionicons 
                          name={env.icon as keyof typeof Ionicons.glyphMap} 
                          size={18} 
                          color={formData.environmentType === env.value ? "#F59E0B" : "#9CA3AF"} 
                        />
                      </View>
                      <View className="flex-1">
                        <Text className={`font-semibold text-base ${
                          formData.environmentType === env.value ? 'text-amber-200' : 'text-gray-300'
                        }`}>
                          {env.label}
                        </Text>
                        <Text className={`font-medium text-sm ${
                          formData.environmentType === env.value ? 'text-amber-400/80' : 'text-gray-400'
                        }`}>
                          {env.description}
                        </Text>
                      </View>
                      {formData.environmentType === env.value && (
                        <Ionicons name="checkmark-circle" size={20} color="#F59E0B" />
                      )}
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
                    <Ionicons name="resize" size={18} color="#3B82F6" />
                  </View>
                  <View>
                    <Text className="text-blue-300 font-bold text-lg">
                      Parâmetros do Ambiente
                    </Text>
                    <Text className="text-blue-400/60 font-medium text-sm">
                      Dimensões e iluminação desejada
                    </Text>
                  </View>
                </View>

                <InputField
                  label="Área do Ambiente"
                  value={formData.area}
                  onChangeText={(text) => updateField('area', text)}
                  placeholder="Ex: 30"
                  icon="expand"
                  keyboardType="decimal-pad"
                  required
                  error={errors.area}
                  unit="m²"
                />

                {formData.environmentType === 'custom' && (
                  <InputField
                    label="Lux Desejado"
                    value={formData.customLux}
                    onChangeText={(text) => updateField('customLux', text)}
                    placeholder="Ex: 200"
                    icon="sunny"
                    keyboardType="decimal-pad"
                    required
                    error={errors.customLux}
                    unit="lux"
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
                    <Ionicons name="flash" size={18} color="#8B5CF6" />
                  </View>
                  <View>
                    <Text className="text-purple-300 font-bold text-lg">
                      Tipo de Fita LED
                    </Text>
                    <Text className="text-purple-400/60 font-medium text-sm">
                      Especificações técnicas da fita
                    </Text>
                  </View>
                </View>

                <View className="space-y-3 mb-5">
                  {LED_STRIP_TYPES.map((strip) => (
                    <TouchableOpacity
                      key={strip.value}
                      onPress={() => updateField('ledStripType', strip.value)}
                      className={`p-4 rounded-xl border mb-3 ${
                        formData.ledStripType === strip.value
                          ? 'border-purple-500/50 bg-purple-500/10'
                          : 'border-gray-600/40 bg-gray-800/20'
                      }`}
                      activeOpacity={0.8}
                    >
                      <View className="flex-row items-center justify-between">
                        <View className="flex-1">
                          <Text className={`font-semibold text-base ${
                            formData.ledStripType === strip.value ? 'text-purple-200' : 'text-gray-300'
                          }`}>
                            {strip.label}
                          </Text>
                          <Text className={`font-medium text-sm ${
                            formData.ledStripType === strip.value ? 'text-purple-400/80' : 'text-gray-400'
                          }`}>
                            {strip.value !== 'custom' ? 
                              `${strip.lumensPerMeter} lm/m • ${strip.wattsPerMeter} W/m • ${strip.description}` : 
                              strip.description
                            }
                          </Text>
                        </View>
                        {formData.ledStripType === strip.value && (
                          <Ionicons name="checkmark-circle" size={20} color="#8B5CF6" />
                        )}
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>

                {formData.ledStripType === 'custom' && (
                  <View className="flex-row gap-3">
                    <View className="flex-1">
                      <InputField
                        label="Lúmens por Metro"
                        value={formData.customLumensPerMeter}
                        onChangeText={(text) => updateField('customLumensPerMeter', text)}
                        placeholder="Ex: 900"
                        icon="bulb"
                        keyboardType="decimal-pad"
                        required
                        error={errors.customLumensPerMeter}
                        unit="lm/m"
                      />
                    </View>
                    <View className="flex-1">
                      <InputField
                        label="Watts por Metro"
                        value={formData.customWattsPerMeter}
                        onChangeText={(text) => updateField('customWattsPerMeter', text)}
                        placeholder="Ex: 14.4"
                        icon="battery-charging"
                        keyboardType="decimal-pad"
                        required
                        error={errors.customWattsPerMeter}
                        unit="W/m"
                      />
                    </View>
                  </View>
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
                      <Ionicons name="checkmark-circle" size={18} color="#10B981" />
                    </View>
                    <View>
                      <Text className="text-green-300 font-bold text-lg">
                        Resultado do Cálculo
                      </Text>
                      <Text className="text-green-400/60 font-medium text-sm">
                        Especificações para seu projeto
                      </Text>
                    </View>
                  </View>

                  <View className="grid grid-cols-2 gap-4 mb-6">
                    <View className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/30">
                      <Text className="text-slate-300 font-medium text-sm mb-1">Lúmens Necessários</Text>
                      <Text className="text-white font-bold text-xl">{result.lumensNeeded.toLocaleString()}</Text>
                      <Text className="text-slate-400 text-xs">{result.luxUsed} lux × {formData.area}m²</Text>
                    </View>
                    <View className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/30">
                      <Text className="text-slate-300 font-medium text-sm mb-1">Metros de Fita</Text>
                      <Text className="text-green-400 font-bold text-xl">{result.metersNeeded}m</Text>
                      <Text className="text-slate-400 text-xs">Comprimento total</Text>
                    </View>
                    <View className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/30">
                      <Text className="text-slate-300 font-medium text-sm mb-1">Potência Total</Text>
                      <Text className="text-yellow-400 font-bold text-xl">{result.totalWatts}W</Text>
                      <Text className="text-slate-400 text-xs">Consumo máximo</Text>
                    </View>
                    <View className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/30">
                      <Text className="text-slate-300 font-medium text-sm mb-1">Custo Mensal*</Text>
                      <Text className="text-blue-400 font-bold text-xl">R$ {result.monthlyCost}</Text>
                      <Text className="text-slate-400 text-xs">{result.monthlyConsumption} kWh</Text>
                    </View>
                  </View>

                  <View className="bg-slate-800/20 rounded-xl p-4 border border-slate-700/20">
                    <Text className="text-slate-300 font-semibold text-sm mb-2">Informações Importantes:</Text>
                    <Text className="text-slate-400 text-xs leading-5">
                      • Cálculo baseado em 8h/dia de uso
                      • Tarifa estimada: R$ 0,75/kWh
                      • Considere fonte/driver adequada
                      • Verifique temperatura de cor desejada
                      • Para ambientes grandes, distribua em múltiplos pontos
                    </Text>
                  </View>
                </LinearGradient>
              </View>
            )}

            <View className="mb-8">
              <TouchableOpacity 
                onPress={calculateLEDStrip}
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
                    {isCalculating ? 'Calculando...' : 'Calcular Fita LED'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            <View className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/30 mb-8">
              <View className="flex-row items-center gap-2 mb-3">
                <Ionicons name="information-circle" size={16} color="#64748B" />
                <Text className="text-slate-300 font-semibold text-sm">Referências Técnicas</Text>
              </View>
              <Text className="text-slate-400 text-xs leading-5">
                • Lux = Lúmens por metro quadrado (lm/m²)
                • SMD 2835: LED pequeno, eficiente, boa relação custo-benefício
                • SMD 5050: LED maior, mais brilho, maior consumo
                • COB: Chip on Board, iluminação uniforme, profissional
                • Considere sempre IP adequado para o ambiente
              </Text>
            </View>

          </View>
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
}