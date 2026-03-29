import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

export const db = getFirestore();

export class FirebaseSessionStorage {
  async storeSession(session) {
    const data = {
      id: session.id,
      shop: session.shop,
      state: session.state,
      isOnline: session.isOnline || false,
      accessToken: session.accessToken || "",
      expires: session.expires || null,
      onlineAccessInfo: session.onlineAccessInfo || null,
      scope: session.scope || "",
    };
    await db.collection("sessions").doc(session.id).set(data);
    return true;
  }

  async loadSession(id) {
    const doc = await db.collection("sessions").doc(id).get();
    if (!doc.exists) return undefined;
    const raw = doc.data(); return { id: raw.id, shop: raw.shop, state: raw.state, isOnline: raw.isOnline, accessToken: raw.accessToken, expires: raw.expires, onlineAccessInfo: raw.onlineAccessInfo, ...raw };
  }

  async deleteSession(id) {
    await db.collection("sessions").doc(id).delete();
    return true;
  }

  async deleteSessions(ids) {
    const batch = db.batch();
    ids.forEach((id) => batch.delete(db.collection("sessions").doc(id)));
    await batch.commit();
    return true;
  }

  async findSessionsByShop(shop) {
    const snap = await db
      .collection("sessions")
      .where("shop", "==", shop)
      .get();
    if (snap.empty) return [];
    return snap.docs.map((doc) => { const raw = doc.data(); return { id: raw.id, shop: raw.shop, state: raw.state, isOnline: raw.isOnline, accessToken: raw.accessToken, expires: raw.expires, onlineAccessInfo: raw.onlineAccessInfo, ...raw }; });
  }
}
