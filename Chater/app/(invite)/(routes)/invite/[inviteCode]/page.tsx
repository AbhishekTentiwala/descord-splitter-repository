import { redirect } from "next/navigation";
import { backendApi } from "@/lib/api-server";

interface InviteCodePageProps {
  params: Promise<{
    inviteCode: string;
  }>;
};

const inviteCodePage = async ({ params }: InviteCodePageProps) => {
  const { inviteCode } = await params;
  try {
    if (!inviteCode) {
      return redirect("/")
    }

    const server = await backendApi.post<{ id: string }>(`/api/servers/join`, {
      inviteCode
    }).catch(async () => {
      // Check if already a member
      const existingServer = await backendApi.get<{ id: string }>(`/api/servers/invite/${inviteCode}`);
      if (existingServer) {
        return redirect(`/servers/${existingServer.id}`);
      }
      throw new Error("Invalid invite");
    });

    if (server) {
      return redirect(`/servers/${server.id}`)
    }
  } catch {
    return redirect("/");
  }

  return null;
};

export default inviteCodePage;