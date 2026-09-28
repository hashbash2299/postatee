"use client"
import { useState, useRef } from "react";
import { auth, db, storage } from "@/lib/firebase";
import { collection, addDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Image as ImageIcon, Video, Send, X, Smile, Loader2 } from "lucide-react";
import { feelingsList } from "./feelings";
import { processImage } from "@/lib/imageProcessor";

export default function CreatePost({ currentUser }: { currentUser:any }){
  const [text, setText] = useState("");
  const [media, setMedia] = useState<string|null>(null);
  const [mediaType, setMediaType] = useState<"image"|"video"|null>(null);
  const [feeling, setFeeling] = useState<any>(null);
  const [showFeelings, setShowFeelings] = useState(false);
  const [uploading, setUploading] = useState(false);
  const imageRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);

  const handleImage = async (e:any)=>{
    const file = e.target.files[0];
    if(!file) return;
    try{
      setUploading(true);
      const compressed = await processImage(file, 'post');
      if(compressed.length > 800 * 1024) { alert("الصورة كبيرة شديد"); return; }
      setMedia(compressed); setMediaType("image");
    }finally{ setUploading(false); e.target.value=""; }
  };

  const handleVideo = async (e:any)=>{
    const file = e.target.files[0];
    if(!file) return;
    if(file.size > 50 * 1024 * 1024){ alert("الفيديو لازم أقل من 50 ميقا"); return; }
    try{
      setUploading(true);
      const r = ref(storage, `posts/videos/${auth.currentUser?.uid}_${Date.now()}_${file.name}`);
      await uploadBytes(r, file);
      const url = await getDownloadURL(r);
      setMedia(url); setMediaType("video");
    }catch(err){ alert("فشل رفع الفيديو"); }
    finally{ setUploading(false); e.target.value=""; }
  };

  const handlePost = async () => {
    if (!text.trim() &&!media) return;
    setUploading(true);
    try{
      const now = Date.now();
      await addDoc(collection(db, "posts"), {
        content: text,
        image: mediaType==="image"?media:null,
        video: mediaType==="video"?media:null,
        feeling: feeling || null,
        created_at: new Date(),
        createdAtMillis: now,
        uid: auth.currentUser?.uid, authorId: auth.currentUser?.uid,
        authorName: currentUser?.displayName,
        authorAvatar: currentUser?.avatar || "",
        likes: [], likesCount: 0, commentsCount: 0
      });
      setText(""); setMedia(null); setMediaType(null); setFeeling(null); setShowFeelings(false);
    }finally{ setUploading(false); }
  };

  return (
    <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-3 relative">
      <div className="flex gap-3">
        <img src={currentUser?.avatar} className="w-10 h-10 rounded-full shrink-0"/>
        <div className="w-full">
          <textarea value={text} onChange={e=>setText(e.target.value)} placeholder={feeling? `ما شعورك وأنت ${feeling.label}?` : "بماذا تفكر؟"} className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-2.5 text-[15px] outline-none resize-none min-h-[44px] fb-font text-white"/>
          {feeling && <div className="mt-2 flex items-center gap-2 text-[13px] bg-violet-500/10 border border-violet-500/20 rounded-full px-3 py-1 w-fit"><span className="text-[16px]">{feeling.icon}</span><span className="text-white/80">يشعر بـ {feeling.label}</span><button onClick={()=>setFeeling(null)}><X className="w-3 h-3 text-white/50"/></button></div>}
        </div>
      </div>
      {media && <div className="relative mt-3 rounded-xl overflow-hidden border border-white/10 bg-black">{mediaType==="image"? <img src={media} className="w-full max-h-[400px] object-cover"/> : <video src={media} controls className="w-full max-h-[400px]"/>}<button onClick={()=>{setMedia(null); setMediaType(null);}} className="absolute top-2 left-2 bg-black/70 p-1.5 rounded-full"><X className="w-4 h-4 text-white"/></button></div>}
      {showFeelings && <div className="absolute z-30 bottom-[55px] right-3 left-3 bg-[#101c1f] border border-white/10 rounded-2xl p-3 shadow-2xl max-h-[200px] overflow-y-auto"><div className="grid grid-cols-2 gap-2">{feelingsList.map((f:any,i:number)=>(<button key={i} onClick={()=>{setFeeling(f); setShowFeelings(false);}} className="flex items-center gap-2 p-2 rounded-xl hover:bg-white/10 text-right"><span className="text-[22px]">{f.icon}</span><span className="text-[13px] text-white/80">{f.label}</span></button>))}</div></div>}
      <div className="flex justify-between items-center mt-3 pt-3 border-t border-white/5">
        <div className="flex gap-3">
          <label className="flex gap-1.5 text-sm text-green-400 cursor-pointer items-center"><ImageIcon className="w-5 h-5"/> صورة<input ref={imageRef} type="file" accept="image/*" hidden onChange={handleImage}/></label>
          <label className="flex gap-1.5 text-sm text-blue-400 cursor-pointer items-center"><Video className="w-5 h-5"/> فيديو<input ref={videoRef} type="file" accept="video/*" hidden onChange={handleVideo}/></label>
          <button onClick={()=>setShowFeelings(!showFeelings)} className="flex gap-1.5 text-sm text-yellow-400 cursor-pointer items-center"><Smile className="w-5 h-5"/> شعور</button>
        </div>
        <button onClick={handlePost} disabled={uploading || (!text.trim() &&!media)} className="bg-cyan-400 text-black font-black px-6 py-1.5 rounded-full flex gap-1.5 items-center disabled:opacity-40">{uploading?<Loader2 className="w-4 h-4 animate-spin"/>:<Send className="w-4 h-4"/>} نشر</button>
      </div>
    </div>
  )
}