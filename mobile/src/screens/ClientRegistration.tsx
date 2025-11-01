import { useState, useRef, useEffect, useCallback } from "react";
import {
  SafeAreaView,
  View,
  TouchableOpacity,
  Text,
  ScrollView,
  Animated,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { InputField } from "../components/Input";
import { useNavigation } from "@react-navigation/native";
import { clientContext } from "../context/ClientContext";

interface FormData {
  name: string;
  email: string;
  phone: string;
  cpfCnpj: string;
  street: string;
  number: string;
  district: string;
  city: string;
  state: string;
  zipCode: string;
  needsInvoice: boolean;
}

interface FormErrors {
  [key: string]: string | null;
}

export function ClientRegistration() {
  const navigation = useNavigation();

  function handleBack() {
    navigation.goBack();
  }

  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    phone: "",
    cpfCnpj: "",
    street: "",
    number: "",
    district: "",
    city: "",
    state: "",
    zipCode: "",
    needsInvoice: false,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSearchingCEP, setIsSearchingCEP] = useState<boolean>(false);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    const pulse = () => {
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.02,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
      ]).start(() => pulse());
    };
    pulse();
  }, []);

  useEffect(() => {
    if (isLoading) {
      const rotate = () => {
        rotateAnim.setValue(0);
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }).start(() => rotate());
      };
      rotate();
    }
  }, [isLoading]);

  const updateField = useCallback(
    (field: keyof FormData, value: string | boolean) => {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));

      if (errors[field]) {
        setErrors((prev) => ({
          ...prev,
          [field]: null,
        }));
      }
    },
    [errors]
  );

  const formatPhone = useCallback((text: string): string => {
    return clientContext.formatPhone(text);
  }, []);

  const formatCpfCnpj = useCallback((text: string): string => {
    return clientContext.formatCPFCNPJ(text);
  }, []);

  const formatZipCode = useCallback((text: string): string => {
    return clientContext.formatCEP(text);
  }, []);

  const searchAddressByCEP = useCallback(async (cep: string) => {
    const cleanCEP = cep.replace(/\D/g, '');
    if (cleanCEP.length !== 8) return;

    setIsSearchingCEP(true);
    try {
      const addressData = await clientContext.searchAddressByCEP(cleanCEP);
      
      if (addressData.street) {
        setFormData(prev => ({
          ...prev,
          street: addressData.street || "",
          district: addressData.neighborhood || "",
          city: addressData.city || "",
          state: addressData.state || "",
        }));
      }
    } catch (error) {
      Alert.alert(
        "Erro ao buscar CEP",
        "Não foi possível encontrar o endereço para este CEP. Verifique se está correto.",
        [{ text: "OK" }]
      );
    } finally {
      setIsSearchingCEP(false);
    }
  }, []);

  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {};

    const clientData = {
      fullName: formData.name.trim(),
      phone: formData.phone.replace(/\D/g, ''),
      email: formData.email.trim(),
      cpfCnpj: formData.cpfCnpj.replace(/\D/g, ''),
      requiresInvoice: formData.needsInvoice,
      cep: formData.zipCode.replace(/\D/g, ''),
      street: formData.street.trim(),
      number: formData.number.trim(),
      neighborhood: formData.district.trim(),
      city: formData.city.trim(),
      state: formData.state.trim().toUpperCase(),
    };

    if (!formData.name.trim()) {
      newErrors.name = "Nome é obrigatório";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Telefone é obrigatório";
    }

    if (formData.needsInvoice) {
      if (!formData.cpfCnpj.trim()) {
        newErrors.cpfCnpj = "CPF/CNPJ é obrigatório para nota fiscal";
      }
      if (!formData.email.trim()) {
        newErrors.email = "E-mail é obrigatório para envio da nota fiscal";
      }
    }

    if (Object.keys(newErrors).length === 0) {
      const validation = clientContext.validateClientData(clientData);
      if (!validation.isValid && validation.error) {
        if (validation.error.includes('Nome')) {
          newErrors.name = validation.error;
        } else if (validation.error.includes('Telefone')) {
          newErrors.phone = validation.error;
        } else if (validation.error.includes('Email')) {
          newErrors.email = validation.error;
        } else if (validation.error.includes('CEP')) {
          newErrors.zipCode = validation.error;
        } else if (validation.error.includes('Endereço')) {
          newErrors.street = validation.error;
        } else if (validation.error.includes('Número')) {
          newErrors.number = validation.error;
        } else if (validation.error.includes('Bairro')) {
          newErrors.district = validation.error;
        } else if (validation.error.includes('Cidade')) {
          newErrors.city = validation.error;
        } else if (validation.error.includes('Estado')) {
          newErrors.state = validation.error;
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSave = async (): Promise<void> => {
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const clientData = {
        fullName: formData.name.trim(),
        phone: formData.phone.replace(/\D/g, ''),
        email: formData.email.trim() || undefined,
        cpfCnpj: formData.cpfCnpj.replace(/\D/g, '') || undefined,
        requiresInvoice: formData.needsInvoice,
        cep: formData.zipCode.replace(/\D/g, ''),
        street: formData.street.trim(),
        number: formData.number.trim(),
        neighborhood: formData.district.trim(),
        city: formData.city.trim(),
        state: formData.state.trim().toUpperCase(),
      };

      const newClient = await clientContext.createClient(clientData);

      Alert.alert(
        "Sucesso!",
        "Cliente cadastrado com sucesso.",
        [
          {
            text: "OK",
            onPress: () => navigation.goBack()
          }
        ]
      );

    } catch (error) {
      Alert.alert(
        "Erro ao salvar",
        error instanceof Error ? error.message : "Ocorreu um erro inesperado ao salvar o cliente.",
        [{ text: "OK" }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
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
                onPress={handleBack}
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
                <Text className="text-white font-bold text-sm">
                  NOVO CLIENTE
                </Text>
                <View className="w-12 h-0.5 bg-blue-500 rounded-full mt-1" />
              </View>

              <View className="w-10 h-10" />
            </View>
          </View>

          <View className="px-6">
            <View className="relative mb-8">
              <LinearGradient
                colors={["rgba(59, 130, 246, 0.08)", "rgba(30, 64, 175, 0.04)"]}
                className="rounded-2xl p-6 border border-blue-500/20"
              >
                <View className="flex-row items-center gap-3 mb-6">
                  <View className="w-10 h-10 bg-blue-500/20 rounded-xl items-center justify-center">
                    <Ionicons name="person" size={18} color="#3B82F6" />
                  </View>
                  <View>
                    <Text className="text-blue-300 font-bold text-lg">
                      Dados Pessoais
                    </Text>
                    <Text className="text-blue-400/60 font-medium text-sm">
                      Informações básicas do cliente
                    </Text>
                  </View>
                </View>

                <InputField
                  label="Nome Completo"
                  value={formData.name}
                  onChangeText={(text) => updateField("name", text)}
                  placeholder="Digite o nome completo do cliente"
                  icon="person-outline"
                  required
                  error={errors.name}
                />

                <InputField
                  label="Telefone"
                  value={formData.phone}
                  onChangeText={(text) =>
                    updateField("phone", formatPhone(text))
                  }
                  placeholder="(11) 99999-9999"
                  maxLength={15}
                  icon="call-outline"
                  keyboardType="phone-pad"
                  required
                  error={errors.phone}
                />

                <InputField
                  label="E-mail"
                  value={formData.email}
                  onChangeText={(text) =>
                    updateField("email", text.toLowerCase())
                  }
                  placeholder="cliente@exemplo.com"
                  icon="mail-outline"
                  keyboardType="email-address"
                  error={errors.email}
                />
              </LinearGradient>
            </View>

            <View className="relative mb-8">
              <LinearGradient
                colors={["rgba(245, 158, 11, 0.08)", "rgba(217, 119, 6, 0.04)"]}
                className="rounded-2xl p-6 border border-amber-500/20"
              >
                <View className="flex-row items-center gap-3 mb-6">
                  <View className="w-10 h-10 bg-amber-500/20 rounded-xl items-center justify-center">
                    <Ionicons name="receipt" size={18} color="#F59E0B" />
                  </View>
                  <View>
                    <Text className="text-amber-300 font-bold text-lg">
                      Nota Fiscal
                    </Text>
                    <Text className="text-amber-400/60 font-medium text-sm">
                      Configurações de emissão
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  onPress={() =>
                    updateField("needsInvoice", !formData.needsInvoice)
                  }
                  className={`rounded-xl p-4 border ${
                    formData.needsInvoice
                      ? "border-green-500/40 bg-green-500/5"
                      : "border-gray-600/40 bg-gray-800/20"
                  }`}
                  activeOpacity={0.8}
                >
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center gap-3">
                      <View
                        className={`w-12 h-12 rounded-lg items-center justify-center ${
                          formData.needsInvoice
                            ? "bg-green-500/20"
                            : "bg-gray-600/20"
                        }`}
                      >
                        <Ionicons
                          name="document-text"
                          size={20}
                          color={formData.needsInvoice ? "#10B981" : "#9CA3AF"}
                        />
                      </View>
                      <View>
                        <Text
                          className={`font-semibold text-base ${
                            formData.needsInvoice
                              ? "text-green-200"
                              : "text-white"
                          }`}
                        >
                          Emitir Nota Fiscal
                        </Text>
                        <Text
                          className={`font-medium text-sm ${
                            formData.needsInvoice
                              ? "text-green-300/70"
                              : "text-gray-400"
                          }`}
                        >
                          {formData.needsInvoice
                            ? "Nota fiscal será emitida"
                            : "Nota fiscal não será emitida"}
                        </Text>
                      </View>
                    </View>

                    <View
                      className={`w-14 h-7 rounded-full border flex-row items-center ${
                        formData.needsInvoice
                          ? "bg-green-500/30 border-green-400/50 justify-end"
                          : "bg-gray-700/50 border-gray-600/50 justify-start"
                      } px-1`}
                    >
                      <View className="w-5 h-5 rounded-full bg-white shadow-lg" />
                    </View>
                  </View>
                </TouchableOpacity>

                {formData.needsInvoice && (
                  <View className="mt-6 pt-6 border-t border-amber-500/20">
                    <InputField
                      label="CPF/CNPJ"
                      maxLength={18}
                      value={formData.cpfCnpj}
                      onChangeText={(text) =>
                        updateField("cpfCnpj", formatCpfCnpj(text))
                      }
                      placeholder="000.000.000-00 ou 00.000.000/0000-00"
                      icon="card-outline"
                      keyboardType="numeric"
                      required={formData.needsInvoice}
                      error={errors.cpfCnpj}
                    />
                  </View>
                )}
              </LinearGradient>
            </View>

            <View className="relative mb-8">
              <LinearGradient
                colors={[
                  "rgba(139, 92, 246, 0.08)",
                  "rgba(124, 58, 237, 0.04)",
                ]}
                className="rounded-2xl p-6 border border-purple-500/20"
              >
                <View className="flex-row items-center gap-3 mb-6">
                  <View className="w-10 h-10 bg-purple-500/20 rounded-xl items-center justify-center">
                    <Ionicons name="location" size={18} color="#8B5CF6" />
                  </View>
                  <View>
                    <Text className="text-purple-300 font-bold text-lg">
                      Endereço
                    </Text>
                    <Text className="text-purple-400/60 font-medium text-sm">
                      Localização do cliente
                    </Text>
                  </View>
                </View>

                <View className="relative">
                  <InputField
                    label="CEP"
                    maxLength={9}
                    value={formData.zipCode}
                    onChangeText={(text) => {
                      const formatted = formatZipCode(text);
                      updateField("zipCode", formatted);
                      if (formatted.length === 9) {
                        searchAddressByCEP(formatted);
                      }
                    }}
                    placeholder="00000-000"
                    icon="location-outline"
                    keyboardType="numeric"
                    error={errors.zipCode}
                  />
                  {isSearchingCEP && (
                    <View className="absolute right-3 top-12">
                      <Animated.View
                        className="w-4 h-4 border border-purple-400 border-t-transparent rounded-full"
                        style={{
                          transform: [{ rotate: spin }]
                        }}
                      />
                    </View>
                  )}
                </View>

                <View className="flex-row gap-3">
                  <View className="flex-1">
                    <InputField
                      label="Rua/Avenida"
                      value={formData.street}
                      onChangeText={(text) => updateField("street", text)}
                      placeholder="Nome da rua ou avenida"
                      icon="home-outline"
                      error={errors.street}
                    />
                  </View>
                  <View className="w-24">
                    <InputField
                      label="Número"
                      value={formData.number}
                      onChangeText={(text) => updateField("number", text)}
                      placeholder="123"
                      icon="keypad-outline"
                      keyboardType="numeric"
                      error={errors.number}
                    />
                  </View>
                </View>

                <InputField
                  label="Bairro"
                  value={formData.district}
                  onChangeText={(text) => updateField("district", text)}
                  placeholder="Nome do bairro"
                  icon="business-outline"
                  error={errors.district}
                />

                <View className="flex-row gap-3">
                  <View className="flex-1">
                    <InputField
                      label="Cidade"
                      value={formData.city}
                      onChangeText={(text) => updateField("city", text)}
                      placeholder="Nome da cidade"
                      icon="location-outline"
                      error={errors.city}
                    />
                  </View>
                  <View className="w-20">
                    <InputField
                      label="UF"
                      value={formData.state}
                      onChangeText={(text) =>
                        updateField("state", text.toUpperCase())
                      }
                      placeholder="SP"
                      icon="flag-outline"
                      maxLength={2}
                      error={errors.state}
                    />
                  </View>
                </View>
              </LinearGradient>
            </View>

            <View className="flex-row gap-3 mb-6">
              <TouchableOpacity
                className="flex-1 active:scale-98"
                onPress={handleCancel}
                activeOpacity={0.8}
                disabled={isLoading}
              >
                <View className="flex-row items-center justify-center gap-2 py-4 rounded-xl border border-gray-600/40 bg-gray-800/20">
                  <Ionicons name="close" size={20} color="#9CA3AF" />
                  <Text className="text-gray-300 font-semibold text-base">
                    Cancelar
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                className="flex-1 active:scale-98"
                onPress={handleSave}
                disabled={isLoading || isSearchingCEP}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={
                    isLoading || isSearchingCEP ? ["#6B7280", "#4B5563"] : ["#10B981", "#059669"]
                  }
                  className="flex-row items-center justify-center gap-2 py-4 rounded-xl"
                  style={{
                    shadowColor: isLoading || isSearchingCEP ? "#6B7280" : "#10B981",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 8,
                    elevation: 8,
                    borderRadius: 12,
                  }}
                >
                  {isLoading ? (
                    <Animated.View
                      className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                      style={{ transform: [{ rotate: spin }] }}
                    />
                  ) : (
                    <Ionicons name="checkmark" size={20} color="white" />
                  )}
                  <Text className="text-white font-semibold text-base">
                    {isLoading ? "Salvando..." : "Salvar Cliente"}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            <View className="relative mb-6">
              <View className="rounded-xl p-4 border border-blue-500/20 bg-blue-500/5">
                <View className="flex-row items-start gap-3">
                  <View className="w-8 h-8 bg-blue-500/20 rounded-lg items-center justify-center mt-0.5">
                    <Ionicons
                      name="information-circle"
                      size={16}
                      color="#3B82F6"
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-blue-300 font-semibold text-base mb-2">
                      Informações Importantes
                    </Text>
                    <View className="gap-2">
                      <Text className="text-blue-100/80 font-medium text-sm leading-relaxed">
                        • Campos com{" "}
                        <Text className="text-blue-400 font-semibold">*</Text>{" "}
                        são obrigatórios
                      </Text>
                      <Text className="text-blue-100/80 font-medium text-sm leading-relaxed">
                        • CPF/CNPJ e e-mail só são obrigatórios para emissão de
                        nota fiscal
                      </Text>
                      <Text className="text-blue-100/80 font-medium text-sm leading-relaxed">
                        • O endereço será preenchido automaticamente pelo CEP
                      </Text>
                      <Text className="text-blue-100/80 font-medium text-sm leading-relaxed">
                        • Todos os dados podem ser editados posteriormente
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          </View>

          <View className="h-6" />
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
}