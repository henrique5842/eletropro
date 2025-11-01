import AsyncStorage from "@react-native-async-storage/async-storage";
import { api } from "../services/api";

interface ValidationResult {
  isValid: boolean;
  error?: string;
}

interface UserInfo {
  id: string;
  name: string;
  email: string;
  cnpj?: string;
  phone?: string;
  avatar?: string;
  companyName?: string;
}

export const authContext = {
  async checkTokenStatus(): Promise<void> {
    const token = await AsyncStorage.getItem("userToken");
    const expiration = await AsyncStorage.getItem("tokenExpiration");

    if (token) {
    }

    if (expiration) {
      const expirationDate = new Date(parseInt(expiration, 10));
      const isValid = Date.now() < parseInt(expiration, 10);
    } else {
    }
  },

  async login(email: string, password: string): Promise<any> {
    try {
      const response = await api.post("/auth/login", { email, password });
      const expirationTime = Date.now() + 30 * 24 * 60 * 60 * 1000;

      await AsyncStorage.setItem("userToken", response.data.token);
      await AsyncStorage.setItem("tokenExpiration", expirationTime.toString());

      if (response.data.user) {
        await AsyncStorage.setItem(
          "userData",
          JSON.stringify(response.data.user)
        );
      } else {
      }

      this.checkTokenStatus();

      return response.data;
    } catch (error: unknown) {
      throw new Error(
        "Login falhou: " +
          (error instanceof Error ? error.message : "erro desconhecido")
      );
    }
  },

  async validateToken(token: string): Promise<boolean> {
    try {
      return token !== null && token !== undefined;
    } catch (error: unknown) {
      return false;
    }
  },

  async logout(): Promise<void> {
    await AsyncStorage.removeItem("userToken");
    await AsyncStorage.removeItem("tokenExpiration");
    await AsyncStorage.removeItem("userData");
  },

  async isLoggedIn(): Promise<boolean> {
    const token = await AsyncStorage.getItem("userToken");
    const expiration = await AsyncStorage.getItem("tokenExpiration");

    if (token && expiration) {
      const isValid = Date.now() < parseInt(expiration, 10);
      const expirationDate = new Date(parseInt(expiration, 10));
    }

    return false;
  },

  async getUserInfo(): Promise<UserInfo | null> {
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) {
        return null;
      }

      const cachedData = await AsyncStorage.getItem("userData");
      let cachedUserData = null;

      if (cachedData) {
        cachedUserData = JSON.parse(cachedData);
      } else {
      }

      try {
        const response = await api.get("/auth/profile");

        let userData = null;

        if (response.data && response.data.user) {
          userData = response.data.user;
        } else if (response.data && response.data.id) {
          userData = response.data;
        } else {
          for (const key in response.data) {
            if (
              response.data[key] &&
              typeof response.data[key] === "object" &&
              (response.data[key].id || response.data[key].name)
            ) {
              userData = response.data[key];
              break;
            }
          }
        }

        if (userData) {
          if (!userData.name || userData.name.trim() === "") {
          }

          let finalUserData = userData;
          if (cachedUserData) {
            finalUserData = {
              ...cachedUserData,
              ...userData,
            };

            Object.keys(finalUserData).forEach((key) => {
              if (
                finalUserData[key] === null ||
                finalUserData[key] === undefined ||
                finalUserData[key] === ""
              ) {
                if (cachedUserData[key]) {
                  finalUserData[key] = cachedUserData[key];
                }
              }
            });
          }

          await AsyncStorage.setItem("userData", JSON.stringify(finalUserData));

          return finalUserData;
        } else {
          throw new Error("Dados não encontrados na resposta da API");
        }
      } catch (apiError) {
        if (cachedUserData) {
          if (
            cachedUserData.id &&
            cachedUserData.name &&
            cachedUserData.email
          ) {
            return cachedUserData;
          } else {
          }
        }

        throw new Error(
          "Erro ao obter dados do usuário: API indisponível e cache inválido"
        );
      }
    } catch (error) {
      try {
        const cachedData = await AsyncStorage.getItem("userData");
        if (cachedData) {
          const userData = JSON.parse(cachedData);

          return userData;
        }
      } catch (cacheError) {}

      return null;
    }
  },

  async checkEmail(email: string): Promise<void> {
    try {
      await api.post("/auth/check-email", { email });
    } catch (error: unknown) {
      throw new Error(
        "Email não encontrado: " +
          (error instanceof Error ? error.message : "erro desconhecido")
      );
    }
  },

  async checkResetCode(email: string, code: string): Promise<void> {
    try {
      await api.post("/auth/check-reset-code", { email, code });
    } catch (error: unknown) {
      throw new Error("Código inválido");
    }
  },

  async sendResetCode(email: string): Promise<void> {
    try {
      await api.post("/auth/forgot-password", { email });
    } catch (error: unknown) {
      throw new Error(
        "Erro ao enviar código de redefinição: " +
          (error instanceof Error ? error.message : "erro desconhecido")
      );
    }
  },

  validatePassword(
    password: string,
    confirmPassword: string
  ): ValidationResult {
    if (!password) {
      return { isValid: false, error: "Senha é obrigatória" };
    }
    if (password.length < 6) {
      return { isValid: false, error: "Senha deve ter no mínimo 6 caracteres" };
    }
    if (password !== confirmPassword) {
      return { isValid: false, error: "As senhas não coincidem" };
    }
    return { isValid: true };
  },

  async resetPassword(
    email: string,
    code: string,
    newPassword: string,
    confirmPassword: string
  ): Promise<void> {
    const validation = this.validatePassword(newPassword, confirmPassword);
    if (!validation.isValid) {
      throw new Error(validation.error);
    }

    try {
      await api.post("/auth/reset-password", { email, code, newPassword });
    } catch (error: unknown) {
      throw new Error(
        "Erro ao redefinir a senha: " +
          (error instanceof Error ? error.message : "erro desconhecido")
      );
    }
  },

  async updateProfile(userData: Partial<UserInfo>): Promise<UserInfo | null> {
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) {
        throw new Error("Usuário não autenticado");
      }

      let currentUserData = null;
      try {
        const cachedData = await AsyncStorage.getItem("userData");
        if (cachedData) {
          currentUserData = JSON.parse(cachedData);
        }
      } catch (e) {}

      const response = await api.put("/auth/profile", userData);

      let updatedUserData = null;

      if (response.data && response.data.user) {
        updatedUserData = response.data.user;
      } else if (response.data && response.data.id) {
        updatedUserData = response.data;
      } else {
        for (const key in response.data) {
          if (
            response.data[key] &&
            typeof response.data[key] === "object" &&
            response.data[key].id
          ) {
            updatedUserData = response.data[key];
            break;
          }
        }
      }

      if (updatedUserData) {
        let finalUserData = updatedUserData;

        if (currentUserData) {
          finalUserData = {
            ...currentUserData,
            ...updatedUserData,
            ...userData,
          };
        }

        await AsyncStorage.setItem("userData", JSON.stringify(finalUserData));

        return finalUserData;
      } else {
        if (currentUserData && userData) {
          const mergedData = { ...currentUserData, ...userData };
          await AsyncStorage.setItem("userData", JSON.stringify(mergedData));

          return mergedData;
        }

        return await this.getUserInfo();
      }
    } catch (error) {
      if (userData && Object.keys(userData).length > 0) {
        try {
          const cachedData = await AsyncStorage.getItem("userData");
          if (cachedData) {
            const currentData = JSON.parse(cachedData);
            const mergedData = { ...currentData, ...userData };
            await AsyncStorage.setItem("userData", JSON.stringify(mergedData));

            return mergedData;
          }
        } catch (cacheError) {}
      }

      throw new Error(
        "Erro ao atualizar perfil: " +
          (error instanceof Error ? error.message : "erro desconhecido")
      );
    }
  },

  async refreshUserData(): Promise<UserInfo | null> {
    try {
      const currentCache = await AsyncStorage.getItem("userData");

      const freshData = await this.getUserInfo();

      if (freshData) {
        return freshData;
      } else {
        if (currentCache) {
          await AsyncStorage.setItem("userData", currentCache);
        }
        throw new Error("Falha ao obter dados atualizados");
      }
    } catch (error) {
      throw error;
    }
  },
};
