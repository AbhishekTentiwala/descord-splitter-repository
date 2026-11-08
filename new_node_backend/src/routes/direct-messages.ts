import { Router, Response, Request } from "express";
import { prisma } from "../lib/prisma.js";
import { currentProfile, requireAuth, getParam } from "../lib/current-profile.js";

const router = Router();
const MESSAGES_BATCH = 10;

router.post("/conversation", currentProfile, requireAuth, async (req: Request, res: Response) => {
  try {
    const profile = req.profile!;
    const { memberOneId, memberTwoId } = req.body;

    if (!memberOneId || !memberTwoId) {
      return res.status(400).json({ error: "Member IDs missing" });
    }

    const memberOne = await prisma.member.findUnique({
      where: { id: memberOneId },
      include: { profile: true },
    });

    const memberTwo = await prisma.member.findUnique({
      where: { id: memberTwoId },
      include: { profile: true },
    });

    if (!memberOne || !memberTwo) {
      return res.status(404).json({ error: "Member not found" });
    }

    let conversation = await prisma.conversation.findFirst({
      where: {
        OR: [
          { memberOneId, memberTwoId },
          { memberOneId: memberTwoId, memberTwoId: memberOneId },
        ],
      },
      include: {
        memberOne: { include: { profile: true } },
        memberTwo: { include: { profile: true } },
      },
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: { memberOneId, memberTwoId },
        include: {
          memberOne: { include: { profile: true } },
          memberTwo: { include: { profile: true } },
        },
      });
    }

    return res.json(conversation);
  } catch (error) {
    console.error("[CONVERSATION_POST]", error);
    return res.status(500).json({ error: "Internal Error" });
  }
});

router.get("/", currentProfile, requireAuth, async (req: Request, res: Response) => {
  try {
    const profile = req.profile!;
    const cursor = req.query.cursor as string | undefined;
    const conversationId = req.query.conversationId as string;

    if (!conversationId) {
      return res.status(400).json({ error: "Conversation ID missing" });
    }

    let messages;

    if (cursor) {
      messages = await prisma.directMessage.findMany({
        take: MESSAGES_BATCH,
        skip: 1,
        cursor: { id: cursor },
        where: { conversationId },
        include: { member: { include: { profile: true } } },
        orderBy: { createdAt: "desc" },
      });
    } else {
      messages = await prisma.directMessage.findMany({
        take: MESSAGES_BATCH,
        where: { conversationId },
        include: { member: { include: { profile: true } } },
        orderBy: { createdAt: "desc" },
      });
    }

    let nextCursor: string | null = null;
    if (messages.length === MESSAGES_BATCH) {
      nextCursor = messages[MESSAGES_BATCH - 1].id;
    }

    return res.json({ items: messages, nextCursor });
  } catch (error) {
    console.error("[DIRECT_MESSAGES_GET]", error);
    return res.status(500).json({ error: "Internal Error" });
  }
});

router.post("/", currentProfile, requireAuth, async (req: Request, res: Response) => {
  try {
    const profile = req.profile!;
    const { content, fileUrl } = req.body;
    const { conversationId } = req.query;

    if (!conversationId) {
      return res.status(400).json({ error: "Conversation ID missing" });
    }
    if (!content) {
      return res.status(400).json({ error: "Content missing" });
    }

    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId as string,
        OR: [
          { memberOne: { profileId: profile.id } },
          { memberTwo: { profileId: profile.id } },
        ],
      },
      include: {
        memberOne: { include: { profile: true } },
        memberTwo: { include: { profile: true } },
      },
    });

    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    const member =
      conversation.memberOne.profileId === profile.id
        ? conversation.memberOne
        : conversation.memberTwo;

    if (!member) {
      return res.status(404).json({ error: "Member not found" });
    }

    const message = await prisma.directMessage.create({
      data: {
        content,
        fileUrl: fileUrl || "",
        conversationId: conversationId as string,
        memberId: member.id,
      },
      include: { member: { include: { profile: true } } },
    });

    const channelKey = `chat:${conversationId}:messages`;
    req.io?.emit(channelKey, message);

    return res.status(200).json(message);
  } catch (error) {
    console.error("[DIRECT_MESSAGES_POST]", error);
    return res.status(500).json({ error: "Internal Error" });
  }
});

router.delete("/:directMessageId", currentProfile, requireAuth, async (req: Request, res: Response) => {
  try {
    const profile = req.profile!;
    const directMessageId = getParam(req, "directMessageId");
    const { conversationId } = req.query;

    if (!conversationId) {
      return res.status(400).json({ error: "Conversation ID missing" });
    }

    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId as string,
        OR: [
          { memberOne: { profileId: profile.id } },
          { memberTwo: { profileId: profile.id } },
        ],
      },
      include: {
        memberOne: { include: { profile: true } },
        memberTwo: { include: { profile: true } },
      },
    });

    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    const member =
      conversation.memberOne.profileId === profile.id
        ? conversation.memberOne
        : conversation.memberTwo;

    if (!member) {
      return res.status(404).json({ error: "Member not found" });
    }

    let directMessage = await prisma.directMessage.findFirst({
      where: { id: directMessageId, conversationId: conversationId as string },
      include: { member: { include: { profile: true } } },
    });

    if (!directMessage || directMessage.deleted) {
      return res.status(404).json({ error: "Message not found" });
    }

    const isMessageOwner = directMessage.memberId === member.id;
    if (!isMessageOwner) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    directMessage = await prisma.directMessage.update({
      where: { id: directMessageId },
      data: {
        fileUrl: "",
        content: "This message has been deleted.",
        deleted: true,
      },
      include: { member: { include: { profile: true } } },
    });

    const updateKey = `chat:${conversationId}:messages:update`;
    req.io?.emit(updateKey, directMessage);

    return res.status(200).json(directMessage);
  } catch (error) {
    console.error("[DIRECT_MESSAGES_ID_DELETE]", error);
    return res.status(500).json({ error: "Internal Error" });
  }
});

router.patch("/:directMessageId", currentProfile, requireAuth, async (req: Request, res: Response) => {
  try {
    const profile = req.profile!;
    const directMessageId = getParam(req, "directMessageId");
    const { content } = req.body;
    const { conversationId } = req.query;

    if (!conversationId) {
      return res.status(400).json({ error: "Conversation ID missing" });
    }

    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId as string,
        OR: [
          { memberOne: { profileId: profile.id } },
          { memberTwo: { profileId: profile.id } },
        ],
      },
      include: {
        memberOne: { include: { profile: true } },
        memberTwo: { include: { profile: true } },
      },
    });

    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    const member =
      conversation.memberOne.profileId === profile.id
        ? conversation.memberOne
        : conversation.memberTwo;

    if (!member) {
      return res.status(404).json({ error: "Member not found" });
    }

    let directMessage = await prisma.directMessage.findFirst({
      where: { id: directMessageId, conversationId: conversationId as string },
      include: { member: { include: { profile: true } } },
    });

    if (!directMessage || directMessage.deleted) {
      return res.status(404).json({ error: "Message not found" });
    }

    const isMessageOwner = directMessage.memberId === member.id;
    if (!isMessageOwner) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    directMessage = await prisma.directMessage.update({
      where: { id: directMessageId },
      data: { content },
      include: { member: { include: { profile: true } } },
    });

    const updateKey = `chat:${conversationId}:messages:update`;
    req.io?.emit(updateKey, directMessage);

    return res.status(200).json(directMessage);
  } catch (error) {
    console.error("[DIRECT_MESSAGES_ID_PATCH]", error);
    return res.status(500).json({ error: "Internal Error" });
  }
});

export default router;