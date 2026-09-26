"use client"
import { useEffect, useState } from "react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { Image as ImageIcon, Video, Smile } from "lucide-react";

export default function HomePage(){
  const [posts, setPosts] = useState<any[]>([]);

  useEffect(()=>{
    const q = query(collection(db, 'posts'), orderBy('created_at','desc'));
    return onSnapshot(q, (snap)=>{
      setPosts(snap.docs.map(d=>({id:d.id,...d.data()})));
    });
  },[]);

  return (
    <div className="w-full max-w-[680px] mx-auto min-h-screen">
      {/* قصص */}
      <div className="flex gap-3 p-4 overflow-x-auto bg-[#0B1418] lg:bg-transparent border-b lg:border-0 border-white/5">
        <div className="flex flex-col items-center gap-1.5 min-w-[64px]">
          <div className="w-[58px] h-[58px] rounded-full bg-[#1A2E35] border-2 border-dashed border-white/20 flex items-center justify-center text-white text-xl">+</div>
          <span className="text-[11px] text-white/60">إضافة حالة</span>
        </div>
      </div>

      {/* انشاء منشور */}
      <div className="bg-[#111E24] lg:rounded-2xl p-3 mx-0 lg:mx-3 mt-3 border-y lg:border border-white/[0.06]">
        <div className="flex gap-3 items-center">
          <img src={auth.currentUser?.photoURL || `https://i.pravatar.cc/100?u=test`} className="w-10 h-10 rounded-full" />
          <div className="flex-1 bg-[#1C2F36] rounded-full px-4 py-3 text-white/30 text-[13px]">بم تفكر؟</div>
        </div>
        <div className="flex justify-between mt-3 pt-3 border-t border-white/5">
          <button className="flex items-center gap-2 text-[12px] font-bold text-white/50"><Video className="w-5 h-5 text-red-400"/> فيديو مباشر</button>
          <button className="flex items-center gap-2 text-[12px] font-bold text-white/50"><ImageIcon className="w-5 h-5 text-green-400"/> صورة/فيديو</button>
          <button className="flex items-center gap-2 text-[12px] font-bold text-white/50"><Smile className="w-5 h-5 text-yellow-400"/> شعور</button>
        </div>
      </div>

      {/* المنشورات */}
      <div className="mt-3 space-y-3 px-0 lg:px-3 pb-20 lg:pb-3">
        {posts.length===0 && (
          <div className="text-center py-20 text-white/20 text-[13px]">لا توجد منشورات بعد - كن أول من ينشر</div>
        )}
        {posts.map((post:any)=>(
          <div key={post.id} className="bg-[#111E24] lg:rounded-2xl p-4 border-y lg:border border-white/[0.06]">
            <div className="flex gap-3">
              <img src={post.authorAvatar || `https://i.pravatar.cc/100?u=${post.authorId}`} className="w-10 h-10 rounded-full bg-white/10" />
              <div>
                <p className="text-white font-bold text-[13px]">{post.authorName || 'مستخدم'}</p>
                <p className="text-white/30 text-[11px]">الآن • 🌍</p>
              </div>
            </div>
            <p className="text-white/90 text-[14px] mt-3 leading-7 whitespace-pre-wrap">{post.content}</p>
            {post.image && <img src={post.image} className="mt-3 rounded-xl w-full object-cover" />}
          </div>
        ))}
      </div>
    </div>
  )
}