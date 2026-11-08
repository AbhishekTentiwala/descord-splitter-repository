export function generateUsernameCandidates(user: {
  firstName?: string | null;
  lastName?: string | null;
  primaryEmailAddress?: { emailAddress: string } | null;
}): string[] {
  const suggestions = new Set<string>();

  // 1. Email prefix (usually most unique)
  if (user.primaryEmailAddress?.emailAddress) {
    const prefix = user.primaryEmailAddress.emailAddress.split('@')[0];
    suggestions.add(prefix.toLowerCase());
  }

  // 2. firstName + lastName variations
  if (user.firstName && user.lastName) {
    const first = user.firstName.toLowerCase();
    const last = user.lastName.toLowerCase();
    suggestions.add(`${first}_${last}`);
    suggestions.add(`${first}${last}`);
    suggestions.add(`${first}.${last}`);
  } else if (user.firstName) {
    suggestions.add(user.firstName.toLowerCase() + Math.floor(100 + Math.random() * 9000));
  } else if (user.lastName) {
    suggestions.add(user.lastName.toLowerCase() + Math.floor(100 + Math.random() * 9000));
  }

  // Filter valid format, normalize lowercase, limit 4
  return Array.from(suggestions)
    .map(s => s.toLowerCase())
    .filter(s => /^[a-zA-Z][a-zA-Z0-9\-_\.]{2,19}$/.test(s))
    .slice(0, 4);
}

export async function getAvailableSuggestions(
  user: {
    firstName?: string | null;
    lastName?: string | null;
    primaryEmailAddress?: { emailAddress: string } | null;
  },
  checkFn: (username: string) => Promise<{ available: boolean }>
): Promise<string[]> {
  const candidates = generateUsernameCandidates(user);
  const results = await Promise.all(
    candidates.map(async (username) => ({
      username,
      available: await checkUsernameAvailability(username.toLowerCase(), checkFn)
    }))
  );
  return results.filter(r => r.available).map(r => r.username);
}

async function checkUsernameAvailability(
  username: string,
  checkFn: (username: string) => Promise<{ available: boolean }>
): Promise<boolean> {
  const result = await checkFn(username.toLowerCase());
  return result.available;
}