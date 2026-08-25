import { getNeonAuth } from "@/lib/auth/server";

type Context = { params: Promise<{ path: string[] }> };

const dispatch = (method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH") =>
  (request: Request, context: Context) => getNeonAuth().handler()[method](request, context);

export const GET = dispatch("GET");
export const POST = dispatch("POST");
export const PUT = dispatch("PUT");
export const DELETE = dispatch("DELETE");
export const PATCH = dispatch("PATCH");
