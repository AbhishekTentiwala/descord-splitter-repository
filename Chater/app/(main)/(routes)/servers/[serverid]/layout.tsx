import { redirect } from "next/navigation";
import { ServerSidebar } from "@/components/sever/server-sidebar";
import { backendApi } from "@/lib/api-server";

const SreverIdLayout = async ({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ serverid: string }>;
}) => {
  const { serverid } = await params;
  const server = await backendApi
    .get<{ id: string; name: string; imageUrl: string }>(
      `/api/servers/${serverid}`
    )
    .catch(() => {
      return redirect("/");
    });

  if (!server) {
    return redirect("/");
  }

  return (
    <div className="h-full">
      <div className="hidden md:flex h-full w-60 z-20 flex-col fixed inset-y-0">
        <ServerSidebar serverid={serverid} />
      </div>
      <main className="h-full md:pl-60">
        {children}
      </main>
    </div>
  );
};

export default SreverIdLayout;