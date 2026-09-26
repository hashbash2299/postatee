"use client"
import { useState, useRef } from "react";
import { db, auth } from "../../app/lib/firebase";
import { collection, addDoc } from "firebase/firestore";
import { Image as ImageIcon, Send, X, Smile, Loader2 } from "lucide-react";
import { feelingsList } from "./feelings";
import { processImage } from "../../lib/imageProcessor";

export default function CreatePost({ currentUser }: { currentUser:any }){
  const [text, setText] = useState("");
  const [media, setMedia] = useState<string|null>(null);
  const [mediaType, setMediaType] = useState<"image"|"video"|null>(null);
  const [feeling, setFeeling] = useState<any>(null);
  const [showFeelings, setShowFeelings] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e:any)=>{
    const file = e.target.files[0];
    if(!file) return;
    if(file.type.startsWith("video/")){
      const reader = new FileReader();
      reader.onload = (ev)=>{ setMedia(ev.target?.result as string); setMediaType("video"); };
      reader.readAsDataURL(file); return;
    }
    try{
      setUploading(true);
      const compressed = await processImage(file, 'post');
      if(compressed.length > 600 * 1024) { alert("الصورة كبيرة شديد"); return; }
      setMedia(compressed); setMediaType("image");
    }finally{ setUploading(false); e.target.value=""; }
  };

  const handlePost = async () => {
    if (!text.trim() &&!media) return;
    const now = Date.now();
    await addDoc(collection(db, "posts"), {
      content: text,
      image: mediaType==="image"?media:null,
      video: mediaType==="video"?media:null,
      feeling,
      created_at: new Date(),
      createdAtMillis: now,
      uid: auth.currentUser?.uid, authorId: auth.currentUser?.uid,
      authorName: currentUser?.displayName,
      authorAvatar: currentUser?.avatar || "",
      likes: [], likesCount: 0, commentsCount: 0
    });
    setText(""); setMedia(null); setMediaType(null); setFeeling(null);
  };

  return (
    <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-3">
      <div className="flex gap-3">
        <img src={currentUser?.avatar} className="w-10 h-10 rounded-full"/>
        <textarea value={text} onChange={e=>setText(e.target.value)} placeholder="بماذا تفكر؟" className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-2.5 text-[15px] outline-none resize-none min-h-[44px] fb-font"/>
      </div>
      {media && <div className="relative mt-3 rounded-xl overflow-hidden border border-white/10"><img src={media} className="w-full max-h-[400px] object-cover"/><button onClick={()=>setMedia(null)} className="absolute top-2 left-2 bg-black/70 p-1.5 rounded-full"><X className="w-4 h-4 text-white"/></button></div>}
      <div className="flex justify-between mt-3 pt-3 border-t border-white/5">
        <label className="flex gap-1.5 text-sm text-green-400 cursor-pointer fb-font"><ImageIcon className="w-5 h-5"/> صورة<input ref={fileRef} type="file" accept="image/*,video/*" hidden onChange={handleFile}/></label>
        <button onClick={handlePost} disabled={uploading} className="bg-cyan-400 text-black font-black px-6 py-1.5 rounded-full flex gap-1 items-center fb-font">{uploading?<Loader2 className="w-4 h-4 animate-spin"/>:<Send className="w-4 h-4"/>} نشر</button>
      </div>
    </div>
  )
}