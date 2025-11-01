import React, { useState, useEffect } from 'react';
import { SafeAreaView, View, TouchableOpacity, Text, ScrollView, TextInput, Alert, Modal, Image, ActivityIndicator } from "react-native";
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { authContext } from '../context/AuthContext';
import Logo from '../assets/logo.png'

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  cnpj?: string;
  avatar?: string;
}

export function Profile() {
  const [activeTab, setActiveTab] = useState('profile');
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile>({
    id: "",
    name: "",
    email: "",
    phone: "",
    company: "",
    cnpj: "",
    avatar: ""
  });
  const [editedProfile, setEditedProfile] = useState<UserProfile>({ ...userProfile });

  const loadUserData = async () => {
    try {
      setIsLoading(true);
      const userInfo = await authContext.getUserInfo();
      if (userInfo) {
        const profileData: UserProfile = {
          id: userInfo.id,
          name: userInfo.name || '',
          email: userInfo.email || '',
          phone: userInfo.phone || '',
          company: userInfo.companyName || '',
          cnpj: userInfo.cnpj || '',
          avatar: userInfo.avatar || ''
        };
        setUserProfile(profileData);
        setEditedProfile(profileData);
      } else {
        Alert.alert('Aviso', 'Não foi possível carregar os dados do usuário');
      }
    } catch (error) {
      Alert.alert('Erro', 'Erro ao carregar dados do usuário');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUserData();
  }, []);

  const handleLogout = async () => {
    Alert.alert(
      "Sair",
      "Deseja realmente sair da sua conta?",
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Sair", 
          style: "destructive",
          onPress: async () => {
            try {
              await authContext.logout();
              Alert.alert("Sucesso", "Logout realizado com sucesso!");
            } catch (error) {
              Alert.alert("Erro", "Erro ao fazer logout");
            }
          }
        }
      ]
    );
  };

  const formatPhone = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length <= 11) {
      const match = cleaned.match(/^(\d{2})(\d{5})(\d{4})$/);
      if (match && cleaned.length === 11) {
        return `(${match[1]}) ${match[2]}-${match[3]}`;
      }
    }
    return text;
  };

  const formatCNPJ = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length <= 14) {
      const match = cleaned.match(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/);
      if (match && cleaned.length === 14) {
        return `${match[1]}.${match[2]}.${match[3]}/${match[4]}-${match[5]}`;
      }
    }
    return text;
  };

  const loadUserProfile = async () => {
    try {
      const userInfo = await authContext.getUserInfo();
      if (userInfo) {
        const profileData: UserProfile = {
          id: userInfo.id,
          name: userInfo.name || '',
          email: userInfo.email || '',
          phone: userInfo.phone || '',
          company: userInfo.companyName || '',
          cnpj: userInfo.cnpj || '',
          avatar: userInfo.avatar || ''
        };
        setEditedProfile(profileData);
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível carregar os dados do perfil');
    }
  };

  const openEditProfile = () => {
    setShowEditProfileModal(true);
    loadUserProfile();
  };

  const handleSaveProfile = async () => {
    if (isUpdatingProfile) return;
    setIsUpdatingProfile(true);
    
    try {
      if (!editedProfile.name.trim()) {
        Alert.alert('Erro', 'Nome é obrigatório');
        setIsUpdatingProfile(false);
        return;
      }
      
      if (!editedProfile.email.trim()) {
        Alert.alert('Erro', 'Email é obrigatório');
        setIsUpdatingProfile(false);
        return;
      }
      
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(editedProfile.email)) {
        Alert.alert('Erro', 'Email inválido');
        setIsUpdatingProfile(false);
        return;
      }
      
      const dataToUpdate = {
        name: editedProfile.name.trim(),
        email: editedProfile.email.trim(),
        phone: editedProfile.phone?.trim() || undefined,
        companyName: editedProfile.company?.trim() || undefined,
        cnpj: editedProfile.cnpj?.trim() || undefined
      };
      
      const updatedUser = await authContext.updateProfile(dataToUpdate);
      
      if (updatedUser) {
        const updatedProfile: UserProfile = {
          id: updatedUser.id,
          name: updatedUser.name || '',
          email: updatedUser.email || '',
          phone: updatedUser.phone || '',
          company: updatedUser.companyName || '',
          cnpj: updatedUser.cnpj || '',
          avatar: updatedUser.avatar || ''
        };
        
        setUserProfile(updatedProfile);
        
        Alert.alert(
          'Sucesso', 
          'Perfil atualizado com sucesso!',
          [
            {
              text: 'OK',
              onPress: () => {
                setShowEditProfileModal(false);
                loadUserData();
              }
            }
          ]
        );
      } else {
        throw new Error('Resposta vazia da API');
      }
      
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível salvar as alterações. Tente novamente.');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Perfil', icon: 'person' },
    { id: 'settings', label: 'Configurações', icon: 'settings' }
  ];

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-neutral-900 items-center justify-center">
        <ActivityIndicator size="large" color="#60A5FA" />
        <Text className="text-white font-inter-medium text-base mt-4">Carregando perfil...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-neutral-900">
      <View className="px-6 mt-16 mb-5">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity className="w-14 h-14 bg-zinc-800/50 rounded-3xl items-center justify-center border border-zinc-700/40">
            <Ionicons name="chevron-back" size={24} color="#60A5FA" />
          </TouchableOpacity>
          
          <Text className="text-white font-inter-black text-sm">PERFIL</Text>

          <TouchableOpacity 
            onPress={openEditProfile}
            className="w-14 h-14 bg-zinc-800/50 rounded-3xl items-center justify-center border border-zinc-700/40"
          >
            <Ionicons name="create" size={22} color="#60A5FA" />
          </TouchableOpacity>
        </View>
      </View>

      <View className="flex mb-10 items-center">
        <Image source={Logo} className='flex w-28 h-28 rounded-full'/>
        <Text className='font-inter-black text-gray-300 mt-5'>
          {userProfile.company || userProfile.name || 'USUÁRIO'}
        </Text>
        <TouchableOpacity 
          onPress={() => loadUserData()}
          className="mt-2 bg-blue-600/20 px-3 py-1 rounded-lg border border-blue-600/30"
        >
          <Text className="text-blue-400 font-inter-medium text-xs">Atualizar dados</Text>
        </TouchableOpacity>
      </View>

      <View className="px-6 mb-6 items-center">
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row gap-3">
            {tabs.map((tab) => (
              <TouchableOpacity
                key={tab.id}
                onPress={() => setActiveTab(tab.id)}
                className="active:scale-95"
              >
                {activeTab === tab.id ? (
                  <LinearGradient
                    colors={['#3B82F6', '#1E40AF']}
                    className="px-6 py-4 rounded-2xl"
                    style={{
                      borderRadius: 12,
                    }}
                  >
                    <View className="flex-row items-center gap-3">
                      <Ionicons name={tab.icon as any} size={20} color="white" />
                      <Text className="text-white font-inter-black text-sm">{tab.label}</Text>
                    </View>
                  </LinearGradient>
                ) : (
                  <View className="px-6 py-4 rounded-2xl bg-zinc-800/40 border border-zinc-700/30">
                    <View className="flex-row items-center gap-3">
                      <Ionicons name={tab.icon as any} size={20} color="#9CA3AF" />
                      <Text className="text-gray-400 font-inter-medium text-sm">{tab.label}</Text>
                    </View>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-6">
          {activeTab === 'profile' && (
            <View className="gap-6">
              <View className="bg-zinc-900/60 backdrop-blur-xl rounded-3xl p-6 border border-zinc-800/30">
                <View className="flex-row items-center gap-3 mb-6">
                  <View className="w-12 h-12 bg-blue-600/20 rounded-2xl items-center justify-center">
                    <Ionicons name="person" size={24} color="#60A5FA" />
                  </View>
                  <Text className="text-white font-inter-black text-xl">Informações Pessoais</Text>
                </View>
                
                <View className="gap-4">
                  <View className="flex-row items-center gap-4 py-3 border-b border-zinc-800/50">
                    <View className="w-10 h-10 bg-zinc-800/50 rounded-xl items-center justify-center">
                      <Ionicons name="person-outline" size={18} color="#9CA3AF" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-gray-400 font-inter-medium text-sm">Nome</Text>
                      <Text className="text-white font-inter-bold text-lg mt-1">
                        {userProfile.name || 'Não informado'}
                      </Text>
                    </View>
                  </View>
                 
                  <View className="flex-row items-center gap-4 py-3 border-b border-zinc-800/50">
                    <View className="w-10 h-10 bg-zinc-800/50 rounded-xl items-center justify-center">
                      <Ionicons name="mail-outline" size={18} color="#9CA3AF" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-gray-400 font-inter-medium text-sm">Email</Text>
                      <Text className="text-white font-inter-bold text-lg mt-1">
                        {userProfile.email || 'Não informado'}
                      </Text>
                    </View>
                  </View>

                  {userProfile.phone && (
                    <View className="flex-row items-center gap-4 py-3 border-b border-zinc-800/50">
                      <View className="w-10 h-10 bg-zinc-800/50 rounded-xl items-center justify-center">
                        <Ionicons name="call-outline" size={18} color="#9CA3AF" />
                      </View>
                      <View className="flex-1">
                        <Text className="text-gray-400 font-inter-medium text-sm">Telefone</Text>
                        <Text className="text-white font-inter-bold text-lg mt-1">{userProfile.phone}</Text>
                      </View>
                    </View>
                  )}

                  {userProfile.cnpj && (
                    <View className="flex-row items-center gap-4 py-3 border-b border-zinc-800/50">
                      <View className="w-10 h-10 bg-zinc-800/50 rounded-xl items-center justify-center">
                        <Ionicons name="business-outline" size={18} color="#9CA3AF" />
                      </View>
                      <View className="flex-1">
                        <Text className="text-gray-400 font-inter-medium text-sm">CNPJ</Text>
                        <Text className="text-white font-inter-bold text-lg mt-1">{userProfile.cnpj}</Text>
                      </View>
                    </View>
                  )}

                  {userProfile.company && (
                    <View className="flex-row items-center gap-4 py-3">
                      <View className="w-10 h-10 bg-zinc-800/50 rounded-xl items-center justify-center">
                        <Ionicons name="business-outline" size={18} color="#9CA3AF" />
                      </View>
                      <View className="flex-1">
                        <Text className="text-gray-400 font-inter-medium text-sm">Empresa</Text>
                        <Text className="text-white font-inter-bold text-lg mt-1">{userProfile.company}</Text>
                      </View>
                    </View>
                  )}
                </View>
              </View>
            </View>
          )}

          {activeTab === 'settings' && (
            <View className="gap-4">
              <View className="bg-zinc-900/60 backdrop-blur-xl rounded-3xl p-6 border border-zinc-800/30">
                <View className="flex-row items-center gap-3 mb-6">
                  <View className="w-12 h-12 bg-orange-600/20 rounded-2xl items-center justify-center">
                    <Ionicons name="settings" size={24} color="#F59E0B" />
                  </View>
                  <Text className="text-white font-inter-black text-xl">Configurações Gerais</Text>
                </View>
                
                <View className="gap-4">
                  <TouchableOpacity className="flex-row items-center gap-4 py-3 border-b border-zinc-800/50">
                    <View className="w-10 h-10 bg-zinc-800/50 rounded-xl items-center justify-center">
                      <Ionicons name="notifications-outline" size={18} color="#9CA3AF" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-white font-inter-bold text-base">Notificações</Text>
                      <Text className="text-gray-400 font-inter-medium text-sm">Gerenciar notificações do app</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
                  </TouchableOpacity>

                  <TouchableOpacity className="flex-row items-center gap-4 py-3 border-b border-zinc-800/50">
                    <View className="w-10 h-10 bg-zinc-800/50 rounded-xl items-center justify-center">
                      <Ionicons name="shield-outline" size={18} color="#9CA3AF" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-white font-inter-bold text-base">Privacidade</Text>
                      <Text className="text-gray-400 font-inter-medium text-sm">Configurações de privacidade</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
                  </TouchableOpacity>

                  <TouchableOpacity className="flex-row items-center gap-4 py-3 border-b border-zinc-800/50">
                    <View className="w-10 h-10 bg-zinc-800/50 rounded-xl items-center justify-center">
                      <Ionicons name="cloud-outline" size={18} color="#9CA3AF" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-white font-inter-bold text-base">Backup</Text>
                      <Text className="text-gray-400 font-inter-medium text-sm">Backup dos dados</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
                  </TouchableOpacity>

                  <TouchableOpacity 
                    onPress={handleLogout}
                    className="flex-row items-center gap-4 py-3"
                  >
                    <View className="w-10 h-10 bg-red-600/20 rounded-xl items-center justify-center">
                      <Ionicons name="log-out-outline" size={18} color="#EF4444" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-red-400 font-inter-bold text-base">Sair</Text>
                      <Text className="text-gray-400 font-inter-medium text-sm">Fazer logout da conta</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        </View>

        <View className="h-24"/>
      </ScrollView>

      <Modal
        visible={showEditProfileModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowEditProfileModal(false)}
      >
        <SafeAreaView className="flex-1 bg-neutral-900">
          <View className="px-6 py-4 border-b border-zinc-800/30">
            <View className="flex-row items-center justify-between">
              <Text className="text-white font-inter-black text-lg">Editar Perfil</Text>
              <TouchableOpacity 
                onPress={() => setShowEditProfileModal(false)}
                className="w-10 h-10 bg-zinc-800/50 rounded-xl items-center justify-center border border-zinc-700/40"
              >
                <Ionicons name="close" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView className="flex-1 px-6 py-6">
            <View className="gap-6">
              <View>
                <Text className="text-gray-400 font-inter-medium text-sm mb-2">Nome Completo</Text>
                <TextInput
                  value={editedProfile.name}
                  onChangeText={(text) => setEditedProfile({...editedProfile, name: text})}
                  placeholder="Digite seu nome completo"
                  placeholderTextColor="#6B7280"
                  className="text-white font-inter-bold text-base bg-zinc-800/40 rounded-xl px-4 py-3 border border-zinc-700/40"
                />
              </View>

              <View>
                <Text className="text-gray-400 font-inter-medium text-sm mb-2">Email</Text>
                <TextInput
                  value={editedProfile.email}
                  onChangeText={(text) => setEditedProfile({...editedProfile, email: text})}
                  placeholder="Digite seu email"
                  placeholderTextColor="#6B7280"
                  keyboardType="email-address"
                  className="text-white font-inter-bold text-base bg-zinc-800/40 rounded-xl px-4 py-3 border border-zinc-700/40"
                />
              </View>

              <View>
                <Text className="text-gray-400 font-inter-medium text-sm mb-2">Telefone</Text>
                <TextInput
                  value={editedProfile.phone || ''}
                  onChangeText={(text) => {
                    const formatted = formatPhone(text);
                    setEditedProfile({...editedProfile, phone: formatted});
                  }}
                  placeholder="(11) 99999-9999"
                  placeholderTextColor="#6B7280"
                  keyboardType="phone-pad"
                  maxLength={15}
                  className="text-white font-inter-bold text-base bg-zinc-800/40 rounded-xl px-4 py-3 border border-zinc-700/40"
                />
              </View>

              <View>
                <Text className="text-gray-400 font-inter-medium text-sm mb-2">Empresa</Text>
                <TextInput
                  value={editedProfile.company || ''}
                  onChangeText={(text) => setEditedProfile({...editedProfile, company: text})}
                  placeholder="Nome da sua empresa"
                  placeholderTextColor="#6B7280"
                  className="text-white font-inter-bold text-base bg-zinc-800/40 rounded-xl px-4 py-3 border border-zinc-700/40"
                />
              </View>

              <View>
                <Text className="text-gray-400 font-inter-medium text-sm mb-2">CNPJ</Text>
                <TextInput
                  value={editedProfile.cnpj || ''}
                  onChangeText={(text) => {
                    const formatted = formatCNPJ(text);
                    setEditedProfile({...editedProfile, cnpj: formatted});
                  }}
                  placeholder="00.000.000/0000-00"
                  placeholderTextColor="#6B7280"
                  keyboardType="numeric"
                  maxLength={18}
                  className="text-white font-inter-bold text-base bg-zinc-800/40 rounded-xl px-4 py-3 border border-zinc-700/40"
                />
              </View>
            </View>
          </ScrollView>

          <View className="px-6 py-6">
            <TouchableOpacity 
              onPress={handleSaveProfile}
              disabled={isUpdatingProfile}
              className={`${isUpdatingProfile ? 'opacity-50' : ''}`}
            >
              <LinearGradient
                colors={['#3B82F6', '#1E40AF']}
                style={{ borderRadius: 12,}}
                className="flex-row items-center justify-center gap-3 py-5 rounded-3xl"
              >
                {isUpdatingProfile ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Ionicons name="checkmark" size={24} color="white" />
                )}
                <Text className="text-white font-inter-black text-lg">
                  {isUpdatingProfile ? 'Salvando...' : 'Salvar Alterações'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}