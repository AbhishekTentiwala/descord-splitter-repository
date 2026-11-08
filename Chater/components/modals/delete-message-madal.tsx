"use client";

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

import { useModal } from "@/hooks/use-model-store"

import { Button } from "@/components/ui/button";

import { useState } from "react";
import axios from "axios";
import { apiUrl } from "@/lib/api";
import qs from "query-string"


export const DeleteMessageModal = () => {

  const { isOpen, onClose, type, data } = useModal()
  const { query, messageId, type: messageType } = data as { 
    query: Record<string, string>; 
    messageId: string;
    type: "channel" | "conversation";
  };

  const isModalOpen = isOpen && type === 'deleteMessage';

  const onClick = async () => {
    try {
      setisloading(true)
      const endpoint = messageType === "channel" 
        ? `/api/messages/${messageId}`
        : `/api/direct-messages/${messageId}`;
      
      const url = qs.stringifyUrl({
        url: apiUrl(endpoint),
        query
      })
      await axios.delete(url)
      
      onClose()
      
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
      <DialogContent className="bg-white text-black fixed  p-0 overflow-hidden">
        <DialogHeader className="pt-8 px-6">
          <DialogTitle className="text-2xl text-center font-bold">
            Delete Message
          </DialogTitle>
          <DialogDescription className="text-center text-zinc-500">
            Are You sure you want to Delete this message permanently ?
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
              Confirm
            </Button>
          </div>
        </DialogFooter>

      </DialogContent>
    </Dialog>
  )
}