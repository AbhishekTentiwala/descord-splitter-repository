import { Channel, ChannelType, Server as PrismaServer, MemberRole, Profile } from "@prisma/client";
import { create } from "zustand";

export type ModelType = "createServer" | "invite" | "editServer" | "members" | "createChannel" | "leave-Server" | "delete-Server" | "delete-Channel" | "edit-Channel" | "messageFile" | "deleteMessage";

export interface ChannelData {
  id: string;
  name: string;
  type: ChannelType;
}

export interface MemberData {
  id: string;
  profileId: string;
  role: MemberRole;
  profile: {
    id: string;
    username: string;
    imageUrl: string;
    email: string;
  };
}

export interface ServerData {
  id: string;
  name: string;
  imageUrl: string;
  inviteCode: string;
  profileId: string;
  createdAt: Date;
  updatedAt: Date;
  channels?: Array<{ id: string; name: string; type: ChannelType }>;
  members?: MemberData[];
}

interface ModalData {
  server?: ServerData;
  channel?: ChannelData;
  channelType?: ChannelType;
  apiUrl?: string;
  query?: Record<string, any>;
  restApiUrl?: string;
  messageId?: string;
  type?: "channel" | "conversation";
  currentUserRole?: MemberRole;
  currentUserId?: string;
}

interface ModelStore {
  type: ModelType | null;
  data: ModalData;
  isOpen: boolean;
  onOpen: (type: ModelType, data?: ModalData) => void;
  onClose: () => void;
}

export const useModal = create<ModelStore>((set) => ({
  type: null,
  data: {},
  isOpen: false,
  onOpen: (type, data = {}) => set({ isOpen: true, type, data }),
  onClose: () => set({ type: null, isOpen: false })
}));