"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";

import { useModal } from "@/hooks/use-model-store"
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Check, Copy, RefreshCw } from "lucide-react";
import { useOrigin } from "@/hooks/use-origin";
import { useState } from "react";
import { useApiClient } from "@/lib/api-client";


export const InviteModal = () => {

  const { onOpen, isOpen, onClose, type, data } = useModal()
  const origin = useOrigin();
  const { server } = data;
  const api = useApiClient();

  const isModalOpen = isOpen && type === "invite";
  const inviteUrl = `${origin}/invite/${server?.inviteCode}`

  const [copied, setcopied] = useState(false)
  const [isloading, setisloading] = useState(false)
  const onCopy = () => {
    navigator.clipboard.writeText(inviteUrl);
    setcopied(true)

    setTimeout(() => {
      setcopied(false)
    }, 1000)
  }

  const onNew = async () => {
    try {
      setisloading(true);
      const response = await api.patch(`/api/servers/${server?.id}/invite-code`);
      onOpen("invite", { server: response.data })
    } catch (error) {
      console.log(error);
    } finally {
      setisloading(false)
    }
  }

  return (
    <Dialog open={isModalOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white text-black fixed  p-0 overflow-hidden">
        <DialogHeader className="pt-8 px-6">
          <DialogTitle className="text-2xl text-center font-bold"> 
            Invite People
          </DialogTitle>
          
        </DialogHeader>
        <div className="p-6">
          <Label className="uppercase text-xs font-bold text-zinc-500 dark:text-secondary/70">
            Server invite Link
          </Label>
          <div className="flex items-center mt-2 gap-x-2">
            <Input readOnly disabled={isloading} 
              className="bg-zinc-300/50 border-0 text-black focus-visible:ring-0 focus-visible:ring-offset-0"
              value={inviteUrl}
            />
            <Button disabled={isloading} onClick={onCopy} variant={"outline"} size="icon">
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                   
            </Button>
          </div>
          <Button 
            onClick={onNew}
            variant={"link"}
            disabled={isloading}
            size={"sm"}
            className="text-xs text-zinc-500 mt-4 ">
            Generate a New Link
            <RefreshCw className="w-4 h-4 ml-2" />
          </Button>

        </div>
      </DialogContent>
    </Dialog>
  )
}