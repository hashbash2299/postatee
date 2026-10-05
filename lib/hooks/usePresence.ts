"use client"
import { useEffect } from "react";
import { auth, db } from "@/lib/firebase";
import { doc, updateDoc, serverTimestamp, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

const ADMIN_UID = "خت الـ UID بتاعك هنا";

export function usePresence(){
  useEffect(()=>{
    let interval:any = null;
    let currentUid:string|null = null;

    const updateOnline = async (isOnline: boolean) => {
      if(!currentUid) return;
      try{
        // قبل ما تحدث الحالة، اتأكد الاسم ما اتغير لـ Postatee
        const snap = await getDoc(doc(db,'users',currentUid));
        if(snap.exists()){
          const d = snap.data();
          if(d.uid !== ADMIN_UID && d.displayName === "Postatee" && d.displayNameLower && d.displayNameLower !== "postatee"){
            // صلحه فورا
            await updateDoc(doc(db,'users',currentUid), {
              displayName: d.displayNameLower,
              displayNameLower: d.displayNameLower.toLowerCase(),
              username: d.usernameLower || `user_${currentUid.slice(0,5).toLowerCase()}`,
              usernameLower: d.usernameLower || `user_${currentUid.slice(0,5).toLowerCase()}`,
              isOnline,
              lastSeen: serverTimestamp(),
              updatedAt: serverTimestamp()
            });
            return;
          }
        }
        await updateDoc(doc(db,'users',currentUid), {
          isOnline,
          lastSeen: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }catch(e){}
    };

    const unsubAuth = onAuthStateChanged(auth, (u)=>{
      if(u){
        currentUid = u.uid;
        updateOnline(true);
        interval = setInterval(()=> updateOnline(true), 60000);
        const onVisible = () => {
          if(document.visibilityState === 'visible') updateOnline(true);
        };
        document.addEventListener('visibilitychange', onVisible);
        return () => document.removeEventListener('visibilitychange', onVisible);
      } else {
        currentUid = null;
        if(interval) clearInterval(interval);
      }
    });

    return ()=>{
      unsubAuth();
      if(interval) clearInterval(interval);
      if(currentUid){
        updateDoc(doc(db,'users',currentUid), { isOnline: false, lastSeen: serverTimestamp() }).catch(()=>{});
      }
    };
  },[]);
}