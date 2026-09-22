"use client"
import { useState, useRef } from "react";
import { db, auth } from "../../app/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { Image as ImageIcon, Video as VideoIcon, Send, X, Smile } from "lucide-react";
import { feelingsList } from "./feelings";

export default function CreatePost({ currentUser }: { currentUser:any }){
  const [text, setText] = useState("");
  const [media, setMedia] = useState<string|null>(null);
  const [mediaType, setMediaType] = useState<"image"|"video"|null>(null);
  const [feeling, setFeeling] = useState<any>(null);
  const [showFeelings, setShowFeelings] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e:any)=>{
    const file = e.target.files[0]; if(!file) return;
    if(file.size > 12*1024*1024) return alert("الملف كبير أقل من 12MB");
    const isVideo = file.type.startsWith("video/");
    const reader = new FileReader();
    reader.onload = (ev)=>{ setMedia(ev.target?.result as string); setMediaType(isVideo?"video":"image"); };
    reader.readAsDataURL(file);
  };

  const handlePost = async () => {
    if (!text.trim() &&!media) return;
    await addDoc(collection(db, "posts"), {
      content:text, image: mediaType==="image"?media:null, video: mediaType==="video"?media:null,
      feeling, created_at: serverTimestamp(),
      uid: auth.currentUser?.uid, authorId: auth.currentUser?.uid,
      authorName: currentUser?.displayName, authorUsername: currentUser?.username,
      authorAvatar: currentUser?.avatar || "", authorRole: currentUser?.role || "",
      likes: [], likesCount: 0, commentsCount: 0
    });
    setText(""); setMedia(null); setMediaType(null); setFeeling(null); setShowFeelings(false);
  };

  return (
    <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-3">
      <div className="flex gap-3">
        <img src={currentUser?.avatar} className="w-10 h-10 rounded-full shrink-0"/>
        <div className="flex-1">
          <textarea value={text} onChange={e=>setText(e.target.value)} placeholder={`بماذا تفكر يا ${currentUser?.displayName}? ${feeling? `— ${feeling.icon} ${feeling.label}`:''}`} className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-2.5 text-sm outline-none resize-none min-h-[44px]"/>
          {feeling && <div className="mt-2 text-xs bg-yellow-400/10 border border-yellow-400/20 text-yellow-300 px-3 py-1 rounded-full inline-flex gap-2 items-center">{feeling.icon} {feeling.label} <button onClick={()=>setFeeling(null)}><X className="w-3 h-3"/></button></div>}
          {media && (
            <div className="relative mt-3 rounded-xl overflow-hidden border border-white/10">
              {mediaType==="image"? <img src={media} className="w-full max-h-[400px] object-cover"/> : <video src={media} controls className="w-full max-h-[400px] bg-black"/>}
              <button onClick={()=>{setMedia(null); setMediaType(null);}} className="absolute top-2 left-2 bg-black/70 p-1.5 rounded-full"><X className="w-4 h-4"/></button>
            </div>
          )}
        </div>
      </div>
      <div className="flex justify-between mt-3 pt-3 border-t border-white/5">
        <div className="flex gap-4 items-center">
          <button onClick={()=>{fileRef.current!.accept="image/*"; fileRef.current?.click();}} className="flex gap-1.5 text-sm text-green-400"><ImageIcon className="w-5 h-5"/> صورة</button>
          <button onClick={()=>{fileRef.current!.accept="video/*"; fileRef.current?.click();}} className="flex gap-1.5 text-sm text-red-400"><VideoIcon className="w-5 h-5"/> فيديو</button>
          <button onClick={()=>setShowFeelings(!showFeelings)} className="flex gap-1.5 text-sm text-yellow-400"><Smile className="w-5 h-5"/> شعور</button>
          <input ref={fileRef} type="file" hidden onChange={handleFile}/>
        </div>
        <button onClick={handlePost} className="bg-cyan-400 text-black font-black px-6 py-1.5 rounded-full flex gap-1"><Send className="w-4 h-4"/> نشر</button>
      </div>
      {showFeelings && <div className="mt-3 grid grid-cols-3 gap-2 bg-black/60 border border-white/10 p-3 rounded-2xl">{feelingsList.map(f=><button key={f.id} onClick={()=>{setFeeling(f); setShowFeelings(false);}} className="flex gap-2 p-2 rounded-xl hover:bg-white/10 text-sm"><span className="text-xl">{f.icon}</span> {f.label}</button>)}</div>}
    </div>
  )
}