"use client"
import { useState, useEffect, useRef } from "react";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from "firebase/firestore";
import { Plus, X } from "lucide-react";

export default function Stories({ currentUser }: any){
  const [stories, setStories] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [viewStory, setViewStory] = useState<any>(null);
  const [viewIndex, setViewIndex] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(()=>{
    const q = query(collection(db, "stories"), orderBy("created_at","desc"));
    const unsub = onSnapshot(q, (snap: any)=> {
      const all = snap.docs.map((d: any)=>({id:d.id,...d.data()}));
      const now = Date.now();
      const filtered = all.filter((s: any)=>{
        const t = s.created_at?.seconds? s.created_at.seconds*1000 : s.created_at?.toDate?.()?.getTime() || now;
        return (now - t) < 24*60*60*1000;
      });
      setStories(filtered);
    });
    return ()=>unsub();
  },[]);

  const grouped = stories.reduce((acc:any, s:any)=>{
    if(!acc[s.uid]) acc[s.uid] = { uid: s.uid, authorName: s.authorName, authorAvatar: s.authorAvatar, items: [] }
    acc[s.uid].items.push(s)
    return acc
  }, {} as any)
  const groupedList = Object.values(grouped) as any[]

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        let { width, height } = img;
        const maxDim = 720;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, width, height);
        let quality = 0.7;
        let base64 = canvas.toDataURL("image/jpeg", quality);
        while (base64.length > 650 * 1024 * 1.37 && quality > 0.1) {
          quality -= 0.1;
          base64 = canvas.toDataURL("image/jpeg", quality);
        }
        URL.revokeObjectURL(url);
        resolve(base64);
      };
      img.onerror = reject;
      img.src = url;
    });
  };

  const handleAddStory = async (e:any)=>{
    const files = Array.from(e.target.files || []) as File[]
    if(files.length===0) return
    setUploading(true)
    try{
      for(const file of files){
        if(!file.type.startsWith('image/')) continue;
        const base64 = await compressImage(file);
        await addDoc(collection(db, "stories"), {
          image: base64,
          uid: currentUser.uid,
          authorName: currentUser.displayName || "مستخدم",
          authorAvatar: currentUser.avatar || currentUser.photoURL,
          created_at: serverTimestamp()
        })
      }
    }catch(err:any){ alert(err.message) }
    finally{ setUploading(false); if(fileRef.current) fileRef.current.value="" }
  }

  if(!currentUser) return null

  return (
    <div className="w-full overflow-hidden">
      <div className="flex gap-3 overflow-x-auto pb-2 px-2">
        <div className="flex flex-col items-center gap-1 min-w-[62px] shrink-0 cursor-pointer" onClick={()=>fileRef.current?.click()}>
          <div className="w-[58px] h-[58px] rounded-[14px] overflow-hidden border-2 border-violet-600 relative">
            <img src={currentUser?.avatar || currentUser?.photoURL} className="w-full h-full object-cover" alt="me"/>
            <div className="absolute bottom-0 right-0 bg-violet-600 w-5 h-5 rounded-full flex items-center justify-center border-2 border-black">
              {uploading? <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span> : <Plus className="w-3 h-3 text-white"/>}
            </div>
          </div>
          <span className="text-[11px] text-white/60">{uploading? "جاري الضغط..." : "الحاصل عليك"}</span>
          <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={handleAddStory}/>
        </div>

        {groupedList.map((g:any)=>{
          const img = g.items[0]?.image
          return (
            <div key={g.uid} className="flex flex-col items-center gap-1 min-w-[62px] shrink-0 cursor-pointer" onClick={()=>{setViewStory(g); setViewIndex(0)}}>
              <div className="w-[58px] h-[58px] rounded-[14px] p-[3px] bg-gradient-to-tr from-yellow-400 to-pink-600">
                <div className="w-full h-full rounded-[10px] overflow-hidden bg-black">
                  <img src={img} className="w-full h-full object-cover" alt="حالة"/>
                </div>
              </div>
              <span className="text-[11px] text-white/70 truncate w-[62px] text-center">{g.authorName?.split(' ')[0]}</span>
            </div>
          )
        })}
      </div>

      {viewStory && (
        <div className="fixed inset-0 z-[9999] bg-black flex flex-col" dir="rtl">
          <div className="flex justify-between p-3 items-center">
            <div className="flex gap-2 items-center"><img src={viewStory.authorAvatar} className="w-9 h-9 rounded-full"/><p className="text-white text-sm">{viewStory.authorName}</p></div>
            <button onClick={()=>setViewStory(null)} className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center"><X className="w-5 h-5 text-white"/></button>
          </div>
          <div className="flex-1 flex items-center justify-center"><img src={viewStory.items[viewIndex]?.image} className="max-w-full max-h-full object-contain" alt="story"/></div>
          <div className="p-4 flex gap-3 justify-center">
            <button onClick={()=>setViewIndex(v=> v>0? v-1 : viewStory.items.length-1)} className="px-6 py-2 bg-white/10 rounded-full text-white">السابق</button>
            <button onClick={()=>setViewIndex(v=> v<viewStory.items.length-1? v+1 : 0)} className="px-6 py-2 bg-violet-600 rounded-full text-white">التالي</button>
          </div>
        </div>
      )}
    </div>
  )
}