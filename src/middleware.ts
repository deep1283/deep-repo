import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Simplified: avoid cookie-based redirects (causing OAuth loop). Client pages
// handle auth redirects with supabase-js localStorage sessions.
export async function middleware() {
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
