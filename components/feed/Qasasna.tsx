"use client"
import { useState, useEffect, useRef } from "react";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, getDocs, doc } from "firebase/firestore";
import { X, Video, Loader2 } from "lucide-react";

export default function Reels({ currentUser }: any){
  const [reels, setReels] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState("");
  const [viewReel, setViewReel] = useState<any>(null);
  const [videoSrc, setVideoSrc] = useState<string>("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(()=>{
    const q = query(collection(db, "reels"), orderBy("created_at","desc"));
    const unsub = onSnapshot(q, (snap)=>{
      setReels(snap.docs.map(d=>({id:d.id,...d.data()} as any)));
    });
    return ()=>unsub();
  },[]);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((res, rej)=>{
      const reader = new FileReader();
      reader.onload = e=>res(e.target?.result as string);
      reader.onerror = rej;
      reader.readAsDataURL(file);
    });
  };

  const getVideoDuration = (file: File): Promise<number> => {
    return new Promise((res)=>{
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = ()=>{
        URL.revokeObjectURL(video.src);
        res(video.duration);
      };
      video.src = URL.createObjectURL(file);
    });
  };

  const handleAddReel = async (e:any)=>{
    const file = (e.target.files?.[0]) as File;
    if(!file) return;

    // فحص الحجم والمدة
    if(file.size > 8 * 1024 * 1024){
      alert("الفيديو كبير - اختار فيديو اقل من 8 ميقا (حوالي 15 ثانية)");
      return;
    }
    const duration = await getVideoDuration(file);
    if(duration > 20){
      alert("الفيديو طويل - لازم اقل من 20 ثانية");
      return;
    }

    setUploading(true);
    setProgress("جاري تحويل الفيديو...");
    try{
      const base64 = await fileToBase64(file);
      const chunkSize = 650 * 1024; // 650KB زي الاستوري عشان ما نكسر الحد
      const chunks: string[] = [];
      for(let i=0; i<base64.length; i+=chunkSize){
        chunks.push(base64.slice(i, i+chunkSize));
      }

      setProgress(`جاري الرفع ${chunks.length} جزء...`);

      // 1. نعمل مستند الريل الاساسي
      const reelDoc = await addDoc(collection(db, "reels"), {
        uid: currentUser.uid,
        authorName: currentUser.displayName || "مستخدم",
        authorAvatar: currentUser.avatar || currentUser.photoURL,
        chunksCount: chunks.length,
        duration: Math.round(duration),
        created_at: serverTimestamp()
      });

      // 2. نرفع الاجزاء في subcollection
      for(let i=0; i<chunks.length; i++){
        setProgress(`برفع جزء ${i+1} من ${chunks.length}...`);
        await addDoc(collection(db, `reels/${reelDoc.id}/chunks`), {
          index: i,
          data: chunks[i]
        });
      }

      setProgress("تم!");
    }catch(err:any){
      alert("خطأ: " + err.message);
    }finally{
      setUploading(false);
      setProgress("");
      if(fileRef.current) fileRef.current.value="";
    }
  };

  const openReel = async (reel:any)=>{
    setViewReel(reel);
    setVideoSrc("");
    // نجمع الاجزاء
    const q = query(collection(db, `reels/${reel.id}/chunks`), orderBy("index","asc"));
    const snap = await getDocs(q);
    let full = "";
    snap.docs.forEach(d=> full += (d.data() as any).data);
    setVideoSrc(full);
  };

  if(!currentUser) return null;

  return (
    <div className="w-full">
      <div className="flex gap-2 p-2">
        <button onClick={()=>fileRef.current?.click()} disabled={uploading} className="flex items-center gap-2 bg-violet-600 px-4 py-2 rounded-full text-white text-sm disabled:opacity-50">
          {uploading? <Loader2 className="w-4 h-4 animate-spin"/> : <Video className="w-4 h-4"/>}
          {uploading? progress : "نشر ريل"}
        </button>
        <input ref={fileRef} type="file" accept="video/*" hidden onChange={handleAddReel}/>
      </div>

      <div className="grid grid-cols-3 gap-1 p-2">
        {reels.map((r:any)=>(
          <div key={r.id} onClick={()=>openReel(r)} className="aspect-[9/16] bg-zinc-900 rounded-[12px] overflow-hidden relative cursor-pointer border border-white/10">
            <div className="absolute inset-0 flex items-center justify-center">
              <Video className="w-6 h-6 text-white/50"/>
            </div>
            <div className="absolute bottom-1 left-1 right-1">
              <p className="text-[10px] text-white/80 truncate">{r.authorName}</p>
              <p className="text-[9px] text-white/50">{r.duration}s</p>
            </div>
          </div>
        ))}
      </div>

      {viewReel && (
        <div className="fixed inset-0 z-[9999] bg-black flex flex-col" dir="rtl">
          <div className="flex justify-between p-3 items-center">
            <div className="flex gap-2 items-center">
              <img src={viewReel.authorAvatar} className="w-9 h-9 rounded-full"/>
              <p className="text-white text-sm">{viewReel.authorName}</p>
            </div>
            <button onClick={()=>{setViewReel(null); setVideoSrc("")}} className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center">
              <X className="w-5 h-5 text-white"/>
            </button>
          </div>
          <div className="flex-1 flex items-center justify-center bg-black">
            {!videoSrc? (
              <Loader2 className="w-8 h-8 text-white animate-spin"/>
            ) : (
              <video src={videoSrc} controls autoPlay loop className="max-w-full max-h-full" />
            )}
          </div>
        </div>
      )}
    </div>
  )
}