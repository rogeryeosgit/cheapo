import { NextResponse } from "next/server";
import { searchGroceries } from "@/src/lib/search";
import { isValidQuery, MAX_QUERY_LENGTH, normalizeQuery } from "@/src/lib/validation";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = normalizeQuery(url.searchParams.get("q") ?? "");

  if (!isValidQuery(query)) {
    return NextResponse.json({ error: `Enter a product search between 2 and ${MAX_QUERY_LENGTH} characters.` }, { status: 400 });
  }

  const result = await searchGroceries(query);
  return NextResponse.json(result);
}
