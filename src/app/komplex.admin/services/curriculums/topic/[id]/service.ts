import { db } from "@/db/index.js";
import { eq, gt, gte, sql } from "drizzle-orm";
import { topics } from "@/db/schema.js";

export const updateTopicComponent = async (
  id: number,
  component: any,
  componentCode: string
) => {
  try {
    await db
      .update(topics)
      .set({ component: component, componentCode: componentCode })
      .where(eq(topics.id, id));
  } catch (error) {
    throw new Error(
      `Failed to update topic component: ${(error as Error).message}`
    );
  }
};

export const updateTopic = async (
    id: number,
    newName: string,
    orderIndex?: number,
    insertType?: string
  ) => {
    try {
      const oldOrderIndex = await db
        .select({ orderIndex: topics.orderIndex })
        .from(topics)
        .where(eq(topics.id, id));
  
      if (oldOrderIndex[0].orderIndex === null) {
        throw new Error("Old order index not found");
      }
  
      if (
        orderIndex !== undefined &&
        insertType === "before" &&
        oldOrderIndex[0].orderIndex !== null
      ) {
        await db
          .update(topics)
          .set({ orderIndex: sql`${topics.orderIndex} + 1` })
          .where(gte(topics.orderIndex, parseInt(orderIndex.toString())));
        await db
          .update(topics)
          .set({ orderIndex: parseInt(orderIndex.toString()) })
          .where(eq(topics.id, id));
      } else if (
        orderIndex !== undefined &&
        insertType === "after" &&
        oldOrderIndex[0].orderIndex !== null
      ) {
        await db
          .update(topics)
          .set({ orderIndex: sql`${topics.orderIndex} + 1` })
          .where(gt(topics.orderIndex, parseInt(orderIndex.toString())));
        await db
          .update(topics)
          .set({ orderIndex: parseInt(orderIndex.toString()) + 1 })
          .where(eq(topics.id, id));
      }
  
      // clean up
      await db
        .update(topics)
        .set({ orderIndex: sql`${topics.orderIndex} - 1` })
        .where(gt(topics.orderIndex, oldOrderIndex[0].orderIndex as number));
      await db.update(topics).set({ title: newName }).where(eq(topics.id, id));
    } catch (error) {
      throw new Error(`Failed to update topic: ${(error as Error).message}`);
    }
  };
  
  export const deleteTopic = async (id: number) => {
    try {
      const [oldOrderIndex] = await db
        .select({ orderIndex: topics.orderIndex })
        .from(topics)
        .where(eq(topics.id, id));
  
      if (oldOrderIndex.orderIndex === null) {
        throw new Error("Old order index not found");
      }
  
      await db
        .update(topics)
        .set({ orderIndex: sql`${topics.orderIndex} - 1` })
        .where(gt(topics.orderIndex, oldOrderIndex.orderIndex as number));
      await db.delete(topics).where(eq(topics.id, id));
    } catch (error) {
      throw new Error(`Failed to delete topic: ${(error as Error).message}`);
    }
  };
  
