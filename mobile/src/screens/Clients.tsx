import React, { useState } from "react";
import { SafeAreaView, View, ScrollView, TouchableOpacity, Text, ActivityIndicator } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

import { useClientData } from "../hooks/useClientData";
import { ClientHeader } from "../components/ClientHeader";
import { InfoTab } from "../components/InfoTab";
import { QuotesTab } from "../components/QuotesTab";
import { MaterialsTab } from "../components/MaterialsTab";
import { EditClientModal } from "../components/modal/EditClientModal";
import { DeleteModal } from "../components/modal/DeleteModal";
import { ShareModal } from "../components/modal/ShareModal";

const TABS = [
  { id: "info", label: "Info", icon: "person" },
  { id: "quotes", label: "Orçamentos", icon: "document-text" },
  { id: "materials", label: "Materiais", icon: "cube" },
];

export function Clients() {
  const { client, setClient, isLoading, clientId } = useClientData();
  const [activeTab, setActiveTab] = useState("info");

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [shareModalVisible, setShareModalVisible] = useState(false);

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-neutral-900 items-center justify-center">
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text className="text-gray-400 mt-4">Carregando...</Text>
      </SafeAreaView>
    );
  }

  if (!client) {
    return (
      <SafeAreaView className="flex-1 bg-neutral-900 items-center justify-center">
        <Text className="text-gray-400">Cliente não encontrado.</Text>
      </SafeAreaView>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case "info": return <InfoTab client={client} onShare={() => setShareModalVisible(true)} />;
      case "quotes": return <QuotesTab clientId={clientId} />;
      case "materials": return <MaterialsTab clientId={clientId} />;
      default: return null;
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-neutral-900">
      <ScrollView showsVerticalScrollIndicator={false}>
        <ClientHeader
          client={client}
          onEdit={() => setEditModalVisible(true)}
          onDelete={() => setDeleteModalVisible(true)}
        />

        <View className="px-6 mb-10">
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row gap-3">
              {TABS.map((tab) => (
                <TouchableOpacity key={tab.id} onPress={() => setActiveTab(tab.id)} className="active:scale-95">
                  {activeTab === tab.id ? (
                    <LinearGradient colors={["#3B82F6", "#1E40AF"]} style={{borderRadius: 12}} className="px-6 py-4 rounded-2xl">
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

        <View className="px-6">{renderTabContent()}</View>
        <View className="h-24" />
      </ScrollView>

      <EditClientModal
        visible={editModalVisible}
        onClose={() => setEditModalVisible(false)}
        client={client}
        onSave={(updatedClient) => {
          setClient(updatedClient);
          setEditModalVisible(false);
        }}
      />
      <DeleteModal
        visible={deleteModalVisible}
        onClose={() => setDeleteModalVisible(false)}
        client={client}
      />
      <ShareModal
        visible={shareModalVisible}
        onClose={() => setShareModalVisible(false)}
        client={client}
      />
    </SafeAreaView>
  );
}