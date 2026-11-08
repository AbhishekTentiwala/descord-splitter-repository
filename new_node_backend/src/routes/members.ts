import { Router, Response, Request } from "express";
import { prisma } from "../lib/prisma.js";
import { currentProfile, requireAuth, getParam } from "../lib/current-profile.js";

const router = Router();

router.get("/me", currentProfile, requireAuth, async (req: Request, res: Response) => {
  try {
    const profile = req.profile!;
    const serverId = req.query.serverId as string;

    if (!serverId) {
      return res.status(400).json({ error: "ServerId missing" });
    }

    const server = await prisma.server.findFirst({
      where: {
        id: serverId,
        members: { some: { profileId: profile.id } },
      },
      include: {
        members: {
          include: { profile: true },
          orderBy: { role: "asc" },
        },
      },
    });

    if (!server) {
      return res.status(404).json({ error: "Server not found" });
    }

    const member = server.members.find((m: { profileId: string }) => m.profileId === profile.id);

    if (!member) {
      return res.status(404).json({ error: "Member not found" });
    }

    return res.json(member);
  } catch (error) {
    console.error("[MEMBER_ME_GET]", error);
    return res.status(500).json({ error: "Internal Error" });
  }
});

router.get("/:memberId", currentProfile, requireAuth, async (req: Request, res: Response) => {
  try {
    const profile = req.profile!;
    const memberId = getParam(req, "memberId");
    const serverId = req.query.serverId as string;

    if (!serverId) {
      return res.status(400).json({ error: "ServerId missing" });
    }

    const server = await prisma.server.findFirst({
      where: {
        id: serverId,
        members: { some: { profileId: profile.id } },
      },
      include: {
        members: {
          include: { profile: true },
          orderBy: { role: "asc" },
        },
      },
    });

    if (!server) {
      return res.status(404).json({ error: "Server not found" });
    }

    const member = server.members.find((m: { id: string }) => m.id === memberId);

    if (!member) {
      return res.status(404).json({ error: "Member not found" });
    }

    return res.json(member);
  } catch (error) {
    console.error("[MEMBER_ID_GET]", error);
    return res.status(500).json({ error: "Internal Error" });
  }
});

router.delete("/:memberId", currentProfile, requireAuth, async (req: Request, res: Response) => {
  try {
    const profile = req.profile!;
    const memberId = getParam(req, "memberId");
    const serverId = req.query.serverId as string;

    if (!serverId) {
      return res.status(400).json({ error: "ServerId missing" });
    }
    if (!memberId) {
      return res.status(400).json({ error: "MemberId missing" });
    }

    const server = await prisma.server.update({
      where: {
        id: serverId,
        profileId: profile.id,
      },
      data: {
        members: {
          deleteMany: {
            id: memberId,
            profileId: { not: profile.id },
          },
        },
      },
      include: {
        members: {
          include: { profile: true },
          orderBy: { role: "asc" },
        },
      },
    });

    return res.json(server);
  } catch (error) {
    console.error("[MEMBER_ID_DELETE]", error);
    return res.status(500).json({ error: "Internal Error" });
  }
});

router.patch("/:memberId", currentProfile, requireAuth, async (req: Request, res: Response) => {
  try {
    const profile = req.profile!;
    const memberId = getParam(req, "memberId");
    const { role } = req.body;
    const serverId = req.query.serverId as string;

    if (!serverId) {
      return res.status(400).json({ error: "ServerId missing" });
    }
    if (!memberId) {
      return res.status(400).json({ error: "MemberId missing" });
    }

    const server = await prisma.server.update({
      where: {
        id: serverId,
        profileId: profile.id,
      },
      data: {
        members: {
          update: {
            where: {
              id: memberId,
              profileId: { not: profile.id },
            },
            data: { role },
          },
        },
      },
      include: {
        members: {
          include: { profile: true },
          orderBy: { role: "asc" },
        },
      },
    });

    return res.json(server);
  } catch (error) {
    console.error("[MEMBER_ID_PATCH]", error);
    return res.status(500).json({ error: "Internal Error" });
  }
});

export default router;