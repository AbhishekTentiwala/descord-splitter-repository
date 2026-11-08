import { redirect } from "next/navigation";
import { backendApi } from "@/lib/api-server";

interface ServerIdPageprops {
  params: Promise<{
    serverid: string;
  }>;
}

const ServerIdPage = async ({ params }: ServerIdPageprops) => {
  const { serverid } = await params;
  try {
    const server = await backendApi.get<{
      id: string;
      channels: Array<{ id: string; name: string }>;
    }>(`/api/servers/${serverid}`);

    const initialchannel = server?.channels[0];
    if (initialchannel?.name !== "general") {
      return null;
    }
    return redirect(`/servers/${serverid}/channels/${initialchannel?.id}`);
  } catch (error) {
    // Only redirect to sign-in for auth errors (401/403)
    if (error instanceof Error && (error.message.includes('401') || error.message.includes('403') || error.message.includes('Unauthorized'))) {
      return redirect("/sign-in");
    }
    // For other errors (404, network, etc.) → go to server list
    return redirect("/");
  }
};

export default ServerIdPage;