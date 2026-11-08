import { Router, Response, Request } from "express";
import { v4 as uuidv4 } from "uuid";
import { prisma } from "../lib/prisma.js";
import { currentProfile, requireAuth, getParam } from "../lib/current-profile.js";
import { MemberRole } from "../lib/enums.js";

const router = Router();

router.get("/", currentProfile, requireAuth, async (req: Request, res: Response) => {
  try {
    const profile = req.profile!;

    const servers = await prisma.server.findMany({
      where: {
        members: { some: { profileId: profile.id } },
      },
      include: {
        channels: {
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return res.json(servers);
  } catch (error) {
    console.error("[SERVERS_GET]", error);
    return res.status(500).json({ error: "Internal Error" });
  }
});

router.get("/:serverId", currentProfile, requireAuth, async (req: Request, res: Response) => {
  try {
    const profile = req.profile!;
    const serverId = getParam(req, "serverId");

    const server = await prisma.server.findFirst({
      where: {
        id: serverId,
        members: { some: { profileId: profile.id } },
      },
      include: {
        channels: {
          orderBy: { createdAt: "asc" },
        },
        members: {
          include: { profile: true },
        },
      },
    });

    if (!server) {
      return res.status(404).json({ error: "Server not found" });
    }

    return res.json(server);
  } catch (error) {
    console.error("[SERVER_ID_GET]", error);
    return res.status(500).json({ error: "Internal Error" });
  }
});

router.post("/", currentProfile, requireAuth, async (req: Request, res: Response) => {
  try {
    console.log("[DEBUG] Create server request body:", req.body);
    console.log("[DEBUG] Profile:", req.profile);

    const { name, imageUrl } = req.body;
    const profile = req.profile!;

    const server = await prisma.server.create({
      data: {
        profileId: profile.id,
        name,
        imageUrl,
        inviteCode: uuidv4(),
        channels: {
          create: [
            { name: "general", profileId: profile.id },
          ],
        },
        members: {
          create: [
            { profileId: profile.id, role: MemberRole.Admin },
          ],
        },
      },
      include: {
        channels: true,
      },
    });

    console.log("[DEBUG] Server created:", server.id);
    return res.json(server);
  } catch (error) {
    console.error("[SERVERS_POST]", error);
    return res.status(500).json({ error: "Internal Error" });
  }
});

router.delete("/:serverId", currentProfile, requireAuth, async (req: Request, res: Response) => {
  try {
    const profile = req.profile!;
    const serverId = getParam(req, "serverId");

    const server = await prisma.server.delete({
      where: {
        id: serverId,
        profileId: profile.id,
      },
    });

    return res.json(server);
  } catch (error) {
    console.error("[SERVER_ID_DELETE]", error);
    return res.status(500).json({ error: "Internal Error" });
  }
});

router.patch("/:serverId", currentProfile, requireAuth, async (req: Request, res: Response) => {
  try {
    const profile = req.profile!;
    const serverId = getParam(req, "serverId");
    const { name, imageUrl } = req.body;

    const server = await prisma.server.update({
      where: {
        id: serverId,
        profileId: profile.id,
      },
      data: {
        name,
        imageUrl,
      },
    });

    return res.json(server);
  } catch (error) {
    console.error("[SERVER_ID_PATCH]", error);
    return res.status(500).json({ error: "Internal Error" });
  }
});

router.patch("/:serverId/leave", currentProfile, requireAuth, async (req: Request, res: Response) => {
  try {
    const profile = req.profile!;
    const serverId = getParam(req, "serverId");

    if (!serverId) {
      return res.status(400).json({ error: "Server Id missing" });
    }

    const server = await prisma.server.update({
      where: {
        id: serverId,
        profileId: { not: profile.id },
        members: {
          some: { profileId: profile.id },
        },
      },
      data: {
        members: {
          deleteMany: { profileId: profile.id },
        },
      },
    });

    return res.json(server);
  } catch (error) {
    console.error("[SERVER_ID_LEAVE]", error);
    return res.status(500).json({ error: "Internal Error" });
  }
});

router.patch("/:serverId/invite-code", currentProfile, requireAuth, async (req: Request, res: Response) => {
  try {
    const profile = req.profile!;
    const serverId = getParam(req, "serverId");

    if (!serverId) {
      return res.status(400).json({ error: "Server Id Missing" });
    }

    const server = await prisma.server.update({
      where: {
        id: serverId,
        profileId: profile.id,
      },
      data: {
        inviteCode: uuidv4(),
      },
    });

    return res.json(server);
  } catch (error) {
    console.error("[SERVER_INVITE_CODE]", error);
    return res.status(500).json({ error: "Internal Error" });
  }
});

router.get("/invite/:inviteCode", currentProfile, requireAuth, async (req: Request, res: Response) => {
  try {
    const profile = req.profile!;
    const inviteCode = getParam(req, "inviteCode");

    const server = await prisma.server.findFirst({
      where: {
        inviteCode,
        members: { some: { profileId: profile.id } },
      },
    });

    if (!server) {
      return res.status(404).json({ error: "Server not found or not a member" });
    }

    return res.json(server);
  } catch (error) {
    console.error("[SERVER_INVITE_GET]", error);
    return res.status(500).json({ error: "Internal Error" });
  }
});

router.post("/join", currentProfile, requireAuth, async (req: Request, res: Response) => {
  try {
    const profile = req.profile!;
    const { inviteCode } = req.body;

    if (!inviteCode) {
      return res.status(400).json({ error: "Invite code missing" });
    }

    const server = await prisma.server.findFirst({
      where: { inviteCode },
    });

    if (!server) {
      return res.status(404).json({ error: "Invalid invite code" });
    }

    const existingMember = await prisma.member.findFirst({
      where: { serverId: server.id, profileId: profile.id },
    });

    if (existingMember) {
      return res.json(server);
    }

    const updatedServer = await prisma.server.update({
      where: { id: server.id },
      data: {
        members: {
          create: { profileId: profile.id, role: MemberRole.Guest },
        },
      },
    });

    return res.json(updatedServer);
  } catch (error) {
    console.error("[SERVER_JOIN]", error);
    return res.status(500).json({ error: "Internal Error" });
  }
});

export default router;