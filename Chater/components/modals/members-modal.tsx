"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuPortal, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuTrigger, DropdownMenuSubTrigger } from "@/components/ui/dropdown-menu";
import { useModal } from "@/hooks/use-model-store"

import { useState } from "react";
import axios from "axios";
import { apiUrl } from "@/lib/api";
import { UserAvatar } from "@/components/ui/user.avatar";
import { ServerWithMembersWithProfiles } from "@/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import qs from "query-string"
import { Check, Gavel, Loader2, MoreVertical, Shield, ShieldAlert, ShieldCheck, ShieldQuestion } from "lucide-react";
import { MemberRole } from "@prisma/client";
import { useRouter } from "next/navigation";
import { roleIconMap, roleHierarchy } from "./member-role-icons";

export const MembersModal = () => {

  const { onOpen, isOpen, onClose, type, data } = useModal()
  const [LoadingId, setLoadingId] = useState("")

  const { server, currentUserRole, currentUserId } = data as { 
    server: ServerWithMembersWithProfiles; 
    currentUserRole: MemberRole;
    currentUserId: string;
  };
  const router = useRouter()
  const isModalOpen = isOpen && type === "members";
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const inviteUrl = `${origin}/invite/${server?.inviteCode}`

  const [isloading, setisloading] = useState(false)
  
  const isCurrentUserAdmin = currentUserRole === MemberRole.Admin;
  const isCurrentUserModerator = currentUserRole === MemberRole.Moderater || isCurrentUserAdmin;
  
  const canManageRoles = isCurrentUserAdmin || isCurrentUserModerator;
  const canAssignAdmin = isCurrentUserAdmin;
  const canAssignModerator = isCurrentUserAdmin || isCurrentUserModerator;
  
  const getAvailableRoles = (targetRole: MemberRole): MemberRole[] => {
    const currentUserLevel = roleHierarchy[currentUserRole];
    const targetLevel = roleHierarchy[targetRole];
    
    // Can't manage yourself or someone with higher/equal role (except owner)
    if (currentUserLevel <= targetLevel) return [];
    
    const roles: MemberRole[] = ["Guest"];
    if (canAssignModerator) roles.push("Moderater");
    if (canAssignAdmin) roles.push("Admin");
    return roles;
  };

  const onKick = async (memberId: string) => {
    try {
      setLoadingId(memberId);
      const url = qs.stringifyUrl({
        url: apiUrl(`/api/members/${memberId}`),
        query: {
          serverId: server.id,
        }
      })
      const response = await axios.delete(url)
      router.refresh()
      onOpen("members", { server: response.data, currentUserRole, currentUserId })

    } catch (error) {
      console.log(error);

    }
    finally {
      setLoadingId("");
    }

  }
  const onRoleChane = async (memberId: string, role: MemberRole) => {
    try {
      setLoadingId(memberId);
      const url = qs.stringifyUrl({
        url: apiUrl(`/api/members/${memberId}`),
        query: {
          serverId: server.id,
        }
      })

      const response = await axios.patch(url, { role });
      router.refresh();
      onOpen("members", { server: response.data, currentUserRole, currentUserId })


    } catch (error) {
      console.log(error);

    }
    finally {
      setLoadingId("");
    }

  }

  return (
    <Dialog open={isModalOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white  text-black fixed  overflow-hidden">
        <DialogHeader className="pt-8 px-6">
          <DialogTitle className="text-2xl text-center font-bold">
            Manage Members
          </DialogTitle>
          <DialogDescription
            className="text-center text-zinc-500"
          >
            {server?.members?.length} Members
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="mt-8 max-h-[420px] pr-6">
          {server?.members?.map((member) => {
            const isOwner = server.profileId === member.profileId;
            const isSelf = currentUserId === member.profileId;
            const targetRole = member.role as MemberRole;
            const availableRoles = getAvailableRoles(targetRole);
            const canKick = !isOwner && !isSelf && roleHierarchy[currentUserRole] > roleHierarchy[targetRole];
            
            return (
            <div key={member.id} className="flex items-center gap-x-2 mb-6">
              <UserAvatar src={member.profile.imageUrl} />
              <div className="flex flex-col gap-y-1">
                <div className="text-xs font-semibold flex items-center gap-x-1">
                  {member.profile.username}
                  {roleIconMap[member.role]}
                </div>
                <p className="text-xs text-zinc-500">
                  {member.profile.email}
                </p>
              </div>
              {(canManageRoles || canKick) && LoadingId != member.id &&
                <div className="ml-auto">
                  <DropdownMenu>
                    <DropdownMenuTrigger>
                      <MoreVertical className="h-4 w-4 text-zinc-600 mr-2" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      {canManageRoles && availableRoles.length > 0 && (
                        <>
                          <DropdownMenuSub>
                            <DropdownMenuSubTrigger className="flex items-center">
                              <ShieldQuestion className="h-4 w-4 mr-2" />
                              <span>Role</span>
                            </DropdownMenuSubTrigger>
                            <DropdownMenuPortal>
                              <DropdownMenuSubContent>
                                {availableRoles.map((role) => (
                                  <DropdownMenuItem 
                                    key={role}
                                    onClick={() => onRoleChane(member.id, role)}>
                                    {role === "Guest" && <Shield className="h-4 w-4 mr-2" />}
                                    {role === "Moderater" && <ShieldCheck className="h-4 w-4 mr-2" />}
                                    {role === "Admin" && <ShieldAlert className="h-4 w-4 mr-2" />}
                                    {role}
                                    {member.role === role && <Check className="h-4 w-4 ml-auto" />}
                                  </DropdownMenuItem>
                                ))}
                              </DropdownMenuSubContent>
                            </DropdownMenuPortal>
                          </DropdownMenuSub>
                          <DropdownMenuSeparator />
                        </>
                      )}
                      {canKick && (
                        <DropdownMenuItem
                          onClick={() => onKick(member.id)}>
                          <Gavel className="w-4 h-4 mr-2" />
                          Kick
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              }
              {LoadingId === member.id && <Loader2 className="animate-spin text-zinc-500 ml-auto w-4 h-4" />}
            </div>
          )}
        )}
        </ScrollArea>

      </DialogContent>
    </Dialog>
  )
}