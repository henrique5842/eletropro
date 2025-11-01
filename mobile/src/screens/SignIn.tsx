import React, { useState } from "react";
import { SafeAreaView, View, Text } from "react-native";

import { authContext } from "../context/AuthContext";

import { FontAwesome6 } from "@expo/vector-icons";
import { Input, PasswordInput } from "../components/Input";
import { Button } from "../components/Button";
import { useNavigation } from "@react-navigation/native";

export function SignIn() {
  const navigation = useNavigation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleLogin() {
    try {
      const data = await authContext.login(email, password);
      console.log("Login bem-sucedido:", data);
      navigation.navigate("Home");
    } catch (err) {
      setError("Erro ao fazer login. Tente novamente.");
      console.error("Erro ao fazer login:", err);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-neutral-900 px-5">
      <View className="flex-row mt-16 items-center">
        <View className="w-14 h-14 bg-blue-500 rounded-xl items-center justify-center">
          <FontAwesome6 name="bolt" size={20} color="white" />
        </View>
        <Text className="pl-4 font-inter-black text-gray-300 text-base">
          ELETROPRO
        </Text>
      </View>
      <View className="flex-1 items-center justify-center">
        <Input
          title="E-MAIL"
          placeholder="exemplo@email.com"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
        />
        <PasswordInput
          title="SENHA"
          placeholder="*********"
          value={password}
          onChangeText={setPassword}
          autoCapitalize="none"
        />
        {error ? (
          <Text className="text-red-500 text-xs mt-3">{error}</Text>
        ) : null}
        <View className="flex w-screen px-5 mt-5">
          <Button placeholder="ENTRAR" onPress={handleLogin} />
        </View>
      </View>
    </SafeAreaView>
  );
}
