import { db } from "../firebase.server";

export const loader = async ({ request }) => {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");

  if (!shop) {
    return new Response(JSON.stringify({ error: "Missing shop param" }), { status: 400, headers: { "Content-Type": "application/json" } });
  }

  const doc = await db.collection("splitConfig").doc(shop).get();
  const items = doc.exists ? doc.data().items || [] : [];

  return new Response(JSON.stringify({ items }), {
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET",
      "Cache-Control": "public, max-age=60",
    },
  });
};
