import { db } from "@/db/index.js";
import { eq, ilike, and } from "drizzle-orm";
import { grades, lessons, subjects } from "@/db/schema.js";
import { books } from "@/db/schema.js";
import { redis } from "@/db/redis/redisConfig.js";
import { json } from "stream/consumers";

const BOOK_CACHE_PREFIX = "book:";

export const createBook = async(
    title: string,
    author: string,
    gradeId: number,
    lessonId: number,
    isRecommended: boolean,
    subjectId: number,
    publishedDate: string | Date, // Change type
    description: string,
    pdfUrl: string,
    imageUrl: string,
)=>{
    try{
        const result = await db.insert(books).values({
            title,
            author,
            gradeId,
            lessonId,
            isRecommended,
            subjectId,
            publishedDate: typeof publishedDate === 'string' ? publishedDate : publishedDate.toISOString().split('T')[0],
            description,
            pdfUrl,
            imageUrl
        }).returning();
        await redis.del("books:all");

        return { data: result[0] };
    }catch(err){
        console.error('Database error creating book:', err); // Add logging
        throw new Error(`Failed to create book: ${(err as Error).message}`);
    }
}

export const updateBook = async (
    id: string, 
    payload: {
        title?: string;
        author?: string;
        gradeId?: number;
        lessonId?: number;
        isRecommended?: boolean;
        subjectId?: number;
        publishedDate?: Date | string;
        description?: string;
        pdfUrl?: string;
        imageUrl?: string;
    }
) => {
    try {
        const result = await db.update(books).set({
            ...payload,
            publishedDate: payload.publishedDate ? 
                (typeof payload.publishedDate === 'string' ? payload.publishedDate : payload.publishedDate.toISOString().split('T')[0]) 
                : undefined,
            updatedAt: new Date() 
        }).where(eq(books.id, Number(id))).returning();
        
        if (result.length === 0) {
            return { data: null };
        }
        await redis.del(`${BOOK_CACHE_PREFIX}${id}`);
        await redis.del("books:all");
        return { data: result[0] };
    } catch(err) {
        throw new Error(`Failed to update book: ${(err as Error).message}`);
    }
}

export const deleteBook = async(id: string)=>{
    try{
        const result = await db.delete(books).where(eq(books.id, Number(id))).returning();
        if (result.length === 0) {
            return { data: null };
        }
        await redis.del(`${BOOK_CACHE_PREFIX}${id}`);
        await redis.del("books:all");

        return { data: result[0] };
    }catch(err){
        throw new Error(`Failed to delete book: ${(err as Error).message}`);
    }
}

export const adminGetAllBooks = async ()=>{
    try{
        const cached = await redis.get("books:all");
        if (cached) {
            return { data: JSON.parse(cached) };
        }
        const result = await db.select().from(books);
        await redis.set("books:all", JSON.stringify(result), { EX: 60 * 60 });

        return { data: result };
    }catch(err){
        throw new Error(`Failed to get all books: ${(err as Error).message}`);
    }
}

export const adminGetBookById = async (id:string)=>{
    try{
        const cacheKey = `${BOOK_CACHE_PREFIX}${id}`;
        const cached = await redis.get(cacheKey);
        if (cached) {
            return { data: JSON.parse(cached) };
        }
        const result = await db.select().from(books).where(eq(books.id, Number(id)));
        if (result.length === 0) {
            return { data: null };
        }

        await redis.set(cacheKey, JSON.stringify(result[0]), { EX: 60 * 60 });
        return { data: result[0] };
    }catch(err){
        throw new Error(`Failed to get book by id: ${(err as Error).message}`);
    }
}