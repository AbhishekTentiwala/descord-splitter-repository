import { createClerkClient } from '@clerk/clerk-sdk-node';

const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY!,
});

export async function getClerkUser(userId: string) {
  return clerkClient.users.getUser(userId);
}

export async function getClerkUserDetails(userId: string) {
  const user = await clerkClient.users.getUser(userId);
  return {
    id: user.id,
    username: user.username || user.emailAddresses[0]?.emailAddress?.split('@')[0] || `user_${userId.slice(-6)}`,
    email: user.emailAddresses[0]?.emailAddress || '',
    imageUrl: user.imageUrl || '',
    firstName: user.firstName || '',
    lastName: user.lastName || '',
  };
}