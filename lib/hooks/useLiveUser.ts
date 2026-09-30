import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";

export function useLiveUser(uid: string) {
  const [user, setUser] = useState<any>(null);
  useEffect(() => {
    if(!uid) return;
    const unsub = onSnapshot(doc(db, 'users', uid), (snap) => {
      if(snap.exists()){
        const data = snap.data();
        let lastSeenMs = 0;
        if(data.lastSeen?.toMillis) lastSeenMs = data.lastSeen.toMillis();
        else if(data.lastSeen?.seconds) lastSeenMs = data.lastSeen.seconds*1000;
        const diff = Date.now() - lastSeenMs;
        const reallyOnline = data.isOnline === true && diff < 2*60*1000;
        setUser({ uid: snap.id,...data, reallyOnline, lastSeenMs });
      }
    });
    return () => unsub();
  }, [uid]);
  return user;
}