import { useState, useEffect } from "react";
import { db } from "../../app/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";

export function useLiveUser(uid: string) {
  const [user, setUser] = useState<any>(null);
  useEffect(() => {
    if(!uid) return;
    const unsub = onSnapshot(doc(db, 'users', uid), (snap) => {
      if(snap.exists()) setUser(snap.data());
    });
    return () => unsub();
  }, [uid]);
  return user;
}