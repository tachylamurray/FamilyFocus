import { NextResponse } from "next/server";

export async function POST() {
  const isProduction = process.env.NODE_ENV === "production";
  
  const response = NextResponse.json({ success: true });
  
  response.cookies.set("family_finance_token", "", {
    httpOnly: true,
    sameSite: isProduction ? "none" : "lax",
    secure: isProduction,
    maxAge: 0,
    path: "/"
  });

  return response;
}

