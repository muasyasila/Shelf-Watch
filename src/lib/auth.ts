// Simple token generation for demo (no external dependencies)

export interface JWTPayload {
  userId: string;
  email: string;
  name: string;
  exp?: number;
}

// Generate a simple base64 encoded token
export const generateToken = (payload: JWTPayload): string => {
  // Add expiry (7 days from now)
  const exp = Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60);
  const tokenPayload = {
    ...payload,
    exp: exp,
  };
  
  // Encode as base64
  const encoded = btoa(JSON.stringify(tokenPayload));
  return `shelfwatch_${encoded}`;
};

// Verify and decode the token
export const verifyToken = (token: string): JWTPayload | null => {
  try {
    if (!token.startsWith('shelfwatch_')) return null;
    
    const encoded = token.replace('shelfwatch_', '');
    const decoded = JSON.parse(atob(encoded));
    
    // Check expiry
    if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    
    return decoded;
  } catch (error) {
    console.error("Token verification failed:", error);
    return null;
  }
};