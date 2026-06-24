import { NextResponse } from "next/server";
import { searchGroceries } from "@/src/lib/search";
import { isValidQuery, isValidSingaporePostalCode, MAX_QUERY_LENGTH, normalizeQuery } from "@/src/lib/validation";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = normalizeQuery(url.searchParams.get("q") ?? "");
  const postalCode = url.searchParams.get("postalCode") ?? "";

  if (!isValidQuery(query)) {
    return NextResponse.json({ error: `Enter a product search between 2 and ${MAX_QUERY_LENGTH} characters.` }, { status: 400 });
  }

  if (!isValidSingaporePostalCode(postalCode)) {
    return NextResponse.json({ error: "Enter a valid 6-digit Singapore postal code." }, { status: 400 });
  }

  const result = await searchGroceries(query, postalCode);
  return NextResponse.json(result);
}
