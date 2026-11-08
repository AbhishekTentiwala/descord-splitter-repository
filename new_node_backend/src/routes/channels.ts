import { Router, Response, Request } from "express";
import { prisma } from "../lib/prisma.js";
import { currentProfile, requireAuth, getParam } from "../lib/current-profile.js";
import { MemberRole } from "../lib/enums.js";

const router = Router();

router.get("/:channelId", currentProfile, requireAuth, async (req: Request, res: Response) => {
  try {
    const profile = req.profile!;
    const channelId = getParam(req, "channelId");
    const serverId = req.query.serverId as string;

    if (!serverId) {
      return res.status(400).json({ error: "Server ID missing" });
    }

    const server = await prisma.server.findFirst({
      where: {
        id: serverId,
        members: { some: { profileId: profile.id } },
      },
    });

    if (!server) {
      return res.status(404).json({ error: "Server not found" });
    }

    const channel = await prisma.channel.findFirst({
      where: { id: channelId, serverId },
    });

    if (!channel) {
      return res.status(404).json({ error: "Channel not found" });
    }

    return res.json(channel);
  } catch (error) {
    console.error("[CHANNEL_ID_GET]", error);
    return res.status(500).json({ error: "Internal Error" });
  }
});

router.post("/", currentProfile, requireAuth, async (req: Request, res: Response) => {
  try {
    const profile = req.profile!;
    const { name, type } = req.body;
    const serverId = req.query.serverId as string;

    if (!serverId) {
      return res.status(400).json({ error: "Server Id missing" });
    }
    if (name === "general") {
      return res.status(400).json({ error: "Name can not be general" });
    }

    const server = await prisma.server.update({
      where: {
        id: serverId,
        members: {
          some: {
            profileId: profile.id,
            role: { in: [MemberRole.Admin, MemberRole.Moderater] },
          },
        },
      },
      data: {
        channels: {
          create: {
            profileId: profile.id,
            name,
            type,
          },
        },
      },
    });

    return res.json(server);
  } catch (error) {
    console.error("[CHANNELS_POST]", error);
    return res.status(500).json({ error: "Internal Error" });
  }
});

router.delete("/:channelId", currentProfile, requireAuth, async (req: Request, res: Response) => {
  try {
    const profile = req.profile!;
    const channelId = getParam(req, "channelId");
    const serverId = req.query.serverId as string;

    if (!serverId) {
      return res.status(400).json({ error: "Server id missing" });
    }
    if (!channelId) {
      return res.status(400).json({ error: "Channel id missing" });
    }

    const server = await prisma.server.update({
      where: {
        id: serverId,
        members: {
          some: {
            profileId: profile.id,
            role: { in: [MemberRole.Admin, MemberRole.Moderater] },
          },
        },
      },
      data: {
        channels: {
          delete: {
            id: channelId,
            name: { not: "general" },
          },
        },
      },
    });

    return res.json(server);
  } catch (error) {
    console.error("[DELETE_CHANNEL_ID]", error);
    return res.status(500).json({ error: "Internal Error" });
  }
});

router.patch("/:channelId", currentProfile, requireAuth, async (req: Request, res: Response) => {
  try {
    const profile = req.profile!;
    const channelId = getParam(req, "channelId");
    const { name, type } = req.body;
    const serverId = req.query.serverId as string;

    if (!serverId) {
      return res.status(400).json({ error: "Server id missing" });
    }
    if (!channelId) {
      return res.status(400).json({ error: "Channel id missing" });
    }
    if (name === "general") {
      return res.status(400).json({ error: "Name can not be general" });
    }

    const server = await prisma.server.update({
      where: {
        id: serverId,
        members: {
          some: {
            profileId: profile.id,
            role: { in: [MemberRole.Admin, MemberRole.Moderater] },
          },
        },
      },
      data: {
        channels: {
          update: {
            where: {
              id: channelId,
              NOT: { name: "general" },
            },
            data: { name, type },
          },
        },
      },
    });

    return res.json(server);
  } catch (error) {
    console.error("[PATCH_CHANNEL_ID]", error);
    return res.status(500).json({ error: "Internal Error" });
  }
});

export default router;