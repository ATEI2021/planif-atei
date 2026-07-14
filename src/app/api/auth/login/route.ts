import { NextResponse } from "next/server";
import { verifyPassword } from "@/lib/password";
import { createSessionCookie, SESSION_COOKIE_NAME } from "@/lib/session";

export async function POST(request: Request) {
  const { email, password } = await request.json();

  const validEmail = process.env.BACKOFFICE_EMAIL;
  const validHash = process.env.BACKOFFICE_PASSWORD_HASH;

  if (
    !validEmail ||
    !validHash ||
    typeof email !== "string" ||
    typeof password !== "string" ||
    email.toLowerCase() !== validEmail.toLowerCase() ||
    !verifyPassword(password, validHash)
  ) {
    return NextResponse.json({ error: "Identifiants incorrects" }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE_NAME, createSessionCookie(email), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 30 * 24 * 60 * 60,
  });
  return response;
}
