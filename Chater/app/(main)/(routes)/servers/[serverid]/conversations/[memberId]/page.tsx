import Chatheader from "@/components/chat/chat-header";
import { redirect } from "next/navigation";
import { ChatMessages } from "@/components/chat/chat-messages";
import { ChatInput } from "@/components/chat/chat-input";
import { MediaRoom } from "@/components/media-room"; 
import { backendApi } from "@/lib/api-server";
import { apiUrl, socketUrl } from "@/lib/api";
import { MemberRole } from "@prisma/client";

interface MemberIdpageprops {
  params: Promise<{
    memberId: string;
    serverid: string;
  }>;
  searchParams: Promise<{
    video?: boolean;
  }>;
}

interface MemberProfile {
  id: string;
  username: string;
  imageUrl: string;
}

interface CurrentMember {
  id: string;
  profileId: string;
  role: MemberRole;
  serverId: string;
  createdAt: Date;
  updatedAt: Date;
  profile: MemberProfile;
}

interface ConversationMember {
  profileId: string;
  profile: MemberProfile;
}

interface ConversationResponse {
  id: string;
  memberOne: ConversationMember;
  memberTwo: ConversationMember;
}

const MemberIdpage = async ({ params, searchParams }: MemberIdpageprops) => {
  const { memberId, serverid } = await params;
  const resolvedSearchParams = await searchParams;

  const currentMember = await backendApi.get<CurrentMember>(`/api/members/${memberId}?serverId=${serverid}`).catch(() => {
    return redirect("/");
  });

  const conversation = await backendApi.post<ConversationResponse>(`/api/direct-messages/conversation`, {
    memberOneId: currentMember.id,
    memberTwoId: memberId,
  }).catch(() => {
    return redirect(`/servers/${serverid}`);
  });

  if (!conversation) {
    return redirect(`/servers/${serverid}`);
  }
  const { memberOne, memberTwo } = conversation;

  const otherMember = memberOne.profileId === currentMember.profileId ? memberTwo : memberOne;

  return ( 
    <div className="bg-white dark:bg-[#313338] flex flex-col h-full">
      <Chatheader 
        imageUrl={otherMember.profile.imageUrl}
        name={otherMember.profile.username}
        serverid={serverid}
        type="conversation"
      />
      
      {resolvedSearchParams?.video && (
        <MediaRoom chatId={conversation.id} audio video />
      )}
      
      {!resolvedSearchParams?.video && (
        <>
          <ChatMessages
            member={currentMember}
            name={otherMember.profile.username}
            chatId={conversation.id}
            type="conversation"
            apiUrl={apiUrl("/api/direct-messages")}
            restApiUrl={apiUrl("/api/direct-messages")}
            paramKey="conversationId"
            paramValue={conversation.id}
            socketUrl={socketUrl("/api/socket/direct-messages")}
            socketQuery={{ conversationId: conversation.id }}
          />
          <ChatInput
            name={otherMember.profile.username}
            type="conversation"
            apiUrl={apiUrl("/api/direct-messages")}
            query={{ conversationId: conversation.id }}
          />
        </>
      )}
    </div>
  );
};

export default MemberIdpage;