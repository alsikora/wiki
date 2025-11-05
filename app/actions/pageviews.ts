"use server";

import redis from '@/app/cache';

const keyFor = (id: number | string) => `pageviews:article:${id}`;

export async function incrementPageview(articleId: number) {
  const articleKey = keyFor(articleId);
  const newVal = await redis.incr(articleKey);
  return +newVal;
}