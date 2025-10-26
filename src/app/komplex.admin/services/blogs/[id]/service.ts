import { db } from "@/db/index.js";
import { blogs, users } from "@/db/schema.js";
import { eq } from "drizzle-orm";
import { userSavedBlogs } from "@/db/schema.js";

export const getBlogById = async (id: number) => {
  try {
    const blog = await db.select().from(blogs).where(eq(blogs.id, id)).limit(1);

    if (!blog || blog.length === 0 || !blog[0]) {
      throw new Error("Blog not found");
    }

    // Update view count
    await db
      .update(blogs)
      .set({
        viewCount: (blog[0]?.viewCount ?? 0) + 1,
        updatedAt: new Date(),
      })
      .where(eq(blogs.id, id))
      .returning();

    return blog[0];
  } catch (error) {
    throw new Error(`Failed to get blog: ${(error as Error).message}`);
  }
};

export const likeBlog = async (id: number, userId: number) => {
  try {
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const blog = await db.select().from(blogs).where(eq(blogs.id, id)).limit(1);

    if (!blog || blog.length === 0 || !blog[0]) {
      throw new Error("Blog not found");
    }

    return blog[0];
  } catch (error) {
    throw new Error(`Failed to like blog: ${(error as Error).message}`);
  }
};

export const getSavedBlogs = async (blogId: number) => {
  try {
    const blog = await db.select().from(blogs).where(eq(blogs.id, blogId));

    if (!blog || blog.length === 0 || !blog[0]) {
      throw new Error("Blog not found");
    }

    const savedBlogs = await db
      .select()
      .from(userSavedBlogs)
      .where(eq(userSavedBlogs.blogId, blogId))
      .leftJoin(users, eq(userSavedBlogs.userId, users.id));

    const savedBlogsWithUser = savedBlogs.map((savedBlog) => ({
      username: savedBlog.users?.firstName + " " + savedBlog.users?.lastName,
      createdAt: savedBlog.user_saved_blogs.createdAt,
    }));

    return savedBlogsWithUser;
  } catch (error) {
    throw new Error(`Failed to get saved blogs: ${(error as Error).message}`);
  }
};
