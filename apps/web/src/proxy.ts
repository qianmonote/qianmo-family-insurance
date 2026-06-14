import { getSessionCookie } from "better-auth/cookies";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { DEFAULT_AUTH_REDIRECT } from "./lib/auth-redirect";

export const PUBLIC_PATHS = ["/login", "/register"] as const;

export function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.includes(pathname as (typeof PUBLIC_PATHS)[number]);
}

export function getAuthenticatedAuthPageRedirectPath() {
  return DEFAULT_AUTH_REDIRECT;
}

export function buildLoginRedirectPath(pathname: string) {
  const searchParams = new URLSearchParams({ redirect: pathname });
  return `/login?${searchParams.toString()}`;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = getSessionCookie(request);
  const isPublic = isPublicPath(pathname);

  if (!sessionCookie && !isPublic) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (sessionCookie && isPublic) {
    return NextResponse.redirect(new URL(getAuthenticatedAuthPageRedirectPath(), request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
