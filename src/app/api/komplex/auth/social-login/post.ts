import { getResponseError, ResponseError } from "@/utils/responseError.js";
import { Request } from "express";
import { Response } from "express";
import { db } from "@/db/index.js";
import { users } from "@/db/schema.js";
import { eq } from "drizzle-orm";
import { userOauth } from "@/db/models/user_oauth.js";
import { AuthenticatedRequest } from "@/types/request.js";

export const postSocialLogIn = async (
    req: AuthenticatedRequest,
    res: Response
  ) => {
    try {
      const {
        email,
        username,
        provider,
        uid,
        firstName,
        lastName,
        dateOfBirth,
        phone,
        profileImage,
        profileImageKey = null, // set to null
      } = req.body;
      if (!email || !username || !uid) {
        return getResponseError(res, new ResponseError("Missing email or username", 400));
      }
      const isUserExists = await db
        .select()
        .from(users)
        .where(eq(users.uid, uid));
      if (isUserExists.length > 0) {
        return res.status(200).json(isUserExists[0]);
      }
  
      const user = await db
        .insert(users)
        .values({
          email,
          username,
          uid,
          firstName,
          lastName,
          dateOfBirth,
          isAdmin: false,
          isSocial: true,
          isVerified: false,
          phone,
          profileImage,
          profileImageKey,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();
  
      await db.insert(userOauth).values({
        uid,
        provider,
        createdAt: new Date(),
      });
      return res.status(200).json(user);
    } catch (error) {
      return getResponseError(res, error );
    }
  };
  