"use client"
import { useEffect } from "react";
import { auth, db } from "@/lib/firebase";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

export default function PresenceProvider({children}:{children:React.ReactNode}){
  useEffect(()=>{
    let interval: any;
    const unsub = onAuthStateChanged(auth, async (u)=>{
      if(!u) return;
      const userRef = doc(db,'users',u.uid);
      try{
        await updateDoc(userRef, { isOnline: true, lastSeen: serverTimestamp() });
      }catch{}
      
      // حدث كل دقيقة
      interval = setInterval(async ()=>{
        try{ await updateDoc(userRef, { lastSeen: serverTimestamp() }); }catch{}
      }, 60*1000);

      const handleUnload = async ()=>{
        try{ await updateDoc(userRef, { isOnline: false, lastSeen: serverTimestamp() }); }catch{}
      };
      window.addEventListener('beforeunload', handleUnload);
    });
    return ()=> { unsub(); if(interval) clearInterval(interval); };
  },[]);
  return <>{children}</>;
}