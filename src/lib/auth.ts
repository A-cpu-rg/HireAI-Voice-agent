import { cookies } from 'next/headers';
import { prisma } from './prisma';

/**
 * MOCK AUTHENTICATION
 * This is a placeholder for a real authentication system (like NextAuth or Clerk).
 * It uses a cookie to store a session token (mock user ID).
 */
export async function getSessionUser() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('mock_session_id')?.value;

  if (!sessionId) {
    return null;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: sessionId },
    });
    return user;
  } catch (error) {
    console.error("Auth error:", error);
    return null;
  }
}

export async function loginMockUser(userId: string) {
  const cookieStore = await cookies();
  // Using max age 30 days
  cookieStore.set('mock_session_id', userId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 30 * 24 * 60 * 60 
  });
}

export async function logoutMockUser() {
  const cookieStore = await cookies();
  cookieStore.delete('mock_session_id');
}
