import { Request } from "express";
import { Response } from "express";
import { db } from "@/db/index.js";
import { users } from "@/db/schema.js";
import { getResponseError, ResponseError } from "@/utils/responseError.js";
import { z } from "@/config/openapi/openapi.js";

const SignupBodySchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(20),
  uid: z.string(),
  firstName: z.string().min(3).max(20),
  lastName: z.string().min(3).max(20),
  dateOfBirth: z.string().optional(),
  phone: z.string().optional(),
  profileImageKey: z.string().optional(),
});

export type SignupBody = z.infer<typeof SignupBodySchema>;

export const postSignup = async (
  req: Request,
  res: Response
) => {
  const { email, username, uid, firstName, lastName, dateOfBirth, phone, profileImageKey }: SignupBody = await SignupBodySchema.parseAsync(req.body);
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
    return getResponseError(res, error);
  }
};

