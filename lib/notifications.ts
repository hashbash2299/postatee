import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";

export const createNotification = async ({ to, from, fromName, fromPhoto, type, postId, text }: any) => {
  if (to === from) return; // ما نرسل لنفسنا
  await addDoc(collection(db, "notifications"), {
    to,
    from,
    fromName,
    fromPhoto: fromPhoto || null,
    type, // 'like' | 'comment' | 'friendRequest'
    postId: postId || null,
    text: text || "",
    read: false,
    createdAt: serverTimestamp(),
  });
};