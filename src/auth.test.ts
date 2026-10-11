import type { Request } from "express";
import { describe, it, expect, beforeAll } from "vitest";
import {
  checkPasswordHash,
  getBearerToken,
  hashPassword,
  makeJWT,
  validateJWT,
} from "./auth.js";

describe("JWT", () => {
  const userID = "123456";
  const secret = "my-secret";
  const expiresIn = 3600;

  it("should create and validate a JWT", () => {
    const token = makeJWT(userID, expiresIn, secret);

    const result = validateJWT(token, secret);

    expect(result).toBe(userID);
  });

  it("should reject an expired JWT", () => {
  const token = makeJWT(userID, -1, secret);

  expect(() => validateJWT(token, secret)).toThrow();
});

  it("should reject a JWT with the wrong secret", () => {
  const token = makeJWT(userID, expiresIn, secret);

  expect(() => validateJWT(token, "wrong-secret")).toThrow();
});
});

describe("Password Hashing", () => {
  const password1 = "correctPassword123!";
  const password2 = "anotherPassword456!";
  let hash1: string;
  let hash2: string;

  beforeAll(async () => {
    hash1 = await hashPassword(password1);
    hash2 = await hashPassword(password2);
  });

  it("should return true for the correct password", async () => {
    const result = await checkPasswordHash(password1, hash1);
    expect(result).toBe(true);
  });

  it("should return false for the incorrect password", async () => {
    const result = await checkPasswordHash(password2, hash1);
    expect(result).toBe(false);
  });
});

describe("Bearer Token", () => {
  it("should return the token from the Authorization header", () => {
    const req = {
      get: (header: string) => {
        if (header === "Authorization") {
          return "Bearer abc123";
        }

        return undefined;
      },
    } as Request;

    const token = getBearerToken(req);

    expect(token).toBe("abc123");
  });

  it("should throw if Authorization header is missing", () => {
    const req = {
       get: () => undefined,
      };

    expect(() => getBearerToken(req)).toThrow();
  });
});
