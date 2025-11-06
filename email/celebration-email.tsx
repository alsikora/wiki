import resend from "@/email";
import db from "@/db";
import { usersSync } from "drizzle-orm/neon";
import { articles } from "@/db/schema";
import CelebrationTemplate from '@/email/celebration-template';
import { eq } from 'drizzle-orm';

const BASE_URL = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export default async function sendCelebrationEmail(
  articleId: number,
  pageviews: number
) {
  const response = await db
    .select({
      email: usersSync.email,
      id: usersSync.id,
      title: articles.title,
      name: usersSync.name,
    })
    .from(articles)
    .leftJoin(usersSync, eq(articles.authorId, usersSync.id))
    .where(eq(articles.id, articleId));

  const {email, id, title, name} = response[0];
  if (!email) {
    console.log(
      `❌ skipping sending a celebration for getting ${pageviews} on article ${articleId}, could not find email`,
    );
    return;
  }

  console.log(email);

  // OPTION 1: this only works if you've set up your own custom domain on Resend
  // const emailRes = await resend.emails.send({
  //   from: "Wiki <noreply@mail.test>", // replace with your domain when ready
  //   to: email,
  //   subject: `✨ Your article got ${pageviews} views! ✨`,
  //   react: (
  //     <CelebrationTemplate
  //       articleTitle={title}
  //       articleUrl={`${BASE_URL}/wiki/${articleId}`}
  //       name={name ?? "Friend"}
  //       pageviews={pageviews}
  //     />
  //   ),
  // });

  // OPTION 2: If you haven't set up a custom domain (development/testing)
  const emailRes = await resend.emails.send({
    from: "Wiki <onboarding@resend.dev>", // it only lets you send from Resend if you haven't set up your domain
    to: "test@test.com", // unless you set up your own domain, you can only email yourself
    subject: `✨ You article got ${pageviews} views! ✨`,
    react: (
      <CelebrationTemplate
        articleTitle={title}
        articleUrl={`${BASE_URL}/wiki/${articleId}`}
        name={name ?? "Friend"}
        pageviews={pageviews}
      />
    ),
  });

  if (!emailRes.error) {
    console.log(
      `📧 sent ${id} a celebration for getting ${pageviews} on article ${articleId}`
    );
  } else {
    console.log(
      `❌ error sending ${id} a celebration for getting ${pageviews} on article ${articleId}`,
      emailRes.error
    );
  }
}