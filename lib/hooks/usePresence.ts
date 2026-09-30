"use client"
import { useEffect } from "react";
import { auth, db } from "@/lib/firebase";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

export function usePresence(){
  useEffect(()=>{
    let interval:any = null;
    let currentUid:string|null = null;

    const updateOnline = async (isOnline: boolean) => {
      if(!currentUid) return;
      try{
        await updateDoc(doc(db,'users',currentUid), {
          isOnline,
          lastSeen: serverTimestamp(),
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

        window.addEventListener('beforeunload', ()=> {
          // محاولة أخيرة
          if(currentUid) {
             // @ts-ignore
             navigator.sendBeacon && navigator.sendBeacon;
          }
        });

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