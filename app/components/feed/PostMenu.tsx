"use client"
import { db } from "../../app/lib/firebase";
import { doc, deleteDoc, updateDoc } from "firebase/firestore";
import { Trash2, Edit3, EyeOff, Copy, Flag, MoreHorizontal } from "lucide-react";
import { useState } from "react";

export default function PostMenu({ post, currentUser, onHide, onEdit }: { post:any, currentUser:any, onHide:()=>void, onEdit:(p:any)=>void }){
  const [open, setOpen] = useState(false);
  const isMine = (post.authorId||post.uid)===currentUser.uid;

  const handleCopy = async()=>{ await navigator.clipboard.writeText(post.content); alert("تم النسخ ✓"); setOpen(false); }
  const handleHide = ()=>{ onHide(); setOpen(false); }
  const handleDelete = async()=>{ setOpen(false); if(!confirm("تحذف المنشور؟")) return; await deleteDoc(doc(db,'posts',post.id)); }
  const handleEdit = ()=>{ setOpen(false); onEdit(post); } // بنقفل أول وبعدين نعدل - ده الحل

  return (
    <div className="relative">
      <button onClick={(e)=>{e.stopPropagation(); setOpen(!open);}} className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center"><MoreHorizontal className="w-5 h-5 text-white/30"/></button>
      {open && (
        <div className="absolute left-0 top-10 w-52 bg-[#101a1a] border border-white/10 rounded-xl shadow-2xl z-20 overflow-hidden" onClick={e=>e.stopPropagation()}>
          <button onClick={handleCopy} className="w-full text-right px-4 py-2.5 text-sm hover:bg-white/5 flex gap-2 items-center"><Copy className="w-4 h-4"/> نسخ النص</button>
          <button onClick={handleHide} className="w-full text-right px-4 py-2.5 text-sm hover:bg-white/5 flex gap-2 items-center"><EyeOff className="w-4 h-4"/> إخفاء المنشور</button>
          <button onClick={()=>{setOpen(false); alert("تم الإبلاغ");}} className="w-full text-right px-4 py-2.5 text-sm hover:bg-white/5 flex gap-2 items-center"><Flag className="w-4 h-4"/> إبلاغ</button>
          {isMine && <><div className="h-[1px] bg-white/10 my-1"/><button onClick={handleEdit} className="w-full text-right px-4 py-2.5 text-sm hover:bg-white/5 flex gap-2 items-center"><Edit3 className="w-4 h-4"/> تعديل المنشور</button><button onClick={handleDelete} className="w-full text-right px-4 py-2.5 text-sm hover:bg-red-500/10 text-red-400 flex gap-2 items-center"><Trash2 className="w-4 h-4"/> حذف المنشور</button></>}
        </div>
      )}
    </div>
  )
}