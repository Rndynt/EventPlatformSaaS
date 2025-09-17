// Helper function for JWT verification in Netlify Functions
export async function verifyJWT(authHeader: string | undefined) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Authorization header missing or invalid');
  }

  const token = authHeader.substring(7);
  
  try {
    const { verifyJWT: verify } = await import('../../lib/auth');
    const payload = await verify(token);
    return payload;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}