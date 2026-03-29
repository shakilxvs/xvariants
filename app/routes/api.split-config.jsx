import { json } from "react-router";
import { db } from "../firebase.server";

export const loader = async ({ request }) => {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");

  if (!shop) {
    return json({ error: "Missing shop param" }, { status: 400 });
  }

  const doc = await db.collection("splitConfig").doc(shop).get();
  const items = doc.exists ? doc.data().items || [] : [];

  return json(
    { items },
    {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET",
        "Cache-Control": "public, max-age=60",
      },
    }
  );
};
