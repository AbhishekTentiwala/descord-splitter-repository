"use client"

import { cn } from "@/lib/utils";
import { MemberRole } from "@prisma/client";
import { ShieldAlert, ShieldCheck } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { UserAvatar } from "../ui/user.avatar";

interface ProfileData {
  id: string;
  username: string;
  imageUrl: string;
  email: string;
}

interface MemberData {
  id: string;
  profileId: string;
  role: MemberRole;
  profile: ProfileData;
}

interface ServerData {
  id: string;
  name: string;
  imageUrl: string;
  inviteCode: string;
}

const roleiconMap = {
  [MemberRole.Guest]: null,
  [MemberRole.Admin]: <ShieldAlert className="mr-2 h-4 w-4 text-red-500" />,
  [MemberRole.Moderater]: <ShieldCheck className="mr-2 h-4 w-4 text-indigo-500" />,

}

interface ServerMemberProps {
  member: MemberData;
  server: ServerData
}
const ServerMember = ({ member, server }: ServerMemberProps) => {
  const icon = roleiconMap[member.role]
  const router = useRouter()
  const params = useParams()

  const onClick = () => {
    router.push(`/servers/${params?.serverid}/conversations/${member.id}`)
  }
  return (
    <button onClick={onClick} className={cn("group px-2 py-2 rounded-md flex items-center gap-x-2 w-full hover:bg-zinc-700/10 dark:hover:bg-zinc-700/50 transition mb-1",
      params?.memberId === member.id && "bg-zinc-700/20 dark:bg-zinc-700 "
    )}>
      <UserAvatar src={member.profile.imageUrl} className="h-8 w-8 md:h-8 md:w-8" />
      <p
        className={cn("font-semibold text-sm text-zinc-500 group-hover:text-zinc-600 dark:text-zinc-400 dark:group-hover:text-zinc-300 transition",
          params?.memberId === member.id && "text-primary dark:text-zinc-200 dark:group-hover:text-white"
        )}
      >
        {member.profile.username}
      </p>
      {icon}
    </button>
  )
}

export default ServerMember;