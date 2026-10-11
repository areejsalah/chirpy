import { randomBytes } from "node:crypto";
import argon2 from "argon2";
import jwt from "jsonwebtoken";
import type { Request } from "express";

import type { JwtPayload } from "jsonwebtoken";

type Payload = Pick<JwtPayload, "iss" | "sub" | "iat" | "exp">;

export function makeJWT(
  userID: string,
  expiresIn: number,
  secret: string,
): string {
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + expiresIn;

  const payload: Payload = {
    iss: "chirpy",
    sub: userID,
    iat,
    exp,
  };

  return jwt.sign(payload, secret);
}

export function validateJWT(
  tokenString: string,
  secret: string,
): string {
  const payload = jwt.verify(tokenString, secret) as Payload;

  if (!payload.sub) {
    throw new Error("Invalid token");
  }

  return payload.sub;
}

export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password);
}

export async function checkPasswordHash(
  password: string,
  hash: string,
): Promise<boolean> {
  return argon2.verify(hash, password);
}

export function getBearerToken(req: { get: (name: string) => string | undefined },
): string {
  const authHeader = req.get("Authorization");

  if (!authHeader) {
    throw new Error("Authorization header not found");
  }

  const [bearer, token] = authHeader.split(" ");

  if (bearer !== "Bearer" || !token) {
    throw new Error("Invalid Authorization header");
  }

  return token;
}

export function getAPIKey(req: Request): string {
  const authHeader = req.get("Authorization");

  if (!authHeader) {
    throw new Error("No authorization header found");
  }

  const [prefix, ...keyParts] = authHeader.trim().split(/\s+/);

  if (prefix !== "ApiKey" || keyParts.length === 0) {
    throw new Error("Invalid authorization header format");
  }

  return keyParts.join(" ").trim();
}

export function makeRefreshToken(): string {
  return randomBytes(32).toString("hex");
}
