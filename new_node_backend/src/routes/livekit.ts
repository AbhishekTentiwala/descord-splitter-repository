import { Router, Response, Request } from "express";
import { AccessToken } from "livekit-server-sdk";
import { currentProfile, requireAuth } from "../lib/current-profile.js";

const router = Router();

router.get("/token", currentProfile, requireAuth, async (req: Request, res: Response) => {
  try {
    const room = req.query.room as string;
    const username = req.query.username as string;

    if (!room) {
      return res.status(400).json({ error: 'Missing "room" query parameter' });
    }
    if (!username) {
      return res.status(400).json({ error: 'Missing "username" query parameter' });
    }

    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const wsUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;

    if (!apiKey || !apiSecret || !wsUrl) {
      return res.status(500).json({ error: "Server misconfigured" });
    }

    const at = new AccessToken(apiKey, apiSecret, { identity: username });
    at.addGrant({ room, roomJoin: true, canPublish: true, canSubscribe: true });

    return res.json({ token: await at.toJwt() });
  } catch (error) {
    console.error("[LIVEKIT_TOKEN]", error);
    return res.status(500).json({ error: "Internal Error" });
  }
});

export default router;