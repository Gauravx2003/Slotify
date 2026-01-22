import { Response, Request } from "express";
import { eq } from "drizzle-orm";
import { db } from "../../db";
import { users } from "../../db/schema";
import { redisHelpers } from "../../config/redis";
import { asyncHandler, NotFoundError } from "../../utils/error";
import { AuthRequest } from "../../middleware/auth.middleware";

/**
 * Get current user info
 * Note: Most auth is handled by Better Auth. This is for additional user data.
 */
export const getCurrentUser = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;

    if (!userId) {
      throw new NotFoundError("User");
    }

    // Try cache first
    const cachedUser = await redisHelpers.get(`user:${userId}`);

    if (cachedUser) {
      return res.json({
        success: true,
        data: { user: cachedUser },
      });
    }

    // Get from database
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
        image: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundError("User");
    }

    // Cache user data
    await redisHelpers.set(`user:${userId}`, user, 3600);

    res.json({
      success: true,
      data: { user },
    });
  }
);

/**
 * Update user profile
 */
export const updateProfile = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    const { name } = req.body;

    if (!userId) {
      throw new NotFoundError("User");
    }

    const [updatedUser] = await db
      .update(users)
      .set({
        name,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
        emailVerified: users.emailVerified,
        image: users.image,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      });

    if (!updatedUser) {
      throw new NotFoundError("User");
    }

    // Update cache
    await redisHelpers.set(`user:${userId}`, updatedUser, 3600);

    res.json({
      success: true,
      message: "Profile updated successfully",
      data: { user: updatedUser },
    });
  }
);
