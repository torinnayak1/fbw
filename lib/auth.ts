import { createHash, createHmac, timingSafeEqual } from "crypto";
import { PLAYER_IDS, type PlayerId, type Session, type UserId } from "./types";
import { PLAYERS } from "./players";

export { PLAYERS };

const SALT = "fbw-championship-2026-katmai";
const SECRET = "fbw-2026-session-katmai-brooks-river";

const USERS: Record<
  UserId,
  { name: string; hash: string; isAdmin: boolean }
> = {
  R: {
    name: "R",
    hash: "f96d7913c0ca0bb82324e15f6aa00dd97f12e2b9aac5a4cfac34e9fb4d26e79a",
    isAdmin: false
  },
  T: {
    name: "T",
    hash: "2b6d91d087c46025184c81124c27ceb56afc072a3c3bed815e3077d8bc8c5e2b",
    isAdmin: false
  },
  S: {
    name: "S",
    hash: "8f0dc44603053ea4334b52e97310827d4f38a56ecaee393d7bd3ef14bb5f3e1b",
    isAdmin: false
  },
  M: {
    name: "M",
    hash: "78ce8b76df37d870d79d602517f3a7a3907aef43fb6559d3eca029d85ae9ed9c",
    isAdmin: false
  },
  B: {
    name: "B",
    hash: "dcab5fd53af144e295e3a69b4e2c9cc67ee2a021a1fb5a94063fff9b7217169d",
    isAdmin: false
  },
  Tej: {
    name: "Tej",
    hash: "4081a2d65932c018b37403b5fa7e9d79ed36438a901e0abc88e076201d11e48e",
    isAdmin: false
  },
  Mamama: {
    name: "Mamama",
    hash: "f5b80434ad3ab72a12b8ef173096be1ab28e227459b6301769dd6423c277ae5b",
    isAdmin: false
  },
  Kyla: {
    name: "Kyla",
    hash: "54bc67e2009e7bab846756fa7d21dfecac1ef3178b88680d66005b44ff0ce824",
    isAdmin: false
  },
  Carly: {
    name: "Carly",
    hash: "1935aa300ef7b2753ad12d203314ef0e3cc141de37c5f6892a1b3ac58577c814",
    isAdmin: false
  },
  admin: {
    name: "Admin",
    hash: "a39e296c19ff7ca0f50922880acd7e9f4515d150e9552e90086c2e27d45249a7",
    isAdmin: true
  }
};

function hashPassword(password: string): string {
  return createHash("sha256").update(`${SALT}::${password}`).digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export function authenticate(userId: string, password: string): Session | null {
  const user = USERS[userId as UserId];
  if (!user) return null;
  const hashed = hashPassword(password);
  if (!safeEqual(hashed, user.hash)) return null;
  return {
    userId: userId as UserId,
    name: user.name,
    isAdmin: user.isAdmin
  };
}

export function signSession(session: Session): string {
  const payload = Buffer.from(
    JSON.stringify({
      userId: session.userId,
      name: session.name,
      isAdmin: session.isAdmin
    })
  ).toString("base64url");
  const sig = createHmac("sha256", SECRET).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

export function readSession(token: string | undefined): Session | null {
  if (!token) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const expected = createHmac("sha256", SECRET).update(payload).digest("base64url");
  if (!safeEqual(sig, expected)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (!data?.userId || !USERS[data.userId as UserId]) return null;
    return {
      userId: data.userId,
      name: USERS[data.userId as UserId].name,
      isAdmin: Boolean(USERS[data.userId as UserId].isAdmin)
    };
  } catch {
    return null;
  }
}

function cookieSecure(request?: Request): boolean {
  if (request) {
    try {
      return new URL(request.url).protocol === "https:";
    } catch {
      return false;
    }
  }
  return Boolean(process.env.VERCEL);
}

export function cookieHeader(token: string, request?: Request): string {
  const secure = cookieSecure(request) ? "; Secure" : "";
  return `fbw_session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 60 * 24 * 30}${secure}`;
}

export function clearCookieHeader(request?: Request): string {
  const secure = cookieSecure(request) ? "; Secure" : "";
  return `fbw_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`;
}

export function tokenFromRequest(request: Request): string | undefined {
  const header = request.headers.get("cookie") ?? "";
  const match = header.match(/(?:^|;\s*)fbw_session=([^;]+)/);
  return match?.[1];
}

export function sessionFromRequest(request: Request): Session | null {
  return readSession(tokenFromRequest(request));
}

export function isPlayerId(value: string): value is PlayerId {
  return (PLAYER_IDS as readonly string[]).includes(value);
}
