import { eq } from "drizzle-orm";
import { usersSync } from "drizzle-orm/neon";
import db from "@/db/index";
import { articles } from "@/db/schema";
import redis from '@/app/cache';

export async function getArticles() {
  const cached = await redis.get("articles:all");
  if (cached) {
    console.log("🎯 Get Articles Cache Hit!");
    return cached;
  }

  const response = await db
    .select({
      title: articles.title,
      id: articles.id,
      createdAt: articles.createdAt,
      content: articles.content,
      author: usersSync.name,
      imageUrl: articles.imageUrl,
    })
    .from(articles)
    .leftJoin(usersSync, eq(articles.authorId, usersSync.id));

  console.log("🙅‍♂️ Get Articles Cache Miss!");
  redis.set("articles:all", response, {
    ex: 60, // one minute
  });
  return response;
}

export async function getArticleById(id: number) {
  const response = await db
    .select({
      title: articles.title,
      id: articles.id,
      createdAt: articles.createdAt,
      content: articles.content,
      author: usersSync.name,
      imageUrl: articles.imageUrl,
    })
    .from(articles)
    .where(eq(articles.id, id))
    .leftJoin(usersSync, eq(articles.authorId, usersSync.id));
  return response[0] ? response[0] : null;
}