import { asc, eq } from "drizzle-orm";
import { db } from "../index.js";
import { chirps } from "../schema.js";

export async function createChirp(body: string, userId: string) {
  const [chirp] = await db
    .insert(chirps)
    .values({
      body,
      userId,
    })
    .returning();

  return chirp;
}

export async function getAllChirps(authorId?: string) {
  if (authorId) {
    return db
      .select()
      .from(chirps)
      .where(eq(chirps.userId, authorId))
      .orderBy(asc(chirps.createdAt));
  }

  return db
    .select()
    .from(chirps)
    .orderBy(asc(chirps.createdAt));
}

export async function getChirp(id: string) {
  const result = await db
    .select()
    .from(chirps)
    .where(eq(chirps.id, id));

  return result[0];
}

export async function deleteChirp(chirpId: string) {
  const [deletedChirp] = await db
    .delete(chirps)
    .where(eq(chirps.id, chirpId))
    .returning();

  return deletedChirp;
}

