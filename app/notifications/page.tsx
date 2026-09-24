"use client"
import { useEffect, useState } from "react";
import { db, auth } from "../lib/firebase";
import { collection, query, where, onSnapshot, updateDoc, doc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import Link from "next/link";

export default function NotificationsPage(){
  const [notifs, setNotifs] = useState<any[]>([]);

  useEffect(()=>{
    const unsubAuth = onAuthStateChanged(auth, (u)=>{
      if(!u) return;
      // بدون orderBy عشان ما نحتاج index
      const q = query(collection(db,"notifications"), where("toUid","==",u.uid));
      const unsubNotifs = onSnapshot(q, (snap)=>{
        const data = snap.docs.map(d=>({id:d.id, ...d.data() as any}));
        // ترتيب في الجهاز
        data.sort((a:any,b:any)=>{
          const at = a.created_at?.seconds || a.createdAt?.seconds || 0;
          const bt = b.created_at?.seconds || b.createdAt?.seconds || 0;
          return bt - at;
        });
        setNotifs(data);
        // علّم مقروء بعد ثانية
        setTimeout(()=>{
          snap.docs.forEach(d=>{
            if(!d.data().read) updateDoc(doc(db,"notifications",d.id), {read:true}).catch(()=>{});
          });
        }, 1000);
      }, (err)=>{
        console.error("notif error:", err);
      });
      return ()=> unsubNotifs();
    });
    return ()=> unsubAuth();
  },[]);

  return (
    <div className="min-h-screen bg-[#0B1418] text-white p-4" dir="rtl">
      <h1 className="text-xl font-black mb-4">الإشعارات</h1>
      <div className="space-y-2">
        {notifs.map(n=>(
          <Link key={n.id} href={n.postId ? `/#post-${n.postId}` : '/friends'} className="flex gap-3 bg-[#122025] border border-[#1A2E35] p-3 rounded-xl">
            <img src={n.fromPhoto || n.fromAvatar || `https://i.pravatar.cc/100`} className="w-10 h-10 rounded-full"/>
            <div>
              <p className="text-sm"><span className="font-bold">{n.fromName}</span> {n.text}</p>
              <p className="text-xs text-gray-400">{n.type === 'like' ? '❤️ إعجاب' : n.type === 'comment' ? '💬 تعليق' : '👥 طلب صداقة'}</p>
            </div>
            {!n.read && <div className="w-2 h-2 bg-cyan-400 rounded-full mt-2"></div>}
          </Link>
        ))}
        {notifs.length===0 && <p className="text-gray-400 text-center mt-10">لا توجد إشعارات بعد - جرب تعمل لايك من حساب تاني</p>}
      </div>
    </div>
  )
}