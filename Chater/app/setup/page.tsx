import { initialProfile } from "@/lib/initial-profile";
import { redirect } from "next/navigation";
import { backendApi } from "@/lib/api-server";
import { InitialModel } from "@/components/modals/initial-model";
import { UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";

const SetupPage = async () => {
  // Get the Clerk token for backend API calls
  const { getToken } = await auth();
  const clerkToken = await getToken();

  const profile = await initialProfile(clerkToken ?? undefined);
  const servers = await backendApi.get<Array<{ id: string }>>("/api/servers", { clerkToken: clerkToken ?? undefined }).catch(() => []);
  const server = servers[0];

  if (server) {
    const serverWithChannels = await backendApi.get<{
      id: string;
      channels: Array<{ id: string; name: string }>;
    }>(`/api/servers/${server.id}`, { clerkToken: clerkToken ?? undefined }).catch(() => null);

    const generalChannel = serverWithChannels?.channels.find(c => c.name === "general");

    if (generalChannel) {
      return redirect(`/servers/${server.id}/channels/${generalChannel.id}`);
    }

    return redirect(`/servers/${server.id}`);
  }

  // Check if user has a username already set (not empty)
  const hasUsername = profile?.username && profile.username.trim() !== "";

  if (hasUsername) {
    // User has username but no server - redirect to create server or show create server modal
    // For now, redirect to home which will show the create server option
    return redirect("/servers/create");
  }

  return (
    <div>
      <InitialModel></InitialModel>
      <UserButton></UserButton>
    </div>
  );
};

export default SetupPage;