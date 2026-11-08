import { redirect } from "next/navigation";
import { ChannelType, MemberRole } from "@prisma/client";
import { ServerHeader } from "@/components/sever/server-header";
import { ScrollArea } from "../ui/scroll-area";
import ServerSearch from "./server-search";
import { Hash, Mic, ShieldAlert, ShieldCheck, VideoIcon } from "lucide-react";
import { Separator } from "../ui/separator";
import ServerSection from "./server-section";
import ServerChannel from "./server-channel";
import ServerMember from "./server-member";
import { backendApi } from "@/lib/api-server";
import { ServerData } from "@/hooks/use-model-store";

interface ServerSidebarProps {
  serverid: string;
}

const iconMap = {
  [ChannelType.Text]: <Hash className="mr-2 h-4 w-4" />,
  [ChannelType.Audio]: <Mic className="mr-2 h-4 w-4" />,
  [ChannelType.Video]: <VideoIcon className="mr-2 h-4 w-4" />
}

const roleiconMap = {
  [MemberRole.Guest]: null,
  [MemberRole.Admin]: <ShieldAlert className="mr-2 h-4 w-4 text-red-500" />,
  [MemberRole.Moderater]: <ShieldCheck className="mr-2 h-4 w-4 text-indigo-500" />,

}

export const ServerSidebar = async ({ serverid }: ServerSidebarProps) => {
  const profile = await backendApi.get<{
    id: string;
    userId: string;
    username: string;
    imageUrl: string;
    email: string;
  }>("/api/profile").catch(() => {
    return redirect('/');
  });

  if (!profile) {
    return redirect('/');
  }

  const server = await backendApi.get<ServerData>(`/api/servers/${serverid}`).catch(() => {
    return redirect('/');
  });

  if (!server) {
    return redirect('/')
  }

  const channels = server.channels || [];
  const members = server.members || [];

  const textChannels = channels.filter((channel) => channel.type === ChannelType.Text);
  const audioChannels = channels.filter((channel) => channel.type === ChannelType.Audio);
  const videoChannels = channels.filter((channel) => channel.type === ChannelType.Video);
  const filteredMembers = members.filter((member) => member.profileId !== profile.id)
  const role = (members.find((member) => member.profileId === profile.id)?.role as MemberRole) || undefined;
  return (
    <div className="flex flex-col h-full text-primary w-full dark:bg-[#2B2D31] bg-[#F2F3F5] ">
      <ServerHeader server={server} role={role} currentUserId={profile.id} />
      <ScrollArea className="flex-1 px-3">
        <div className="mt-2">
          <ServerSearch
            data={[
              {
                label: "Text Channels",
                type: "channel",
                data: textChannels?.map((channel) => ({
                  id: channel.id,
                  name: channel.name,
                  icon: iconMap[channel.type],
                }))

              }, {
                label: "Voice Channels",
                type: "channel",
                data: audioChannels?.map((channel) => ({
                  id: channel.id,
                  name: channel.name,
                  icon: iconMap[channel.type],
                }))

              }, {
                label: "Video Channels",
                type: "channel",
                data: videoChannels?.map((channel) => ({
                  id: channel.id,
                  name: channel.name,
                  icon: iconMap[channel.type],
                }))

              }, {
                label: "Members",
                type: "member",
                data: members?.map((member) => ({
                  id: member.id,
                  name: member.profile.username,
                  icon: roleiconMap[member.role as MemberRole],
                }))

              }
            ]}
          />
        </div>
        <Separator className="bg-zinc-200 dark:bg-zinc-700 rounded-md my-2" />
        {!!textChannels?.length && (
          <div className="mb-2">
            <ServerSection
              sectionType="channels"
              channelType={ChannelType.Text}
              role={role}
              label="Text Channels"
            />
            <div className="space-y-[2px]">{textChannels.map((channel) => (
              <ServerChannel
                key={channel.id}
                channel={channel}
                role={role}
                server={server}
              />
            ))}</div>

          </div>
        )}
        {!!audioChannels?.length && (
          <div className="mb-2">
            <ServerSection
              sectionType="channels"
              channelType={ChannelType.Audio}
              role={role}
              label="Voice Channels"
            />
            <div className="space-y-[2px]">{audioChannels.map((channel) => (
              <ServerChannel
                key={channel.id}
                channel={channel}
                role={role}
                server={server}
              />
            ))}</div>

          </div>
        )}
        {!!videoChannels?.length && (
          <div className="mb-2">
            <ServerSection
              sectionType="channels"
              channelType={ChannelType.Video}
              role={role}
              label="Video Channels"
            />
            <div className="space-y-[2px]">{videoChannels.map((channel) => (
              <ServerChannel
                key={channel.id}
                channel={channel}
                role={role}
                server={server}
              />
            ))}</div>

          </div>
        )}
        {!!members?.length && (
          <div className="mb-2">
            <ServerSection
              sectionType="members"
              role={role}
              server={server}
              currentUserId={profile.id}
              label="Members"
            />
            <div className="space-y-[2px]">
              {members.map((member) => (
                <ServerMember
                key={member.id}
                member={{
                  ...member,
                  role: member.role as MemberRole
                }}
                server={server} />
              ))}</div>

          </div>
        )}
      </ScrollArea>
    </div>
  )
}