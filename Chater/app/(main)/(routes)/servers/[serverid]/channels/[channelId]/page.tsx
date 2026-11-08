import Chatheader from "@/components/chat/chat-header"
import { ChatInput } from "@/components/chat/chat-input"
import { ChatMessages } from "@/components/chat/chat-messages"
import { redirect } from "next/navigation"
import { ChannelType, MemberRole } from "@prisma/client"
import { MediaRoom } from "@/components/media-room"
import { backendApi } from "@/lib/api-server"
import { apiUrl, socketUrl } from "@/lib/api"

interface ChannelidPageprops {
  params: Promise<{
    serverid: string;
    channelId: string;
  }>;
}

interface Member {
  id: string;
  profileId: string;
  role: MemberRole;
  serverId: string;
  createdAt: Date;
  updatedAt: Date;
}

const ChannelidPage = async ({ params }: ChannelidPageprops) => {
  const { channelId, serverid } = await params;

  const channel = await backendApi.get<{ id: string; serverId: string; name: string; type: ChannelType }>(`/api/channels/${channelId}?serverId=${serverid}`).catch(() => {
    return redirect('/');
  });

  const member = await backendApi.get<Member>(`/api/members/me?serverId=${channel.serverId}`).catch(() => {
    return redirect('/');
  });

  if (!channel || !member) {
    return redirect('/')
  }
  return ( 
    <div className="bg-white dark:bg-[#313338] flex flex-col h-full">
      <Chatheader
        name={channel.name}
        serverid={channel.serverId}
        type="channel"
      />
      {channel.type === ChannelType.Text ? (
        <>
          <ChatMessages
            member={member}
            name={channel.name}
            type="channel"
            apiUrl={apiUrl("/api/messages")}
            socketUrl={socketUrl("/api/socket/messages")}
            restApiUrl={apiUrl("/api/messages")}
            socketQuery={{ channelId: channel.id, serverId: channel.serverId }}
            paramKey="channelId"
            paramValue={channel.id}
            chatId={channel.id}
          />
          <ChatInput
            name={channel.name}
            type="channel"
            apiUrl={apiUrl("/api/messages")}
            query={{
              channelId: channel.id,
              serverId: channel.serverId,
            }}
          />
        </>
      ) : null}

      {channel.type === ChannelType.Audio ? (
        <MediaRoom chatId={channel.id} video={false} audio />
      ) : null}

      {channel.type === ChannelType.Video ? (
        <MediaRoom chatId={channel.id} video audio />
      ) : null}
    </div>
  );
};

export default ChannelidPage;