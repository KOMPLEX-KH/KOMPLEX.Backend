import { db } from "@/db/index.js";
import { eq, gt, gte, sql } from "drizzle-orm";
import { topics } from "@/db/schema.js";

export const createTopic = async (
  title: string,
  lessonId: number,
  orderIndex: number,
  insertType?: string,
  exerciseId?: number
) => {
  try {
    let finalOrderIndex = orderIndex;

    if (orderIndex !== undefined && insertType === "before") {
      await db
        .update(topics)
        .set({ orderIndex: sql`${topics.orderIndex} + 1` })
        .where(gte(topics.orderIndex, parseInt(orderIndex.toString())));
      finalOrderIndex = parseInt(orderIndex.toString());
    } else if (orderIndex !== undefined && insertType === "after") {
      await db
        .update(topics)
        .set({ orderIndex: sql`${topics.orderIndex} + 1` })
        .where(gt(topics.orderIndex, parseInt(orderIndex.toString())));
      finalOrderIndex = parseInt(orderIndex.toString()) + 1;
    }

    const topicData: any = {
      title,
      lessonId,
      component: "[]",
      componentCode: "",
      orderIndex: finalOrderIndex,
    };

    if (exerciseId !== undefined) {
      topicData.exerciseId = exerciseId;
    }

    await db.insert(topics).values(topicData);
  } catch (error) {
    throw new Error(`Failed to create topic: ${(error as Error).message}`);
  }
};

