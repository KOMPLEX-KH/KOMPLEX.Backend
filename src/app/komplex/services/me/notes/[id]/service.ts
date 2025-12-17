import { eq, sql, and } from "drizzle-orm";
import { db } from "@/db/index.js";
import { redis } from "@/db/redis/redisConfig.js";
import { profile } from "console";
import { notes, users } from "@/db/schema.js";


export const updateNotes = async(
    id: string,
    body: any,
    userId: number
)=>{
    try{
        const {title,content,topic,tags,is_pinned,is_archived,reminder_at,} = body;
        const reminderDateFormatted =
        typeof reminder_at === "string"
          ? reminder_at
          : reminder_at
          ? new Date(reminder_at).toISOString().split("T")[0]
          : null;
        
        const result = await db.update(notes)
        .set({
            ...(title !== undefined && { title }),
            ...(content !== undefined && { content }),
            ...(topic !== undefined && { topic }),
            ...(tags !== undefined && { tags }),
            ...(is_pinned !== undefined && { isPinned: is_pinned }),
            ...(is_archived !== undefined && { isArchived: is_archived }),
            ...(reminder_at !== undefined && { reminderAt: reminderDateFormatted }),
            updatedAt: new Date(),
        }).where(and(eq(notes.id, Number(id)), eq(notes.userId, userId)));
        
        const updateCount = typeof result === "number" ? result : (result.rowCount ?? 0);

        return updateCount > 0;
    }catch(err){
        console.error("Failed to update note:", err);
        throw err;
    }
}

export const deleteNotes = async(
    id: string,
    userId: number
)=>{
    try{
        const result = await db
      .delete(notes)
      .where(and(eq(notes.id, Number(id)), eq(notes.userId, userId)));

        const deleteCount = typeof result === "number" ? result : (result.rowCount ?? 0);

        return deleteCount > 0;
    }catch(err){
        console.error("Failed to delete note:", err);
        throw err;
    }   
}