"use client"
import { useEffect, useState } from "react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";

export default function HomePage(){
  const [posts, setPosts] = useState<any[]>([]);

  useEffect(()=>{
    const q = query(collection(db, 'posts'), orderBy('created_at','desc'));
    return onSnapshot(q, (snap)=>{
      setPosts(snap.docs.map(d=>({id:d.id,...d.data()})));
    });
  },[]);

  return (
    <div className="w-full max-w-[650px] mx-auto min-h-screen bg-[#0B1418] lg:bg-[#050a0a]">
      {/* شريط القصص */}
      <div className="p-3 border-b border-white/5 bg-[#0B1418]">
        <div className="flex gap-3 overflow-x-auto">
          <div className="flex flex-col items-center gap-1 min-w-[60px]">
            <div className="w-[56px] h-[56px] rounded-full bg-white/10 border-2 border-dashed border-white/20 flex items-center justify-center">+</div>
            <span className="text-[11px] text-white/60">اضافة حالة</span>
          </div>
        </div>
      </div>

      {/* صندوق انشاء منشور */}
      <div className="p-3 border-b border-white/5 bg-[#0B1418] m-3 rounded-2xl border border-white/10">
        <div className="flex gap-3">
          <img src={auth.currentUser?.photoURL || `https://i.pravatar.cc/100`} className="w-10 h-10 rounded-full" />
          <button className="flex-1 text-right bg-white/[0.06] rounded-full px-4 py-2.5 text-white/40 text-[13px]">
            بماذا تفكر؟
          </button>
        </div>
      </div>

      {/* الفيد */}
      <div className="space-y-3 p-3">
        {posts.map((post:any)=>(
          <div key={post.id} className="bg-[#111E24] rounded-2xl p-4 border border-white/5">
            <div className="flex items-center gap-3 mb-3">
              <img src={post.authorAvatar} className="w-9 h-9 rounded-full" />
              <div>
                <p className="text-white text-[13px] font-bold">{post.authorName}</p>
                <p className="text-white/30 text-[11px]">{post.created_at?.toDate?.()?.toLocaleString?.('ar-SD') || 'الآن'}</p>
              </div>
            </div>
            <p className="text-white/90 text-[14px] leading-6 whitespace-pre-wrap">{post.content}</p>
            {post.image && <img src={post.image} className="mt-3 rounded-xl w-full" />}
          </div>
        ))}
      </div>
    </div>
  )
}