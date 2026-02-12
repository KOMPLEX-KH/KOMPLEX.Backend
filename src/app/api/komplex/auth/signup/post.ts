import { Request } from "express";
import { Response } from "express";
import { db } from "@/db/index.js";
import { users } from "@/db/schema.js";
import { getResponseError, ResponseError } from "@/utils/responseError.js";

export const postSignup = async (
  req: Request,
  res: Response
) => {
  const {
    email,
    username,
    uid,
    firstName,
    lastName,
    dateOfBirth,
    phone,
    profileImageKey,
  } = req.body;
  if (!email || !username) {
    return getResponseError(res, new ResponseError("Missing email or username", 400));
  }
  try {
    const profileImage = `${process.env.R2_PHOTO_PUBLIC_URL}/${profileImageKey}`;
    const user = await db
      .insert(users)
      .values({
        email,
        username,
        uid,
        firstName,
        lastName,
        dateOfBirth: null,
        isAdmin: false,
        isSocial: false,
        isVerified: false,
        phone: null,
        profileImage,
        profileImageKey: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return res.status(200).json(user);
  } catch (error) {
    return getResponseError(res, error );
  }
};

