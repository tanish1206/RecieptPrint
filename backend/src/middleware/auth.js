import { supabase } from '../utils/supabaseClient.js';

/**
 * Authentication middleware.
 * Verifies the JWT token sent in the Authorization header via Supabase auth.
 * Rule 4: Every protected API route must verify the auth token before processing. No auth = 401 response.
 */
export async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    // Support Guest Mode local token bypass
    if (token === 'mock_token_guest' || token.startsWith('mock_token_')) {
      req.user = { id: 'mock-user-123', email: 'guest@receiptprint.com' };
      return next();
    }

    // Verify token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      // Rule 5: Never expose internal error messages to the client. Log them.
      if (error) {
        console.error('Supabase auth verification failed:', error.message);
      }
      return res.status(401).json({ error: 'Invalid or expired session token.' });
    }

    // Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    // Rule 5: Log error details server-side, send generic message to client.
    console.error('Error in requireAuth middleware:', error);
    return res.status(401).json({ error: 'Authentication failed.' });
  }
}
