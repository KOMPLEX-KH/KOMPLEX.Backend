import { db } from "@/db/index.js";
import { eq } from "drizzle-orm";
import { AuthenticatedRequest } from "@/types/request.js";
import { Response } from "express";
import { topics } from "@/db/schema.js";

export const updateLesson = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { id } = req.params;
    const { component, componentCode } = req.body;
    await db
      .update(topics)
      .set({ component: component, componentCode: componentCode })
      .where(eq(topics.id, id));
    res.json({ message: "Lesson updated successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to update lesson" + error });
  }
};
