"use client"
import { useEffect, useState } from "react";
import { db, auth } from "../lib/firebase";
import { collection, query, where, orderBy, onSnapshot, updateDoc, doc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import Link from "next/link";

export default function NotificationsPage(){
  const [notifs, setNotifs] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);

  useEffect(()=>{
    const unsub = onAuthStateChanged(auth, (u)=>{
      if(!u) return;
      setUser(u);
      // وحدنا الحقول: toUid و created_at
      const q = query(collection(db,"notifications"), where("toUid","==",u.uid), orderBy("created_at","desc"));
      const unsubNotifs = onSnapshot(q, (snap)=>{
        setNotifs(snap.docs.map(d=>({id:d.id,...d.data()})));
        snap.docs.forEach(d=>{
          if(!d.data().read) updateDoc(doc(db,"notifications",d.id), {read:true}).catch(()=>{});
        });
      }, (err)=>{ console.log(err); });
      return ()=> unsubNotifs();
    });
    return ()=> unsub();
  },[]);

  return (
    <div className="min-h-screen bg-[#0B1418] text-white p-4" dir="rtl">
      <h1 className="text-xl font-black mb-4">الإشعارات</h1>
      <div className="space-y-2">
        {notifs.map(n=>(
          <Link key={n.id} href={n.postId? `/#post-${n.postId}` : '/friends'} className="flex gap-3 bg-[#122025] border border-[#1A2E35] p-3 rounded-xl">
            <img src={n.fromPhoto || n.fromAvatar || `https://i.pravatar.cc/100`} className="w-10 h-10 rounded-full"/>
            <div>
              <p className="text-sm"><span className="font-bold">{n.fromName}</span> {n.text || (n.type==='like'? 'أعجب بمنشورك' : n.type==='comment'? 'علق على منشورك' : 'أرسل طلب صداقة')}</p>
              <p className="text-xs text-gray-400">{n.type === 'like'? '❤️ إعجاب' : n.type === 'comment'? '💬 تعليق' : '👥 طلب صداقة'}</p>
            </div>
          </Link>
        ))}
        {notifs.length===0 && <p className="text-gray-400 text-center mt-10">لا توجد إشعارات بعد</p>}
      </div>
    </div>
  )
}