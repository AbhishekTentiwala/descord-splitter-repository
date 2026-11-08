"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import qs from "query-string";
import { useSocket } from "@/components/provider/socket-provider";
import { useAuth } from "@clerk/nextjs";

interface ChatQueryProps {
  queryKey: string;
  apiUrl: string;
  paramKey: "channelId" | "conversationId";
  paramValue: string;
}

export const useChatQuery = ({
  queryKey,
  apiUrl: apiPath,
  paramKey,
  paramValue,
}: ChatQueryProps) => {
  const { isConnected } = useSocket();
  const { getToken } = useAuth();

  const fetchMessages = async ({ pageParam = undefined }) => {
    const url = qs.stringifyUrl({
      url: apiPath,
      query: {
        cursor: pageParam,
        [paramKey]: paramValue,
      },
    }, { skipNull: true });

    const token = await getToken();
    console.log("[useChatQuery] Fetching:", url);
    console.log("[useChatQuery] Token:", token ? "present" : "missing", token?.slice(0, 20));
    
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const res = await fetch(url, {
      credentials: "include",
      headers,
    });

    console.log("[useChatQuery] Response status:", res.status, res.ok);

    if (!res.ok) {
      const errorText = await res.text().catch(() => "Unknown error");
      console.error("[useChatQuery] Error response:", errorText);
      throw new Error(`Failed to fetch messages: ${res.status} ${errorText}`);
    }

    const data = await res.json();
    console.log("[useChatQuery] Data received:", data?.items?.length || 0, "items");
    return data;
  };

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status } = useInfiniteQuery({
    queryKey: [queryKey],
    queryFn: fetchMessages,
    getNextPageParam: (lastPage) => lastPage?.nextCursor,
    initialPageParam: undefined,
    refetchInterval: isConnected ? false : 1000,
  });

  return {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
  };
};