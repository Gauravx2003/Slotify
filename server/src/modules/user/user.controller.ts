import { Response } from "express";
import { eq } from "drizzle-orm";
import { db } from "../../db";
import { users } from "../../db/schema";
import { s3Helpers } from "../../config/s3";
import { redisHelpers } from "../../config/redis";
import {
  AuthenticationError,
  ConflictError,
  NotFoundError,
  ValidationError,
  asyncHandler,
} from "../../utils/error";
import { AuthRequest } from "../../middleware/auth.middleware";

/**
 * Update user profile
 */
export const updateProfile = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw new AuthenticationError("Not authenticated");
    }

    const { name, email } = req.body;
    const userId = req.user.id;

    // Check if email is being changed and if it's already taken
    if (email && email !== req.user.email) {
      const existingUser = await db.query.users.findFirst({
        where: eq(users.email, email),
      });

      if (existingUser) {
        throw new ConflictError("Email is already in use");
      }
    }

    // Update user
    const [updatedUser] = await db
      .update(users)
      .set({
        ...(name && { name }),
        ...(email && { email }),
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
        image: users.image,
        updatedAt: users.updatedAt,
      });

    // Clear cache
    await redisHelpers.delete(`user:${userId}`);
    // Update cache with new data
    await redisHelpers.set(`user:${userId}`, updatedUser, 3600);

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: {
        user: updatedUser,
      },
    });
  }
);

/**
 * Upload profile picture
 */
export const uploadProfilePicture = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw new AuthenticationError("Not authenticated");
    }

    if (!req.file) {
      throw new ValidationError("No file uploaded");
    }

    const userId = req.user.id;

    // Get current user to check for existing profile picture
    const currentUser = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: {
        image: true,
      },
    });

    if (!currentUser) {
      throw new NotFoundError("User");
    }

    // Delete old profile picture if exists
    if (currentUser.image) {
      try {
        await s3Helpers.deleteFile(currentUser.image);
      } catch (error) {
        console.error("Error deleting old profile picture:", error);
        // Continue even if deletion fails
      }
    }

    // Upload new profile picture
    const fileUrl = await s3Helpers.uploadProfilePicture(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
      userId
    );

    // Update user record
    const [updatedUser] = await db
      .update(users)
      .set({
        image: fileUrl,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
        image: users.image,
        updatedAt: users.updatedAt,
      });

    // Clear cache
    await redisHelpers.delete(`user:${userId}`);
    // Update cache
    await redisHelpers.set(`user:${userId}`, updatedUser, 3600);

    res.status(200).json({
      success: true,
      message: "Profile picture uploaded successfully",
      data: {
        user: updatedUser,
      },
    });
  }
);

/**
 * Delete profile picture
 */
export const deleteProfilePicture = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw new AuthenticationError("Not authenticated");
    }

    const userId = req.user.id;

    const currentUser = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: {
        image: true,
      },
    });

    if (!currentUser) {
      throw new NotFoundError("User");
    }

    if (!currentUser.image) {
      throw new ValidationError("No profile picture to delete");
    }

    // Delete from S3
    await s3Helpers.deleteFile(currentUser.image);

    // Update user record
    const [updatedUser] = await db
      .update(users)
      .set({
        image: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
        image: users.image,
        updatedAt: users.updatedAt,
      });

    // Clear cache
    await redisHelpers.delete(`user:${userId}`);
    // Update cache
    await redisHelpers.set(`user:${userId}`, updatedUser, 3600);

    res.status(200).json({
      success: true,
      message: "Profile picture deleted successfully",
      data: {
        user: updatedUser,
      },
    });
  }
);

/**
 * Delete user account
 */
export const deleteAccount = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw new AuthenticationError("Not authenticated");
    }

    const userId = req.user.id;

    // Get user to check for profile picture
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: {
        image: true,
      },
    });

    if (!user) {
      throw new NotFoundError("User");
    }

    // Delete profile picture from S3 if exists
    if (user.image) {
      try {
        await s3Helpers.deleteFile(user.image);
      } catch (error) {
        console.error("Error deleting profile picture:", error);
        // Continue even if deletion fails
      }
    }

    // Delete user (cascade will delete sessions)
    await db.delete(users).where(eq(users.id, userId));

    // Clear cache
    await redisHelpers.delete(`user:${userId}`);

    res.status(200).json({
      success: true,
      message: "Account deleted successfully",
    });
  }
);
