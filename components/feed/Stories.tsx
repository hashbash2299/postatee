"use client"
import { useState, useEffect, useRef } from "react";
import { db } from "@/app/lib/firebase";
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from "firebase/firestore";
import { Plus } from "lucide-react";

export default function Stories({ currentUser }: any){
  const [stories, setStories] = useState<any[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(()=>{
    const q = query(collection(db, "stories"), orderBy("created_at","desc"));
    const unsub = onSnapshot(q, (snap: any)=> {
      const all = snap.docs.map((d: any)=>({id:d.id,...d.data()}));
      // فلترة 24 ساعة فقط في الواجهة عشان ما نحتاج index
      const now = Date.now();
      const filtered = all.filter((s: any)=>{
        const t = s.created_at?.seconds? s.created_at.seconds*1000 : s.created_at?.toDate?.()?.getTime() || now;
        return (now - t) < 24*60*60*1000;
      });
      setStories(filtered);
    }, (err)=>console.log("Stories error",err));
    return ()=>unsub();
  },[]);

  const handleAddStory = async (e:any)=>{
    const file = e.target.files[0]; if(!file) return;
    if(file.size > 500*1024){ alert("الصورة كبيرة - اختار صورة اقل من 500KB"); return; }
    const reader = new FileReader();
    reader.onload = async (ev)=>{
      try{
        await addDoc(collection(db, "stories"), {
          image: ev.target?.result,
          uid: currentUser.uid,
          authorName: currentUser.displayName || currentUser?.displayName || "مستخدم",
          authorAvatar: currentUser.avatar || currentUser.photoURL || `https://i.pravatar.cc/100?img=15`,
          created_at: serverTimestamp()
        });
      }catch(err:any){ alert("خطأ الاستوري: "+err.message); }
    };
    reader.readAsDataURL(file);
  };

  if(!currentUser) return null;

  return (
    <div className="w-full overflow-hidden">
      <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1" style={{scrollbarWidth:'none'}}>
        {/* اضافة حالة */}
        <div className="flex flex-col items-center gap-1 min-w-[60px] max-w-[60px] cursor-pointer shrink-0" onClick={()=>fileRef.current?.click()}>
          <div className="w-14 h-14 rounded-full bg-gradient-to-r from-violet-500 to-purple-600 p-[2px] shrink-0">
            <div className="w-full h-full rounded-full bg-black flex items-center justify-center relative overflow-hidden">
              <img src={currentUser?.avatar || currentUser?.photoURL || `https://i.pravatar.cc/100?img=15`} className="w-full h-full rounded-full object-cover" alt="me"/>
              <div className="absolute -bottom-1 -right-1 bg-violet-500 rounded-full w-5 h-5 flex items-center justify-center border-2 border-black"><Plus className="w-3 h-3 text-white"/></div>
            </div>
          </div>
          <span className="text-[11px] text-white/60 truncate w-full text-center">اضافة حالة</span>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleAddStory}/>
        </div>

        {/* باقي الحالات */}
        {stories.map(s=>(
          <div key={s.id} className="flex flex-col items-center gap-1 min-w-[60px] max-w-[60px] shrink-0">
            <div className="w-14 h-14 rounded-full bg-gradient-to-r from-cyan-400 to-violet-500 p-[2px] shrink-0 overflow-hidden">
              <img src={s.authorAvatar || `https://i.pravatar.cc/100?img=12`} className="w-full h-full rounded-full object-cover border-2 border-black bg-[#0B1418]" alt={s.authorName}/>
            </div>
            <span className="text-[11px] text-white/60 truncate w-full text-center">{s.authorName?.split(' ')[0] || "مستخدم"}</span>
          </div>
        ))}

        {stories.length===0 && <span className="text-xs text-white/20 self-center mr-4">لا توجد حالات - كن أول من يضيف</span>}
      </div>
    </div>
  )
}