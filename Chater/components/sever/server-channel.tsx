"use client";
import { ChannelType, MemberRole } from "@prisma/client";
import { Edit, Hash, LockIcon, Mic, ShieldAlert, ShieldCheck, Trash, Video, VideoIcon } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { ActionTooltip } from "../action-tooltip";
import { ModelType, useModal, ServerData, ChannelData } from "@/hooks/use-model-store";

interface ServerChannelProps {
  channel: ChannelData;
  server: ServerData;
  role?: MemberRole
}

const iconMap = {
  [ChannelType.Text]: Hash,
  [ChannelType.Audio]: Mic,
  [ChannelType.Video]: Video
}

const ServerChannel = ({ channel, server, role }: ServerChannelProps) => {
  const { onOpen } = useModal()
  const params = useParams()
  const router = useRouter()
  const Icon = iconMap[channel.type]

  const onClick = () => {
    router.push(`/servers/${params?.serverid}/channels/${channel.id}`)
  }

  const onAction = (e: React.MouseEvent, action: ModelType) => {
    e.stopPropagation();
    onOpen(action, { channel, server })
  }

  return (
    <button
      onClick={onClick}
      className={cn("group px-2 py-2 rounded-md flex items-center gap-x-2 w-full hover:bg-zinc-700/10 dark:hover:bg-zinc-700/50 transition mb-1", params?.channelId === channel.id && "bg-zinc-700/20 dark:bg-zinc-700 ")}
    >
      <Icon className="flex-shrink-0 w-5 h-5 text-zinc-500" />
      <p className={cn("line-clamp-1 font-semibold text-sm text-zinc-500 group-hover:text-zinc-600 dark:text-zinc-400 dark:group-hover:text-zinc-300", params?.channelId === channel.id && "text-primary dark:text-zinc-200 dark:group-hover:text-white")}>
        {channel.name}
      </p>
      {channel.name !== "general" && role !== MemberRole.Guest && (
        <div className="ml-auto flex items-center gap-x-2">
          <ActionTooltip lebel="Edit">
            <Edit
              onClick={(e) => onAction(e, "edit-Channel")} className="hidden group-hover:block w-4 h-4 text-zinc-500 hover:text-zinc-600 dark:text-zinc-400 dark:hover:text-zinc-400 transition" />
          </ActionTooltip>
          <ActionTooltip lebel="Delete">
            <Trash
              onClick={(e) => onAction(e, "delete-Channel")} className="hidden group-hover:block w-4 h-4 text-zinc-500 hover:text-zinc-600 dark:text-zinc-400 dark:hover:text-zinc-400 transition" />
          </ActionTooltip>
        </div>
      )}
      {channel.name === "general" && (
        <div className="ml-auto flex items-center gap-x-2">
          <ActionTooltip lebel="not editable">
            <LockIcon className=" group-hover:block w-4 h-4 text-zinc-500 hover:text-zinc-600 dark:text-zinc-400 dark:hover:text-zinc-400 transition" />
          </ActionTooltip>
        </div>

      )}
    </button>
  );
};

export default ServerChannel;