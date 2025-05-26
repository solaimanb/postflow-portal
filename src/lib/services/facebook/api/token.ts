import { FacebookTokenInfo } from "../types";
import { FB_API_VERSION } from '../constants';

export class FacebookTokenError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'FacebookTokenError';
  }
}

/**
 * Verify access token permissions and type
 */
export const verifyTokenPermissions = async (
  accessToken: string,
  requiredPermissions: string[] = [],
  expectedType?: 'USER' | 'PAGE'
): Promise<FacebookTokenInfo> => {
  try {
    const response = await fetch(
      `https://graph.facebook.com/${FB_API_VERSION}/debug_token?input_token=${accessToken}&access_token=${accessToken}`
    );

    if (!response.ok) {
      const error = await response.json();
      throw new FacebookTokenError(
        error.error?.message || 'Token verification failed',
        error.error?.code
      );
    }

    const data = await response.json();
    const tokenData = data.data;

    if (!tokenData.is_valid) {
      throw new FacebookTokenError('Invalid token', 'INVALID_TOKEN');
    }

    // Only check token type if explicitly specified
    if (expectedType && tokenData.type !== expectedType) {
      throw new FacebookTokenError(
        `Invalid token type: ${tokenData.type}. Expected: ${expectedType}`,
        'INVALID_TOKEN_TYPE'
      );
    }

    // Only check permissions for user tokens
    if (tokenData.type === 'USER' && requiredPermissions.length > 0) {
      const missingPermissions = requiredPermissions.filter(
        (permission) => !tokenData.scopes.includes(permission)
      );

      if (missingPermissions.length > 0) {
        throw new FacebookTokenError(
          `Missing permissions: ${missingPermissions.join(', ')}`,
          'MISSING_PERMISSIONS'
        );
      }
    }

    return {
      userId: tokenData.user_id,
      appId: tokenData.app_id,
      type: tokenData.type,
      permissions: tokenData.scopes || [],
      expiresAt: tokenData.expires_at * 1000, // Convert to milliseconds
    };
  } catch (error) {
    if (error instanceof FacebookTokenError) {
      throw error;
    }
    throw new FacebookTokenError(
      error instanceof Error ? error.message : 'Token verification failed'
    );
  }
};

/**
 * Get a page access token from a user access token
 */
export const getPageAccessToken = async (
  pageId: string,
  userAccessToken: string
): Promise<string> => {
  try {
    const response = await fetch(
      `https://graph.facebook.com/v22.0/${pageId}?fields=access_token&access_token=${userAccessToken}`
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        `Failed to get page access token: ${errorData.error?.message}`
      );
    }

    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error("Error getting page access token:", error);
    throw error;
  }
};
