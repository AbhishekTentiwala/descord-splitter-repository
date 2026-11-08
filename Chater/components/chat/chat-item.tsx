import { Member, MemberRole, Profile } from "@prisma/client";
import { UserAvatar } from "../ui/user.avatar";
import { ActionTooltip } from "../action-tooltip";
import { useRouter, useParams } from "next/navigation";
import { Edit, FileIcon, ShieldAlert, ShieldCheck, Trash } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import * as z from "zod"
import qs from "query-string"
import { useApiClient } from "@/lib/api-client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormField, FormControl, FormItem } from "../ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useModal } from "@/hooks/use-model-store";

interface ChatItemProps {
  id: string;
  content: string;
  member: Member & {
    profile: Profile
  }
  timestamp: string;
  fileUrl: string | null;
  currentMember: Member
  deleted: boolean;
  isUpdated: boolean;
  socketUrl: string;
  restApiUrl: string;
  socketQuery: Record<string, string>
}

const roleiconMap = {
  "Guest": null,
  [MemberRole.Admin]: <ShieldAlert className="mr-2 h-4 w-4 text-red-500" />,
  "Moderater": <ShieldCheck className="mr-2 h-4 w-4 text-indigo-500" />,

}
const formSchema = z.object({
  content: z.string().min(1),
})

const checkFileType = async (url: string | null) => {
  if (!url) {
    return "text"
  }
  const response = await fetch(url, { method: 'HEAD' });

  // Look at the Content-Type header
  const contentType = response.headers.get('Content-Type');
  return `${contentType}`
};

export const ChatItem = ({ id, content, currentMember, member, timestamp, fileUrl, deleted, isUpdated, socketQuery, socketUrl, restApiUrl }: ChatItemProps) => {
  useEffect(() => {
    const handleKeyDown = (event: any) => {
      if (event.key === "ESCAPE" || event.keyCode === 27) {
        setisEditing(false)
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [])
  const isAdmin = currentMember.role === MemberRole.Admin;
  const isModerater = currentMember.role === MemberRole.Moderater;
  const isOwner = currentMember.id === member.id;
  const canDeleteMessage = !deleted && isAdmin || isOwner || isModerater
  const canEditMessage = !deleted && isOwner && !fileUrl
  const isFile = fileUrl !== null
  const [isEditing, setisEditing] = useState(false)
  const { onOpen } = useModal()
  const api = useApiClient();

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      content: content
    }
  })


  const isLoading = form.formState.isSubmitting;
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const url = qs.stringifyUrl({
        url: `${restApiUrl}/${id}`,
        query: socketQuery,
      })
      await api.patch(url, values)

      form.reset()
      setisEditing(false)

    } catch (error) {
      console.log(error);

    }

  }

  const params = useParams()
  const router = useRouter()
  const onMemberClick = () => {
    if (member.id === currentMember.id) {
      return;
    }

    router.push(`/servers/${params?.serverid}/conversations/${member.id}`)
  }


  useEffect(() => {
    form.reset({
      content: content
    })
  }, [content])


  return (
    <div className="relative group flex  items-center hover:bg-black/5 p-4 w-full transition">
      <div className="group flex gap-x-2 items-start w-full">
        <div onClick={onMemberClick} className="cursor-pointer hover:drop-shadow-md transition">
          <UserAvatar src={member.profile.imageUrl} />
        </div>
        <div className="flex flex-col w-full">
          <div className="flex  items-center gap-x-2">
            <div className="flex items-center">
              <p onClick={onMemberClick} className="font-semibold text-sm hover:underline cursor-pointer">
                {member.profile.username}
              </p>
              <ActionTooltip lebel={member.role}>
                {roleiconMap[member.role]}
              </ActionTooltip>
            </div>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              {timestamp}
            </span>
          </div>

          {fileUrl && (
            <div className="relative flex items-center p-2 mt-2 rounded-md bg-background/10">
              {/* <Image width={100} height={100} className="" src={fileUrl} alt="file" /> */}
              <FileIcon className="h-10 w-10 fill-pink-200 stroke-pink-400" />
              <a href={fileUrl} target="_blank"
                rel="noopener noreferrer"
                className="ml-2 w-80 flex flex-wrap text-sm text-pink-500 dark:text-pink-400 hover:underline">
                {content}
              </a>

            </div>
          )}
          {!fileUrl && !isEditing && (
            <p className={cn("text-sm text-zinc-600 dark:text-zinc-300",
              deleted && "italic text-zinc-500 dark:text-zinc-400 text-xs mt-1"
            )}>
              {content}
              {isUpdated && !deleted && (
                <span className="text-[10px] mx-2 text-zinc-500 dark:text-zinc-400 ">
                  (edited)
                </span>
              )}
            </p>
          )}
          {!fileUrl && isEditing && (
            <Form {...form}>
              <form className=" flex items-center w-full gapx-2 pt-2"
                onSubmit={form.handleSubmit(onSubmit)}>
                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormControl>
                        <div className="relative w-full">
                          <Input
                            disabled={isLoading}
                            className="p-2 bg-zinc-200/90 dark:bg-zinc-700/75 border-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-zinc-600 dark:text-zinc-200"
                            placeholder="Edited message"
                            {...field}
                          />
                        </div>
                      </FormControl>
                    </FormItem>
                  )}
                />
                <Button disabled={isLoading} size="sm" variant="primary">
                  Save
                </Button>
              </form>
              <span className="text-[10px] ,mt-1 text-zinc-400">
                Press Escape to cancel,enter to save
              </span>
            </Form>
          )}

        </div>
      </div>
      {canDeleteMessage && (
        <div
          className="hidden group-hover:flex items-center gap-x-2 absolute -top-2 p-1 right-5 bg-white dark:bg-zinc-800 border rounded-sm">
        {canEditMessage && (
          <ActionTooltip lebel="Edit">
            <Edit
              onClick={() => setisEditing(true)} className="cursor-pointer ml-auto w-4 h-4 text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 transition " />
          </ActionTooltip>
        )}
        <ActionTooltip lebel="Delete">
          <Trash
            onClick={() => onOpen("deleteMessage", {
              restApiUrl: restApiUrl,
              query: socketQuery,
              messageId: id,
              type: restApiUrl.includes("/direct-messages") ? "conversation" : "channel"
            })} className="cursor-pointer ml-auto w-4 h-4 text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 transition " />
        </ActionTooltip>
      </div>

      )}
    </div>
  )
}