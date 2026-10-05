import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { doc, onSnapshot, updateDoc, serverTimestamp } from "firebase/firestore";

const ADMIN_UID = "خت هنا الـ UID بتاع حسابك انت"; // مهم جدا

export function useLiveUser(uid: string) {
  const [user, setUser] = useState<any>(null);
  useEffect(() => {
    if(!uid) return;
    const unsub = onSnapshot(doc(db, 'users', uid), async (snap) => {
      if(snap.exists()){
        const data = snap.data();

        // === الحماية الذاتية ===
        // لو الحساب ده ما الادمن واسمو Postatee رجعو للاسم الاصلي تلقائي
        if(data.uid!== ADMIN_UID && data.displayName === "Postatee" && data.displayNameLower && data.displayNameLower!== "postatee") {
          try {
            const cleanName = data.displayNameLower;
            const cleanUsername = (data.displayNameLower || uid).toLowerCase().replace(/[^a-z0-9_]/g,'_').slice(0,15) || `user_${uid.slice(0,5).toLowerCase()}`;
            await updateDoc(doc(db, 'users', uid), {
              displayName: cleanName,
              displayNameLower: cleanName.toLowerCase(),
              username: cleanUsername,
              usernameLower: cleanUsername,
              updatedAt: serverTimestamp()
            });
            console.log("تم اصلاح حساب", uid);
            return; // ما تعرض لحد ما يتصلح
          } catch(e){ console.log("فشل الاصلاح", e) }
        }

        // لو username و usernameLower مختلفين صلحهم
        if(data.username && data.usernameLower && data.username.toLowerCase()!== data.usernameLower.toLowerCase() && data.usernameLower.length > 5) {
           // ده كان سبب user_UZFLa vs UmHusam
           try {
             await updateDoc(doc(db, 'users', uid), {
               username: data.usernameLower.toLowerCase().replace(/[^a-z0-9_]/g,'_'),
               usernameLower: data.usernameLower.toLowerCase().replace(/[^a-z0-9_]/g,'_'),
             });
           } catch(e){}
        }

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