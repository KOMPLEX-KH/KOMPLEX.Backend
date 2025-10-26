import { db } from "@/db/index.js";
import { blogs, users, userSavedBlogs } from "@/db/schema.js";
import { and, eq } from "drizzle-orm";
import { blogMedia } from "@/db/models/blog_media.js";

export const getAllBlogs = async (type?: string, topic?: string) => {
  try {
    const conditions = [];
    if (type) conditions.push(eq(blogs.type, type as string));
    if (topic) conditions.push(eq(blogs.topic, topic as string));

    const blogsFromDb =
      conditions.length > 0
        ? await db
            .select({
              id: blogs.id,
              userId: blogs.userId,
              title: blogs.title,
              description: blogs.description,
              type: blogs.type,
              topic: blogs.topic,
              userFirstName: users.firstName,
              userLastName: users.lastName,
              viewCount: blogs.viewCount,
              createdAt: blogs.createdAt,
              updatedAt: blogs.updatedAt,
            })
            .from(blogs)
            .where(and(...conditions))
        : await db
            .select({
              id: blogs.id,
              userId: blogs.userId,
              title: blogs.title,
              description: blogs.description,
              type: blogs.type,
              topic: blogs.topic,
              userFirstName: users.firstName,
              userLastName: users.lastName,
              viewCount: blogs.viewCount,
              createdAt: blogs.createdAt,
              updatedAt: blogs.updatedAt,
            })
            .from(blogs)
            .leftJoin(users, eq(blogs.userId, users.id))
            .leftJoin(userSavedBlogs, eq(blogs.id, userSavedBlogs.blogId));

    const blogWithMedia = await Promise.all(
      blogsFromDb.map(async (blog) => {
        const media = await db
          .select()
          .from(blogMedia)
          .where(eq(blogMedia.blogId, blog.id));
        return {
          id: blog.id,
          userId: blog.userId,
          title: blog.title,
          description: blog.description,
          type: blog.type,
          topic: blog.topic,
          viewCount: blog.viewCount,
          createdAt: blog.createdAt,
          updatedAt: blog.updatedAt,
          username: `${blog.userFirstName} ${blog.userLastName}`,
          media: media.map((m) => ({ url: m.url, mediaType: m.mediaType })),
        };
      })
    );

    return blogWithMedia;
  } catch (error) {
    throw new Error(`Failed to get blogs: ${(error as Error).message}`);
  }
};

export const postBlog = async (
  userId: number,
  title: string,
  description: string,
  type?: string,
  topic?: string,
  publicUrl?: string,
  mediaType?: "image" | "video"
) => {
  try {
    if (!userId || !title || !description) {
      throw new Error("Missing required fields");
    }

    const newBlog = await db
      .insert(blogs)
      .values({
        userId: Number(userId),
        title,
        description,
        type,
        topic,
        viewCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    if (publicUrl) {
      await db.insert(blogMedia).values({
        blogId: newBlog[0].id,
        url: publicUrl,
        mediaType: mediaType,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    return newBlog[0];
  } catch (error) {
    throw new Error(`Failed to create blog: ${(error as Error).message}`);
  }
};
