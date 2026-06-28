// Sibling Switching secure bypass token store
const tokens = new Map<string, { studentId: string; expires: number }>();

export function createSwitchToken(studentId: string): string {
  const token = Math.random().toString(36).substring(2) + Date.now().toString(36);
  tokens.set(token, {
    studentId,
    expires: Date.now() + 30 * 1000, // 30 seconds expiry
  });
  return token;
}

export function verifySwitchToken(token: string): string | null {
  const data = tokens.get(token);
  if (!data) return null;
  tokens.delete(token); // One-time use only
  if (Date.now() > data.expires) return null;
  return data.studentId;
}
