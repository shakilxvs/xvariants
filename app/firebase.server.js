import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { Session } from "@shopify/shopify-api";

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
    const data = session.toPropertyArray().reduce((acc, [k, v]) => {
      acc[k] = v;
      return acc;
    }, {});
    await db.collection("sessions").doc(session.id).set(data);
    return true;
  }

  async loadSession(id) {
    const doc = await db.collection("sessions").doc(id).get();
    if (!doc.exists) return undefined;
    return Session.fromPropertyArray(Object.entries(doc.data()));
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
    return snap.docs.map((doc) =>
      Session.fromPropertyArray(Object.entries(doc.data()))
    );
  }
}
