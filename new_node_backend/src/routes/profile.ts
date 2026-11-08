import { Router, Response, Request } from "express";
import { prisma } from "../lib/prisma.js";
import { currentProfile, requireAuth } from "../lib/current-profile.js";
import { getClerkUserDetails } from "../lib/clerk.js";

const router = Router();

router.get("/", currentProfile, async (req: Request, res: Response) => {
  try {
    const profile = req.profile!;

    if (!profile) {
      const { userId } = req.auth;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const clerkUser = await getClerkUserDetails(userId);
      // Create profile with empty username - user will set it via InitialModel
      const newProfile = await prisma.profile.create({
        data: {
          userId,
          username: "",
          imageUrl: clerkUser.imageUrl,
          email: clerkUser.email,
        },
      });

      return res.json(newProfile);
    }

    return res.json(profile);
  } catch (error) {
    console.error("[PROFILE_GET]", error);
    return res.status(500).json({ error: "Internal Error" });
  }
});

router.get("/check-username", async (req: Request, res: Response) => {
  try {
    const username = req.query.username as string;
    if (!username) {
      return res.status(400).json({ error: "Username required", available: false });
    }

    // Validation - just basic format check, no uniqueness check
    const normalized = username.toLowerCase();
    const pattern = /^[a-zA-Z][a-zA-Z0-9\-_\.]{2,19}$/;
    if (!pattern.test(normalized)) {
      return res.json({ 
        available: false, 
        error: "Username must start with a letter, 3-20 chars, alphanumeric + - _ ." 
      });
    }

    // Reserved words
    const reserved = ['admin', 'api', 'www', 'mail', 'ftp', 'root', 'system', 'support', 'moderator', 'settings', 'chater'];
    if (reserved.includes(normalized)) {
      return res.json({ available: false, error: "Username reserved" });
    }

    // Check database - only for suggestions, not blocking
    const existing = await prisma.profile.findFirst({ where: { username: normalized } });
    return res.json({ available: !existing });
  } catch (error) {
    console.error("[CHECK_USERNAME]", error);
    return res.status(500).json({ error: "Internal error", available: false });
  }
});

router.post("/", currentProfile, requireAuth, async (req: Request, res: Response) => {
  try {
    const { username } = req.body;
    const profile = req.profile!;
    const { userId } = req.auth;

    if (!username) {
      return res.status(400).json({ error: "Username required" });
    }

    const normalized = username.toLowerCase();

    // Validation - basic format only, no uniqueness check
    const pattern = /^[a-zA-Z][a-zA-Z0-9\-_\.]{2,19}$/;
    if (!pattern.test(normalized)) {
      return res.status(400).json({ 
        error: "Username must start with a letter, 3-20 chars, alphanumeric + - _ ." 
      });
    }

    // Reserved words
    const reserved = ['admin', 'api', 'www', 'mail', 'ftp', 'root', 'system', 'support', 'moderator', 'settings', 'chater'];
    if (reserved.includes(normalized)) {
      return res.status(400).json({ error: "Username reserved" });
    }

    // Check if profile already has a username set (immutable after first set)
    if (profile && profile.username && profile.username.trim() !== "") {
      console.log("[PROFILE_POST] Username already set, rejecting change");
      return res.status(403).json({ error: "Username already set and cannot be changed" });
    }

    // Update existing profile or create new one
    let updatedProfile;
    if (profile) {
      updatedProfile = await prisma.profile.update({
        where: { id: profile.id },
        data: { username: normalized },
      });
    } else {
      const { userId } = req.auth;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const clerkUser = await getClerkUserDetails(userId);
      updatedProfile = await prisma.profile.create({
        data: {
          userId,
          username: normalized,
          imageUrl: clerkUser.imageUrl,
          email: clerkUser.email,
        },
      });
    }

    console.log("[PROFILE_POST] Updated/Created profile:", updatedProfile);
    return res.json(updatedProfile);
  } catch (error) {
    console.error("[PROFILE_POST]", error);
    return res.status(500).json({ error: "Internal Error" });
  }
});

export default router;