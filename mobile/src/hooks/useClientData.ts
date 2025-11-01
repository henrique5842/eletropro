import { useState, useCallback } from "react";
import {
  useNavigation,
  useRoute,
  RouteProp,
  useFocusEffect,
  NavigationProp,
} from "@react-navigation/native";
import { Alert } from "react-native";
import { clientContext } from "../context/ClientContext";

export interface Client {
  id: string;
  fullName: string;
  phone: string;
  email?: string;
  publicLink?: string;
  cpfCnpj?: string;
  requiresInvoice: boolean;
  cep: string;
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
  totalValue: number;
  clientSince: string;
  createdAt: string;
  updatedAt: string;
}

interface RouteParams {
  clientId: string;
}

type ClientDetailsNavigationProp = NavigationProp<Record<string, RouteParams>>;

export function useClientData() {
  const navigation = useNavigation<ClientDetailsNavigationProp>();
  const route = useRoute<RouteProp<{ params: RouteParams }, "params">>();

  const clientId = route.params?.clientId;

  const [client, setClient] = useState<Client | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadClient = useCallback(async () => {
    if (!clientId) {
      Alert.alert("Erro", "ID do cliente não fornecido.");
      if (navigation.canGoBack()) {
        navigation.goBack();
      }
      return;
    }

    try {
      setIsLoading(true);
      const clientData = await clientContext.getClientById(clientId);
      setClient(clientData);
    } catch (error) {
      Alert.alert(
        "Erro ao carregar",
        "Não foi possível carregar os dados do cliente.",
        [{ text: "OK", onPress: () => navigation.goBack() }]
      );
    } finally {
      setIsLoading(false);
    }
  }, [clientId, navigation]);

  useFocusEffect(
    useCallback(() => {
      loadClient();
    }, [loadClient])
  );

  return {
    client,
    setClient,
    isLoading,
    clientId,
  };
}
