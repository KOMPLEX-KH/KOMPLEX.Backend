import { eq, sql, and } from "drizzle-orm";
import { db } from "@/db/index.js";
import { notes } from "@/db/schema.js";
import { ResponseError } from "@/utils/responseError.js";


export const getAllNotes = async ()=>{
    // ! no filter by user ?
    return await db.select().from(notes);
}

export const getNotesById = async(
    id: string,
    userId: number
)=>{
    try{
        const note = await db.select().from(notes).where(and(eq(notes.id , Number(id)), eq(notes.userId , userId))).limit(1);
        return note.length > 0 ? note[0] : null;
    }catch(err){
        throw new ResponseError(err as string, 500);
    }
}

export const createNotes = async(
    body: any, 
    userId: number
)=>{
   try{
         const { title, content, topic, tags, color, is_pinned, is_archived, reminder_at } = body;
         const reminderDateFormatted =
            typeof reminder_at === "string"
              ? reminder_at
              : reminder_at
              ? new Date(reminder_at).toISOString().split("T")[0]
              : null;

         const [newNote] = await db.insert(notes).values({
            userId: userId,
            title,
            content,
            topic,
            tags,
            isPinned: is_pinned ?? false,
            isArchived: is_archived ?? false,
            reminderAt: reminderDateFormatted,
            createdAt: new Date(),
            updatedAt: new Date(),
         }).returning();

        return newNote;
   }catch(err){
        throw new ResponseError(err as string, 500);
   }

}
