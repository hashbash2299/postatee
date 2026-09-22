"use client"
import { db } from "@/app/lib/firebase";
import { doc, deleteDoc } from "firebase/firestore";
import { Trash2, Edit3, EyeOff, Copy, Flag, MoreHorizontal, X, AlertTriangle } from "lucide-react";
import { useState } from "react";

export default function PostMenu({ post, currentUser, onHide, onEdit }: { post:any, currentUser:any, onHide:()=>void, onEdit:(p:any)=>void }){
  const [open, setOpen] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const isMine = (post.authorId||post.uid)===currentUser.uid;
  // انت كـ مالك بس بتقدر تحذف أي بوست
  const canDeleteAny = currentUser.role === "مالك";
  const canDelete = isMine || canDeleteAny;

  const handleDelete = async()=>{
    await deleteDoc(doc(db,'posts',post.id));
    setShowConfirm(false);
    setOpen(false);
  }

  return (
    <div className="relative">
      <button onClick={(e)=>{e.stopPropagation(); setOpen(!open);}} className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center"><MoreHorizontal className="w-5 h-5 text-white/30"/></button>

      {open &&!showConfirm && (
        <div className="absolute left-0 top-10 w-52 bg-[#101a1a] border border-white/10 rounded-xl shadow-2xl z-20 overflow-hidden" onClick={e=>e.stopPropagation()}>
          <button onClick={async()=>{await navigator.clipboard.writeText(post.content); setOpen(false);}} className="w-full text-right px-4 py-2.5 text-sm hover:bg-white/5 flex gap-2 items-center"><Copy className="w-4 h-4"/> نسخ النص</button>
          <button onClick={()=>{onHide(); setOpen(false);}} className="w-full text-right px-4 py-2.5 text-sm hover:bg-white/5 flex gap-2 items-center"><EyeOff className="w-4 h-4"/> إخفاء</button>
          {canDelete && <><div className="h-[1px] bg-white/10 my-1"/><button onClick={()=>{setOpen(false); setTimeout(()=>onEdit(post),50);}} className="w-full text-right px-4 py-2.5 text-sm hover:bg-white/5 flex gap-2 items-center"><Edit3 className="w-4 h-4"/> تعديل</button><button onClick={()=>{setOpen(false); setShowConfirm(true);}} className="w-full text-right px-4 py-2.5 text-sm hover:bg-red-500/10 text-red-400 flex gap-2 items-center"><Trash2 className="w-4 h-4"/> حذف</button></>}
        </div>
      )}

      {/* رسالة تأكيد صغيرة جنب البوست - ما بتظهر فوق الصفحة */}
      {showConfirm && (
        <div className="absolute left-0 top-10 w-64 bg-[#151f1f] border border-red-500/20 rounded-xl shadow-2xl z-30 p-3" onClick={e=>e.stopPropagation()}>
          <div className="flex gap-2 items-center text-sm font-bold text-red-300 mb-2"><AlertTriangle className="w-4 h-4"/> متأكد تحذف البوست؟</div>
          <p className="text-[12px] text-white/50 mb-3 truncate">"{post.content.slice(0,40)}..."</p>
          <div className="flex gap-2 justify-end">
            <button onClick={()=>setShowConfirm(false)} className="px-3 py-1 rounded-full bg-white/10 text-xs">إلغاء</button>
            <button onClick={handleDelete} className="px-3 py-1 rounded-full bg-red-500 text-black text-xs font-bold">حذف نهائي</button>
          </div>
        </div>
      )}
    </div>
  )
}