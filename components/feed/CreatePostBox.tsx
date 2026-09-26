"use client"
import { useState } from "react";
import { Video, Image as ImageIcon, Smile, X } from "lucide-react";
import { auth, db, storage } from "@/lib/firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export default function CreatePostBox(){
  const [content, setContent] = useState("");
  const [file, setFile] = useState<File|null>(null);
  const [preview, setPreview] = useState<string|null>(null);
  const [loading, setLoading] = useState(false);

  const onPick = (e:any)=>{
    const f = e.target.files[0];
    if(!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const createPost = async()=>{
    if(!content &&!file) return;
    if(!auth.currentUser) return alert("سجل دخول اول");
    setLoading(true);
    try{
      let imageUrl = "";
      let videoUrl = "";
      if(file){
        const path = `posts/${auth.currentUser.uid}/${Date.now()}_${file.name}`;
        const r = ref(storage, path);
        await uploadBytes(r, file);
        const url = await getDownloadURL(r);
        if(file.type.startsWith("video")) videoUrl = url;
        else imageUrl = url;
      }
      await addDoc(collection(db, "posts"), {
        content,
        image: imageUrl,
        video: videoUrl,
        authorId: auth.currentUser.uid,
        authorName: auth.currentUser.displayName || "مستخدم",
        authorAvatar: auth.currentUser.photoURL || "",
        created_at: serverTimestamp(),
        likes: 0
      });
      setContent(""); setFile(null); setPreview(null);
    }catch(err){ console.log(err); alert("خطأ في النشر"); }
    setLoading(false);
  };

  return (
    <div className="bg-[#111E24] lg:rounded-2xl p-3 mx-0 lg:mx-3 mt-3 border-y lg:border border-white/[0.06]">
      <div className="flex gap-3">
        <img src={auth.currentUser?.photoURL || `https://i.pravatar.cc/100`} className="w-10 h-10 rounded-full" />
        <textarea value={content} onChange={e=>setContent(e.target.value)} placeholder="بم تفكر؟ شارك فيديو أو صورة..." className="flex-1 bg-[#1C2F36] rounded-2xl px-4 py-3 text-white text-[14px] min-h-[48px] resize-none outline-none placeholder:text-white/30" />
      </div>

      {preview && (
        <div className="mt-3 relative">
          {file?.type.startsWith("video")? <video src={preview} controls className="rounded-xl w-full max-h-[300px]" /> : <img src={preview} className="rounded-xl w-full max-h-[300px] object-cover" />}
          <button onClick={()=>{setFile(null);setPreview(null);}} className="absolute top-2 right-2 bg-black/70 p-1.5 rounded-full"><X className="w-4 h-4 text-white"/></button>
        </div>
      )}

      <div className="flex justify-between items-center mt-3 pt-3 border-t border-white/5">
        <div className="flex gap-1">
          <label className="flex items-center gap-2 text-[13px] font-bold text-white/60 hover:bg-white/5 px-3 py-2 rounded-xl cursor-pointer">
            <ImageIcon className="w-5 h-5 text-green-400"/> صورة
            <input type="file" accept="image/*,video/*" hidden onChange={onPick} />
          </label>
          <label className="flex items-center gap-2 text-[13px] font-bold text-white/60 hover:bg-white/5 px-3 py-2 rounded-xl cursor-pointer">
            <Video className="w-5 h-5 text-red-500"/> فيديو
            <input type="file" accept="video/*" hidden onChange={onPick} />
          </label>
        </div>
        <button onClick={createPost} disabled={loading} className="bg-white text-black font-black text-[13px] px-6 py-2 rounded-full disabled:opacity-50">
          {loading? "..." : "نشر"}
        </button>
      </div>
    </div>
  )
}