import { db } from "@/db/index.js";
import { eq, ilike, and } from "drizzle-orm";
import { grades, lessons, subjects } from "@/db/schema.js";
import { books } from "@/db/schema.js";
import { redis } from "@/db/redis/redisConfig.js";
import { json } from "stream/consumers";
import e from "express";

const BOOK_CACHE_PREFIX = "books:";

export const getAllBooks = async()=>{
   try{
        const cacheKey = `${BOOK_CACHE_PREFIX}all`;
        const cached = await redis.get(cacheKey);
        if(cached){
            return {
                data: JSON.parse(cached)
            }
        };
        const allBooks = await db.select().from(books);
        // store data into redis
        await redis.set(cacheKey , JSON.stringify(allBooks), {EX: 60*60});

        return {
            data: allBooks
        };
   }catch(err){
    throw new Error(`Error fetching books: ${(err as Error).message}`);
   }
}

export const getBooksById = async(id: string)=>{
    try{
        const cacheKey = `${BOOK_CACHE_PREFIX}${id}`;
        const cached = await redis.get(cacheKey);
        if(cached){
            return {
                data: JSON.parse(cached)
            }
        }
        const result = await db.select().from(books).where(eq(books.id , Number(id)));

        if(!result.length){
            return {data: null};
        }

        await redis.set(cacheKey , JSON.stringify(result[0]) , {EX: 60*60});

        return {
            data: result[0]
        }
    }catch(err){
        throw new Error(`Error fetching book by id: ${(err as Error).message}`);
    }
}

export const getRecommendedBooks = async()=>{
    try{
        const cacheKey = `${BOOK_CACHE_PREFIX}recommended`;
        const cached = await redis.get(cacheKey);

        if (cached){ 
            return { data: JSON.parse(cached) }
        };

        const result = await db.select().from(books).where(eq(books.isRecommended, true));
        await redis.set(cacheKey, JSON.stringify(result), {EX: 60*60});

        return {data:result};

    }catch(err){
        throw new Error(`Error fetching recommended books: ${(err as Error).message}`);
    }
}


export const getBooksBySubject = async (subjectId: string) => {
    try{
        const cacheKey = `${BOOK_CACHE_PREFIX}subject:${subjectId}`;
        const cached = await redis.get(cacheKey);

        if (cached){ 
            return { data: JSON.parse(cached) }
        };

        const result = await db.select().from(books).where(eq(books.subjectId, Number(subjectId)));
        await redis.set(cacheKey, JSON.stringify(result), {EX: 60*30});

        return {data: result};
    }catch(err){
        throw new Error(`Error fetching books by subject: ${(err as Error).message}`);
    }

}


export const getBooksByLesson = async (lessonId: string) => {
    try{
        const cacheKey = `${BOOK_CACHE_PREFIX}lesson:${lessonId}`;
        const cached = await redis.get(cacheKey);

        if (cached){
            return { data: JSON.parse(cached) }
        };

        const result = await db.select().from(books).where(eq(books.lessonId, Number(lessonId)));
        await redis.set(cacheKey, JSON.stringify(result), { EX: 60 * 30 });

        return { data: result };
    }catch(err){
        throw new Error(`Error fetching books by lesson: ${(err as Error).message}`);
    }
}

export const searchBooks = async(keyword: string)=>{
    try{
        const result = await db.select().from(books).where(ilike(books.title, `${keyword}`));

        return {data:result};
    }catch(err){
        throw new Error(`Error searching books: ${(err as Error).message}`);
    }
}


export const filterBooks = async({lessonId, subjectId}: {lessonId?: string; subjectId?: string})=>{
    try{
        const conditions: Array<any> = [];
        if(subjectId){
            conditions.push(eq(books.subjectId, Number(subjectId)));
        }

        if(lessonId){
            conditions.push(eq(books.lessonId, Number(lessonId)));
        }

        const query = conditions.length > 0 ? and(...conditions) : undefined;

        const result = await db.select().from(books).where(query);

        return { data: result };

    }catch(err){
        throw new Error(`Error filtering books: ${(err as Error).message}`);
    }
}