import { db } from "@/db/index.js";
import { eq, gt, gte, sql } from "drizzle-orm";
import { subjects } from "@/db/schema.js";

export const updateSubject = async (
    id: number,
    newName: string,
    orderIndex?: number,
    insertType?: string,
    icon?: string
  ) => {
    try {
      const oldOrderIndex = await db
        .select({ orderIndex: subjects.orderIndex })
        .from(subjects)
        .where(eq(subjects.id, id));
  
      if (oldOrderIndex[0].orderIndex === null) {
        throw new Error("Old order index not found");
      }
  
      if (
        orderIndex !== undefined &&
        insertType === "before" &&
        oldOrderIndex[0].orderIndex !== null
      ) {
        await db
          .update(subjects)
          .set({ orderIndex: sql`${subjects.orderIndex} + 1` })
          .where(gte(subjects.orderIndex, parseInt(orderIndex.toString())));
        await db
          .update(subjects)
          .set({ orderIndex: parseInt(orderIndex.toString()) })
          .where(eq(subjects.id, id));
      } else if (
        orderIndex !== undefined &&
        insertType === "after" &&
        oldOrderIndex[0].orderIndex !== null
      ) {
        await db
          .update(subjects)
          .set({ orderIndex: sql`${subjects.orderIndex} + 1` })
          .where(gt(subjects.orderIndex, parseInt(orderIndex.toString())));
        await db
          .update(subjects)
          .set({ orderIndex: parseInt(orderIndex.toString()) + 1 })
          .where(eq(subjects.id, id));
      }
  
      // clean up
      await db
        .update(subjects)
        .set({ orderIndex: sql`${subjects.orderIndex} - 1` })
        .where(gt(subjects.orderIndex, oldOrderIndex[0].orderIndex as number));
  
      const updateData: any = { title: newName };
      if (icon !== undefined) {
        updateData.icon = icon;
      }
  
      await db.update(subjects).set(updateData).where(eq(subjects.id, id));
    } catch (error) {
      throw new Error(`Failed to update subject: ${(error as Error).message}`);
    }
  };
  
  export const deleteSubject = async (id: number) => {
    try {
      const [oldOrderIndex] = await db
        .select({ orderIndex: subjects.orderIndex })
        .from(subjects)
        .where(eq(subjects.id, id));
  
      if (oldOrderIndex.orderIndex === null) {
        throw new Error("Old order index not found");
      }
  
      await db
        .update(subjects)
        .set({ orderIndex: sql`${subjects.orderIndex} - 1` })
        .where(gt(subjects.orderIndex, oldOrderIndex.orderIndex as number));
      await db.delete(subjects).where(eq(subjects.id, id));
    } catch (error) {
      throw new Error(`Failed to delete subject: ${(error as Error).message}`);
    }
  };