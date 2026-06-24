import { NextResponse } from "next/server";
import { searchGroceries } from "@/src/lib/search";
import { isValidSingaporePostalCode, normalizeQuery } from "@/src/lib/validation";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = normalizeQuery(url.searchParams.get("q") ?? "");
  const postalCode = url.searchParams.get("postalCode") ?? "";

  if (query.length < 2) {
    return NextResponse.json({ error: "Enter at least 2 characters for the product search." }, { status: 400 });
  }

  if (!isValidSingaporePostalCode(postalCode)) {
    return NextResponse.json({ error: "Enter a valid 6-digit Singapore postal code." }, { status: 400 });
  }

  const result = await searchGroceries(query, postalCode);
  return NextResponse.json(result);
}
