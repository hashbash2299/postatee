"use client"
import Link from "next/link"
import { useEffect, useState } from "react"
import { db, auth } from "@/lib/firebase"
import { doc, onSnapshot, collection, query, where } from "firebase/firestore"
import { onAuthStateChanged } from "firebase/auth"

export default function StoreBanner(){
  const [coins, setCoins] = useState(0)
  const [giftsCount, setGiftsCount] = useState(0)
  const [show, setShow] = useState(true)
  const [user, setUser] = useState<any>(null)

  useEffect(()=>{ return onAuthStateChanged(auth, setUser) },[])

  useEffect(()=>{
    if(!user) return
    // ✅ FIX 1: error callback عشان لو الـ Rules رفضت ما توقع الصفحة
    const unsubUser = onSnapshot(doc(db,"users",user.uid), snap=>{
      if(snap.exists()) setCoins(snap.data().coins || 0)
    }, ()=>{})

    // ✅ FIX 2: where واحد بس، عشان ما يحتاج Composite Index
    // الفلترة بتاعة claimed بنعملها في الجهاز، ما في السيرفر
    const q = query(collection(db,"gifts"), where("toUid","==",user.uid))
    const unsubGifts = onSnapshot(q, snap=>{
      const unclaimed = snap.docs.filter(d => d.data().claimed !== true)
      setGiftsCount(unclaimed.length)
    }, ()=>{ setGiftsCount(0) })

    return ()=>{ unsubUser(); unsubGifts() }
  },[user])

  if(!show) return null

  return (
    <div className="relative z-10 mx-3 mb-2 shrink-0">
      <div className="bg-gradient-to-r from-[#1A2E35] to-[#122025] border border-white/10 rounded-[16px] overflow-hidden">
        <div className="flex items-center gap-3 p-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-[20px] shrink-0">🛍️</div>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-black truncate">🛍️ المتجر - رصيدك {coins} كوينز {giftsCount > 0 ? `• 🎁 عندك ${giftsCount} هدية` : ""}</p>
            <p className="text-[10px] text-white/50 truncate">هدايا + كوينز + إطارات + ألوان الاسم • اضغط للدخول</p>
          </div>
          <Link href="/store" className="bg-[#ffcc00] text-black text-[11px] font-black px-3 py-2 rounded-full shrink-0">المتجر</Link>
          <button onClick={()=>setShow(false)} className="text-white/40 text-[12px] px-1">✕</button>
        </div>
        <div className="h-[3px] bg-white/5"><div className="h-full w-[65%] bg-[#ffcc00]" /></div>
      </div>
    </div>
  )
}