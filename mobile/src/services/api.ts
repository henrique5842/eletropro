import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "@env";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem("userToken");

    if (config.url?.includes("/auth/profile")) {
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    if (response.config.url?.includes("/auth/profile")) {
    }
    return response;
  },
  async (error) => {
    if (error.config?.url?.includes("/auth/profile")) {
    }

    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      await AsyncStorage.removeItem("userToken");
      await AsyncStorage.removeItem("tokenExpiration");

      return Promise.reject(
        new Error("Sessão expirada. Por favor, faça login novamente.")
      );
    }

    return Promise.reject(error);
  }
);

export const ensureValidToken = async (): Promise<boolean> => {
  try {
    const token = await AsyncStorage.getItem("userToken");
    const expiration = await AsyncStorage.getItem("tokenExpiration");

    if (!token || !expiration) {
      return false;
    }

    const expirationTime = parseInt(expiration, 10);

    if (Date.now() > expirationTime - 60 * 60 * 1000) {
      try {
        const response = await api.post("/auth/refresh-token", { token });
        const newExpirationTime = Date.now() + 24 * 60 * 60 * 1000;

        await AsyncStorage.setItem("userToken", response.data.token);
        await AsyncStorage.setItem(
          "tokenExpiration",
          newExpirationTime.toString()
        );

        return true;
      } catch (error) {
        await AsyncStorage.removeItem("userToken");
        await AsyncStorage.removeItem("tokenExpiration");
        return false;
      }
    }

    return true;
  } catch (error) {
    return false;
  }
};

export const tokenManager = {
  getToken: async () => {
    return await AsyncStorage.getItem("userToken");
  },

  setToken: async (token: string, expirationTime: number) => {
    await AsyncStorage.setItem("userToken", token);
    await AsyncStorage.setItem("tokenExpiration", expirationTime.toString());
  },

  removeToken: async () => {
    await AsyncStorage.removeItem("userToken");
    await AsyncStorage.removeItem("tokenExpiration");
  },

  isTokenValid: async () => {
    const token = await AsyncStorage.getItem("userToken");
    const expiration = await AsyncStorage.getItem("tokenExpiration");

    if (!token || !expiration) {
      return false;
    }

    return Date.now() < parseInt(expiration, 10);
  },
};
