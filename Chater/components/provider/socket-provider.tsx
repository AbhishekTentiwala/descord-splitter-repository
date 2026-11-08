"use client";

import React, { useState, useContext, useEffect, createContext } from "react";
import { io as ClientIO } from "socket.io-client";
import { useAuth } from "@clerk/nextjs";
import { socketUrl } from "@/lib/api";

type SocketContextType = {
  socket: any | null;
  isConnected: boolean;
};

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
});

export const useSocket = () => {
  return useContext(SocketContext);
};

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const [socket, setSocket] = useState<any>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { getToken } = useAuth();

  useEffect(() => {
    let socketInstance: any;

    const initSocket = async () => {
      const token = await getToken();

      socketInstance = new (ClientIO as any)(socketUrl(''), {
        path: "/api/socket/io",
        addTrailingSlash: false,
        withCredentials: true,
        auth: token ? { token } : undefined,
        extraHeaders: token ? { Authorization: `Bearer ${token}` } : undefined,
        transports: ['websocket', 'polling'],
      });

      socketInstance.on("connect", () => {
        setIsConnected(true);
      });

      socketInstance.on("disconnect", () => {
        setIsConnected(false);
      });

      setSocket(socketInstance);
    };

    initSocket();

    return () => {
      if (socketInstance) {
        socketInstance.disconnect();
      }
    };
  }, [getToken]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};