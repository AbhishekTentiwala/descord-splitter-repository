import { Router, Response, Request } from "express";
import { prisma } from "../lib/prisma.js";
import { currentProfile, requireAuth, getParam } from "../lib/current-profile.js";
import { MemberRole } from "../lib/enums.js";

const router = Router();
const MESSAGES_BATCH = 10;

router.get("/", currentProfile, requireAuth, async (req: Request, res: Response) => {
  try {
    const profile = req.profile!;
    const cursor = req.query.cursor as string | undefined;
    const channelId = req.query.channelId as string;

    if (!channelId) {
      return res.status(400).json({ error: "Channel ID missing" });
    }

    let messages;

    if (cursor) {
      messages = await prisma.message.findMany({
        take: MESSAGES_BATCH,
        skip: 1,
        cursor: { id: cursor },
        where: { channelId },
        include: {
          member: { include: { profile: true } },
        },
        orderBy: { createdAt: "desc" },
      });
    } else {
      messages = await prisma.message.findMany({
        take: MESSAGES_BATCH,
        where: { channelId },
        include: {
          member: { include: { profile: true } },
        },
        orderBy: { createdAt: "desc" },
      });
    }

    let nextCursor: string | null = null;
    if (messages.length === MESSAGES_BATCH) {
      nextCursor = messages[MESSAGES_BATCH - 1].id;
    }

    return res.json({ items: messages, nextCursor });
  } catch (error) {
    console.error("[MESSAGES_GET]", error);
    return res.status(500).json({ error: "Internal Error" });
  }
});

router.post("/", currentProfile, requireAuth, async (req: Request, res: Response) => {
  try {
    const profile = req.profile!;
    const { content, fileUrl } = req.body;
    const { serverId, channelId } = req.query;

    if (!serverId) {
      return res.status(400).json({ error: "ServerId missing" });
    }
    if (!channelId) {
      return res.status(400).json({ error: "ChannelId missing" });
    }
    if (!content) {
      return res.status(400).json({ error: "Content missing" });
    }

    const server = await prisma.server.findFirst({
      where: {
        id: serverId as string,
        members: { some: { profileId: profile.id } },
      },
      include: { members: true },
    });

    if (!server) {
      return res.status(404).json({ error: "Server not found" });
    }

    const channel = await prisma.channel.findFirst({
      where: { id: channelId as string, serverId: serverId as string },
    });

    if (!channel) {
      return res.status(404).json({ error: "Channel not found" });
    }

    const member = server.members.find((m: { profileId: string }) => m.profileId === profile.id);
    if (!member) {
      return res.status(404).json({ error: "Member not found" });
    }

    const message = await prisma.message.create({
      data: {
        content,
        fileUrl: fileUrl || "",
        channelId: channelId as string,
        memberId: member.id,
      },
      include: { member: { include: { profile: true } } },
    });

    const channelKey = `chat:${channelId}:messages`;
    req.io?.emit(channelKey, message);

    return res.status(200).json(message);
  } catch (error) {
    console.error("[MESSAGES_POST]", error);
    return res.status(500).json({ error: "Internal Error" });
  }
});

router.delete("/:messageId", currentProfile, requireAuth, async (req: Request, res: Response) => {
  try {
    const profile = req.profile!;
    const messageId = getParam(req, "messageId");
    const { serverId, channelId } = req.query;

    if (!serverId) {
      return res.status(400).json({ error: "Server Id missing" });
    }
    if (!channelId) {
      return res.status(400).json({ error: "Channel Id missing" });
    }

    const server = await prisma.server.findFirst({
      where: {
        id: serverId as string,
        members: { some: { profileId: profile.id } },
      },
      include: { members: true },
    });

    if (!server) {
      return res.status(404).json({ error: "Server not found" });
    }

    const channel = await prisma.channel.findFirst({
      where: { id: channelId as string, serverId: serverId as string },
    });

    if (!channel) {
      return res.status(404).json({ error: "Channel not found" });
    }

    const member = server.members.find((m: { profileId: string }) => m.profileId === profile.id);
    if (!member) {
      return res.status(404).json({ error: "Member not found" });
    }

    let message = await prisma.message.findFirst({
      where: { id: messageId, channelId: channelId as string },
      include: { member: { include: { profile: true } } },
    });

    if (!message || message.deleted) {
      return res.status(404).json({ error: "Message not found" });
    }

    const isMessageOwner = message.memberId === member.id;
    const isAdmin = member.role === MemberRole.Admin;
    const isModerator = member.role === MemberRole.Moderater;
    const canModify = isMessageOwner || isAdmin || isModerator;

    if (!canModify) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    message = await prisma.message.update({
      where: { id: messageId },
      data: {
        fileUrl: "",
        content: "This message has been deleted",
        deleted: true,
      },
      include: { member: { include: { profile: true } } },
    });

    const updateKey = `chat:${channelId}:messages:update`;
    req.io?.emit(updateKey, message);

    return res.status(200).json(message);
  } catch (error) {
    console.error("[MESSAGE_ID_DELETE]", error);
    return res.status(500).json({ error: "Internal Error" });
  }
});

router.patch("/:messageId", currentProfile, requireAuth, async (req: Request, res: Response) => {
  try {
    const profile = req.profile!;
    const messageId = getParam(req, "messageId");
    const { content } = req.body;
    const { serverId, channelId } = req.query;

    if (!serverId) {
      return res.status(400).json({ error: "Server Id missing" });
    }
    if (!channelId) {
      return res.status(400).json({ error: "Channel Id missing" });
    }

    const server = await prisma.server.findFirst({
      where: {
        id: serverId as string,
        members: { some: { profileId: profile.id } },
      },
      include: { members: true },
    });

    if (!server) {
      return res.status(404).json({ error: "Server not found" });
    }

    const channel = await prisma.channel.findFirst({
      where: { id: channelId as string, serverId: serverId as string },
    });

    if (!channel) {
      return res.status(404).json({ error: "Channel not found" });
    }

    const member = server.members.find((m: { profileId: string }) => m.profileId === profile.id);
    if (!member) {
      return res.status(404).json({ error: "Member not found" });
    }

    let message = await prisma.message.findFirst({
      where: { id: messageId, channelId: channelId as string },
      include: { member: { include: { profile: true } } },
    });

    if (!message || message.deleted) {
      return res.status(404).json({ error: "Message not found" });
    }

    const isMessageOwner = message.memberId === member.id;
    if (!isMessageOwner) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    message = await prisma.message.update({
      where: { id: messageId },
      data: { content },
      include: { member: { include: { profile: true } } },
    });

    const updateKey = `chat:${channelId}:messages:update`;
    req.io?.emit(updateKey, message);

    return res.status(200).json(message);
  } catch (error) {
    console.error("[MESSAGE_ID_PATCH]", error);
    return res.status(500).json({ error: "Internal Error" });
  }
});

export default router;