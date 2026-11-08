"use client";

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

import { useModal } from "@/hooks/use-model-store"

import { Button } from "@/components/ui/button";

import { useState } from "react";
import { useApiClient } from "@/lib/api-client";
import { useRouter } from "next/navigation";


export const DeleteServerModal = () => {

  const { isOpen, onClose, type, data } = useModal()
  const router = useRouter()
  const { server } = data;
  const api = useApiClient();

  const isModalOpen = isOpen && type === "delete-Server";

  const onClick = async () => {
    try {
      setisloading(true)
      await api.delete(`/api/servers/${server?.id}`)
      onClose()
      router.refresh()
      router.push("/")
    } catch (error) {
      console.log(error);
    }
    finally {
      setisloading(false)
    }
  }

  const [isloading, setisloading] = useState(false)

  return (
    <Dialog open={isModalOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white text-black fixed p-0 overflow-hidden">
        <DialogHeader className="pt-8 px-6">
          <DialogTitle className="text-2xl text-center font-bold">
            Delete Server
          </DialogTitle>
          <DialogDescription className="text-center text-zinc-500">
            Are You sure you want to Delete
            <span className="font-semibold text-blue-600">
              {" "}{server?.name}
            </span> permanently ?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="bg-gray-100 px-6 py-4">
          <div className="flex items-center justify-between w-full ">
            <Button
              disabled={isloading}
              onClick={onClose}
              variant={"ghost"}>
              Cancel
            </Button>
            <Button
              disabled={isloading}
              onClick={onClick}
              variant={"destructive"}>
              Delete
            </Button>
          </div>
        </DialogFooter>

      </DialogContent>
    </Dialog>
  )
}