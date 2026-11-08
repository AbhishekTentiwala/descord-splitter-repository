import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { backendApi } from "@/lib/api-server";

interface ProfileResponse {
  id: string;
  username: string | null;
}

interface ServerResponse {
  id: string;
  channels: Array<{ id: string; name: string }>;
}

export default async function RootPage() {
  const { userId, getToken } = await auth();
  if (!userId) return redirect("/sign-in");

  const clerkToken = await getToken() ?? undefined;
  console.log("[RootPage] clerkToken:", clerkToken ? "present" : "missing");

  try {
    const profile: ProfileResponse = await backendApi.get<ProfileResponse>("/api/profile", { clerkToken });
    console.log("[RootPage] profile:", profile);

    const servers: Array<{ id: string }> = await backendApi.get<Array<{ id: string }>>("/api/servers", { clerkToken });
    console.log("[RootPage] servers:", servers);
    const server = servers[0];

    if (server) {
      const serverWithChannels: ServerResponse | null = await backendApi.get<ServerResponse>(`/api/servers/${server.id}`, { clerkToken }).catch(() => null);

      const generalChannel = serverWithChannels?.channels.find((c) => c.name === "general");

if (generalChannel) {
        const url = `/servers/${server.id}/channels/${generalChannel.id}`;
        return redirect(url);
      }

      return redirect(`/servers/${server.id}`);
    }

    // No servers - check if profile has username
    if (!profile?.username || profile.username.trim() === "") {
      return redirect("/setup");
    }

    // Has username but no servers - show main layout with "Add Server" button
    return null;
  } catch (error) {
    if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
      throw error;
    }
    console.error("[RootPage] Error:", error);
    return redirect("/setup");
  }
}