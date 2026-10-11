import { eq } from "drizzle-orm";
import { db } from "../index.js";
import { NewUser, users } from "../schema.js";

export async function createUser(user: NewUser) {
  const [result] = await db
    .insert(users)
    .values(user)
    .onConflictDoNothing()
    .returning();
  return result;
}

export async function getUserByEmail(email: string) {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email));

  return user;
}

export async function deleteAllUsers() {
  await db.delete(users);
}

export async function updateUser(
  userId: string,
  email: string,
  hashedPassword: string,
) {
  const [user] = await db
    .update(users)
    .set({
      email,
      hashedPassword,
    })
    .where(eq(users.id, userId))
    .returning();

  return user;
}

export async function upgradeUserToChirpyRed(userId: string) {
  const [user] = await db
    .update(users)
    .set({ isChirpyRed: true })
    .where(eq(users.id, userId))
    .returning();

  return user;
}
