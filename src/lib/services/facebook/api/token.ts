import { FacebookTokenInfo } from "../types";

/**
 * Verify access token permissions and type
 */
export const verifyTokenPermissions = async (
  accessToken: string
): Promise<FacebookTokenInfo> => {
  try {
    // First, debug the token to get its type
    const response = await fetch(
      `https://graph.facebook.com/v22.0/debug_token?input_token=${accessToken}&access_token=${accessToken}`
    );

    if (!response.ok) {
      throw new Error("Failed to verify token permissions");
    }

    const data = await response.json();
    console.log("Token debug data:", data);

    if (data.error) {
      return {
        type: "USER",
        isValid: false,
        error: data.error.message,
      };
    }

    const tokenInfo: FacebookTokenInfo = {
      type: data.data?.type || "USER",
      isValid: true,
    };

    // Only check permissions for USER tokens
    if (data.data?.type === "USER") {
      const permResponse = await fetch(
        `https://graph.facebook.com/v22.0/me/permissions?access_token=${accessToken}`
      );
      const permData = await permResponse.json();
      console.log("Token permissions (USER):", permData);

      tokenInfo.permissions = permData.data
        ?.filter((perm: { status: string }) => perm.status === "granted")
        .map((perm: { permission: string }) => perm.permission);
    }

    return tokenInfo;
  } catch (error) {
    console.error("Token verification error:", error);
    return {
      type: "USER",
      isValid: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
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
