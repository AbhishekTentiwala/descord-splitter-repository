import { Request, Response, NextFunction } from "express";
import { getAuth } from "@clerk/express";
import { prisma } from "../lib/prisma.js";
import { Server as SocketIOServer } from "socket.io";
import { createClerkClient } from '@clerk/clerk-sdk-node';

declare global {
  namespace Express {
    interface Request {
      auth: {
        userId: string | null;
        sessionId: string | null;
      };
      profile?: {
        id: string;
        userId: string;
        username: string | null;
        imageUrl: string;
        email: string;
        createdAt: Date;
        updatedAt: Date;
      } | null;
      io?: SocketIOServer;
    }
  }
}

const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY!,
});

interface ClerkUserResponse {
  user_id: string;
}

async function verifyBearerToken(token: string): Promise<string | null> {
  try {
    console.log("[VERIFY_TOKEN] Attempting to verify token, length:", token.length);
    // Try to use Clerk SDK verifyToken if available
    if (typeof clerkClient.verifyToken === 'function') {
      const payload = await clerkClient.verifyToken(token);
      console.log("[VERIFY_TOKEN] Verified payload:", payload);
      return payload.sub || null;
    }
    // Fallback: decode JWT without verification (for development)
    const parts = token.split('.');
    if (parts.length === 3) {
      try {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
        console.log("[VERIFY_TOKEN] Decoded payload (no verify):", payload);
        return payload.sub || payload.user_id || null;
      } catch (e) {
        console.error("[VERIFY_TOKEN] Base64 decode error:", e);
      }
    }
  } catch (error) {
    console.error("[VERIFY_TOKEN] Error:", error);
  }
  return null;
}

export const currentProfile = async (req: Request, res: Response, next: NextFunction) => {
  console.log("[CURRENT_PROFILE] Start");
  try {
    let userId: string | null = null;

    // First try Clerk middleware (cookie-based)
    console.log("[CURRENT_PROFILE] Trying getAuth");
    const { userId: middlewareUserId } = getAuth(req);
    console.log("[CURRENT_PROFILE] getAuth result:", middlewareUserId);
    if (middlewareUserId) {
      userId = middlewareUserId;
    } else {
      // Fallback: Check Authorization header for Bearer token
      console.log("[CURRENT_PROFILE] Checking Authorization header");
      const authHeader = req.headers.authorization;
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.slice(7);
        console.log("[CURRENT_PROFILE] Found Bearer token, verifying...");
        userId = await verifyBearerToken(token);
        console.log("[CURRENT_PROFILE] verifyBearerToken result:", userId);
      }
    }

    console.log("[CURRENT_PROFILE] Clerk userId:", userId);

    if (!userId) {
      req.profile = null;
      // Also set req.auth for downstream handlers
      req.auth = { userId: null, sessionId: null };
      console.log("[CURRENT_PROFILE] No userId, calling next()");
      return next();
    }

    console.log("[CURRENT_PROFILE] Finding profile in DB");
    const profile = await prisma.profile.findUnique({
      where: { userId },
    });

    console.log("[CURRENT_PROFILE] Profile found:", !!profile, profile?.id);

    // Attach userId to req.auth for downstream handlers
    req.auth = { userId, sessionId: null };
    
    // Don't auto-create profile - let the user create it via the initial model
    req.profile = profile;
    console.log("[CURRENT_PROFILE] Calling next()");
    next();
  } catch (error) {
    console.error("[CURRENT_PROFILE] Error:", error);
    req.profile = null;
    req.auth = { userId: null, sessionId: null };
    next();
  }
};

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.profile) {
    console.log("[DEBUG] requireAuth: No profile, returning 401");
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
};

export function getParam(req: Request, key: string): string {
  const value = req.params[key];
  return Array.isArray(value) ? value[0] : value;
}