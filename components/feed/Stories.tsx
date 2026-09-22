"use client"
import { useState, useEffect, useRef } from "react";
import { db, auth } from "@/app/lib/firebase";
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from "firebase/firestore";
import { Plus } from "lucide-react";

export default function Stories({ currentUser }: any){
  const [stories, setStories] = useState<any[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(()=>{
    const q = query(collection(db, "stories"), orderBy("created_at","desc"));
    const unsub = onSnapshot(q, snap=> setStories(snap.docs.map(d=>({id:d.id,...d.data()}))));
    return ()=>unsub();
  },[]);

  const handleAddStory = async (e:any)=>{
    const file = e.target.files[0]; if(!file) return;
    const reader = new FileReader();
    reader.onload = async (ev)=>{
      await addDoc(collection(db, "stories"), {
        image: ev.target?.result,
        uid: auth.currentUser?.uid,
        authorName: currentUser.displayName,
        authorAvatar: currentUser.avatar,
        created_at: serverTimestamp()
      });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-3 flex gap-3 overflow-x-auto scrollbar-hide">
      {/* اضافة حالة */}
      <div className="flex flex-col items-center gap-1 min-w-[60px] cursor-pointer" onClick={()=>fileRef.current?.click()}>
        <div className="w-14 h-14 rounded-full bg-gradient-to-r from-violet-500 to-purple-600 p-[2px]">
          <div className="w-full h-full rounded-full bg-black flex items-center justify-center relative">
            <img src={currentUser?.avatar} className="w-full h-full rounded-full object-cover"/>
            <div className="absolute -bottom-1 -right-1 bg-violet-500 rounded-full w-5 h-5 flex items-center justify-center border-2 border-black"><Plus className="w-3 h-3 text-white"/></div>
          </div>
        </div>
        <span className="text-[11px] text-white/60">اضافة حالة</span>
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleAddStory}/>
      </div>

      {/* باقي الحالات */}
      {stories.map(s=>(
        <div key={s.id} className="flex flex-col items-center gap-1 min-w-[60px] cursor-pointer">
          <div className="w-14 h-14 rounded-full bg-gradient-to-r from-cyan-400 to-violet-500 p-[2px]">
            <img src={s.authorAvatar} className="w-full h-full rounded-full object-cover border-2 border-black"/>
          </div>
          <span className="text-[11px] text-white/60 truncate w-[60px] text-center">{s.authorName?.split(' ')[0]}</span>
        </div>
      ))}
    </div>
  )
}