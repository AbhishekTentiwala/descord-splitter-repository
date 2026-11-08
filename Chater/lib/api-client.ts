"use client";

import axios from "axios";
import { useAuth } from "@clerk/nextjs";

export function useApiClient() {
  const { getToken } = useAuth();

  const apiClient = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || "",
  });

  apiClient.interceptors.request.use(async (config) => {
    const token = await getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  const checkUsername = async (username: string) => {
    const token = await getToken();
    const response = await axios.get(
      `${process.env.NEXT_PUBLIC_API_URL || ""}/api/profile/check-username`,
      { 
        params: { username }, 
        headers: token ? { Authorization: `Bearer ${token}` } : {} 
      }
    );
    return response.data;
  };

  // Return the axios instance with checkUsername attached
  return Object.assign(apiClient, { checkUsername });
}

export const apiUrl = (path: string) => `${process.env.NEXT_PUBLIC_API_URL || ""}${path}`;
export const socketUrl = (path: string) => `${process.env.NEXT_PUBLIC_SOCKET_URL || ""}${path}`;