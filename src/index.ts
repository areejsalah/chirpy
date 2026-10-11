import { createChirp, getAllChirps, getChirp, deleteChirp } from "./db/queries/chirps.js";
import { createUser, deleteAllUsers, getUserByEmail, updateUser, upgradeUserToChirpyRed } from "./db/queries/users.js";
import express, { Request, Response, NextFunction } from "express";
import { config } from "./config.js";
import postgres from "postgres";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { drizzle } from "drizzle-orm/postgres-js";
import {getBearerToken, checkPasswordHash, hashPassword, makeJWT, validateJWT, makeRefreshToken, getAPIKey } from "./auth.js";
import { createRefreshToken, getUserFromRefreshToken, revokeRefreshToken } from "./db/queries/refreshTokens.js";

const migrationClient = postgres(config.db.url, { max: 1 });

await migrate(drizzle(migrationClient), config.db.migrationConfig);

const app = express();

app.use(express.json());

const PORT = 8080;

function middlewareLogResponses(
  req: Request,
  res: Response,
  next: express.NextFunction,
) {
  res.on("finish", () => {
    const statusCode = res.statusCode;

    if (statusCode < 200 || statusCode >= 300) {
      console.log(`[NON-OK] ${req.method} ${req.url} - Status: ${statusCode}`);
    }
  });

  next();
}


function middlewareMetricsInc(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  config.api.fileserverHits++;
  next();
}

function handlerReadiness(req: Request, res: Response) {
  res.set("Content-Type", "text/plain; charset=utf-8");
  res.send("OK");
}
function handlerMetrics(req: Request, res: Response) {
  res.set("Content-Type", "text/html; charset=utf-8");
  res.send(`
<html>
  <body>
    <h1>Welcome, Chirpy Admin</h1>
    <p>Chirpy has been visited ${config.api.fileserverHits} times!</p>
  </body>
</html>
`);
}

async function handlerReset(req: Request, res: Response) {
  if (config.api.platform !== "dev") {
    res.status(403).json({
      error: "Forbidden",
    });
    return;
  }

  await deleteAllUsers();

  config.api.fileserverHits++;

  res.set("Content-Type", "text/plain; charset=utf-8");
  res.send("Hits reset to 0");
}
async function handlerCreateUser(req: Request, res: Response) {
  const { email, password } = req.body;

  const hashedPassword = await hashPassword(password);

  const user = await createUser({
    email,
    hashedPassword,
  });

  res.status(201).json({
    id: user.id,
    email: user.email,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    isChirpyRed: user.isChirpyRed,
    
  });
}

async function handlerCreateChirp(req: Request, res: Response) {
   const { body } = req.body;

   let userID: string;

   try {
      const token = getBearerToken(req);
      userID = validateJWT(token, config.jwtSecret);
   } catch {
      throw new UnauthorizedError("Invalid or missing token");
}

  if(body.length > 140){
      throw new BadRequestError("Chirp is too long. Max length is 140");
    }
  
  
  const profaneWords = ["kerfuffle", "sharbert", "fornax"];

  const words = body.split(" ");

  const cleanedWords = words.map((word: string) => {
   if (profaneWords.includes(word.toLowerCase())) {
    return "****";

    } 

    return word;
   });

  const cleanedBody = cleanedWords.join(" ");
  
  const chirp = await createChirp(cleanedBody, userID);

  return res.status(201).json(chirp);
}

async function handlerGetChirps(
  req: Request,
  res: Response,
): Promise<void> {
  let authorId = "";
  const authorIdQuery = req.query.authorId;

  if (typeof authorIdQuery === "string") {
    authorId = authorIdQuery;
  }

  const chirps = await getAllChirps(authorId || undefined);
  
  const sortQuery = req.query.sort;
  const sortOrder = sortQuery === "desc" ? "desc" : "asc";

  chirps.sort((a, b) => {
    if (sortOrder === "desc") {
      return b.createdAt.getTime() - a.createdAt.getTime();
  }

  return a.createdAt.getTime() - b.createdAt.getTime();
});


  res.status(200).json(chirps);
}
async function handlerGetChirp(
  req: Request,
  res: Response,
): Promise<void> {
   const { chirpId } = req.params;

  if (typeof chirpId !== "string") {
    res.status(400).send("Invalid chirp ID");
    return;
  }

  const chirp = await getChirp(chirpId);

  if (!chirp) {
    res.status(404).send("Chirp not found");
    return;
  }

  res.status(200).json(chirp);
}


async function handlerLogin(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body;

  const user = await getUserByEmail(email);

  if (!user) {
    throw new UnauthorizedError("incorrect email or password");
  }

  const passwordIsCorrect = await checkPasswordHash(
    password,
    user.hashedPassword,
  );

  if (!passwordIsCorrect) {
    throw new UnauthorizedError("incorrect email or password");
  }

  const token = makeJWT(user.id, 3600, config.jwtSecret);

  const refreshToken = makeRefreshToken();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 60);

  await createRefreshToken(refreshToken, user.id, expiresAt);

  res.status(200).json({
    id: user.id,
    email: user.email,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    isChirpyRed: user.isChirpyRed,
    token,
    refreshToken,
  });
}

async function handlerRefresh(req: Request, res: Response): Promise<void> {
  let token: string;

  try {
    token = getBearerToken(req);
  } catch {
    throw new UnauthorizedError("Invalid or missing refresh token");
  }

  const user = await getUserFromRefreshToken(token);

  if (!user) {
    throw new UnauthorizedError("Invalid or expired refresh token");
  }

  const newToken = makeJWT(user.id, 3600, config.jwtSecret);

  res.status(200).json({
    token: newToken,
  });
}


async function handlerRevoke(req: Request, res: Response): Promise<void> {
  let token: string;

  try {
    token = getBearerToken(req);
  } catch {
    throw new UnauthorizedError("Invalid or missing refresh token");
  }

  await revokeRefreshToken(token);

  res.status(204).end();
}

async function handlerUpdateUser(
  req: Request,
  res: Response,
): Promise<void> {
  let userId: string;

  try {
    const token = getBearerToken(req);
    userId = validateJWT(token, config.jwtSecret);
  } catch {
    throw new UnauthorizedError("Invalid or missing token");
  }

  const { email, password } = req.body;

  const hashedPassword = await hashPassword(password);

  const user = await updateUser(userId, email, hashedPassword);

  if (!user) {
    throw new NotFoundError("User not found");
  }

  res.status(200).json({
    id: user.id,
    email: user.email,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    isChirpyRed: user.isChirpyRed,
  });
}



async function handlerDeleteChirp(
  req: Request,
  res: Response,
): Promise<void> {
  let userId: string;

  try {
    const token = getBearerToken(req);
    userId = validateJWT(token, config.jwtSecret);
  } catch {
    throw new UnauthorizedError("Invalid or missing token");
  }

  const chirpId = req.params.chirpId;

  if (typeof chirpId !== "string") {
    throw new NotFoundError("Chirp not found");
    }
  const chirp = await getChirp(chirpId);

  if (!chirp) {
    throw new NotFoundError("Chirp not found");
  }

  if (chirp.userId !== userId) {
    throw new ForbiddenError("You are not the author of this chirp");
  }

  await deleteChirp(chirpId);
  res.status(204).end();
}
async function handlerPolkaWebhooks(
  req: Request,
  res: Response,
): Promise<void> {
  
  let apiKey: string;

  try {
   apiKey = getAPIKey(req);
  } catch {
    throw new UnauthorizedError("Invalid or missing API key");
  }

  if (apiKey !== config.api.polkaKey) {
    throw new UnauthorizedError("Invalid API key");
  }
 

  const { event, data } = req.body;

  if (event !== "user.upgraded") {
    res.status(204).end();
    return;
  }

  const user = await upgradeUserToChirpyRed(data?.userId);

  if (!user) {
    throw new NotFoundError("User not found");
  }

  res.status(204).end();
}

class BadRequestError extends Error {
statusCode = 400;
}
class UnauthorizedError extends Error {
  statusCode = 401;
}

class ForbiddenError extends Error {
  statusCode = 403;
}

class NotFoundError extends Error {
  statusCode = 404;
}  
function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) {

  console.log(err);

   if (
    err instanceof BadRequestError ||
    err instanceof UnauthorizedError ||
    err instanceof ForbiddenError ||
    err instanceof NotFoundError
  ) {
    res.status(err.statusCode).json({
      error: err.message,
    });
    return;
  }

  res.status(500).json({
    error: "Something went wrong on our end",
  });
}
app.use(middlewareLogResponses);
app.get("/api/healthz", handlerReadiness);
app.get("/admin/metrics", handlerMetrics);
app.get("/api/chirps", handlerGetChirps);
app.get("/api/chirps/:chirpId", handlerGetChirp);

app.post("/admin/reset", handlerReset);
app.post("/api/chirps", handlerCreateChirp);
app.post("/api/users", handlerCreateUser);
app.post("/api/login", handlerLogin);
app.use("/app", middlewareMetricsInc);
app.use("/app", express.static("./src/app"));
app.post("/api/refresh", handlerRefresh);
app.post("/api/revoke", handlerRevoke);
app.post("/api/polka/webhooks", handlerPolkaWebhooks);

app.put("/api/users", handlerUpdateUser);
app.delete("/api/chirps/:chirpId", handlerDeleteChirp);

app.use(errorHandler);
app.listen(config.api.port, () => {
console.log(`Server is running at http://localhost:${config.api.port}`);
});


