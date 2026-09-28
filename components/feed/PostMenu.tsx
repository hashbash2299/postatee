"use client"

import { db } from "@/lib/firebase";

import { doc, deleteDoc } from "firebase/firestore";
import { Trash2, Edit3, EyeOff, Copy, Flag, MoreHorizontal, X, AlertTriangle } from "lucide-react";
import { useState, useEffect, useRef } from "react";

export default function PostMenu({ post, currentUser, onHide, onEdit }: { post:any, currentUser:any, onHide:()=>void, onEdit:(p:any)=>void }){
  const [open, setOpen] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(()=>{
    const handler = (e:any)=>{
      if(menuRef.current &&!menuRef.current.contains(e.target)) {
        setOpen(false);
        setShowConfirm(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return ()=> document.removeEventListener('mousedown', handler);
  },[]);

  const isMine = (post.authorId||post.uid)===currentUser.uid;
  const canDeleteAny = currentUser.role === "مالك" || currentUser.role === "admin";
  const canDelete = isMine || canDeleteAny;

  const handleDelete = async()=>{
    await deleteDoc(doc(db,'posts',post.id));
    setShowConfirm(false);
    setOpen(false);
  }

  return (
    <div className="relative" ref={menuRef}>
      <button onClick={(e)=>{e.stopPropagation(); setOpen(!open);}} className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center transition">
        <MoreHorizontal className="w-5 h-5 text-white/40"/>
      </button>

      {open &&!showConfirm && (
        <div className="absolute left-0 top-10 w-56 bg-[#101a1a] border border-white/10 rounded-2xl shadow-2xl z-20 overflow-hidden animate-in fade-in" onClick={e=>e.stopPropagation()}>
          <button onClick={async()=>{await navigator.clipboard.writeText(post.content); setOpen(false);}} className="w-full text-right px-4 py-2.5 text-[13px] hover:bg-white/5 flex gap-3 items-center text-white/80">
            <Copy className="w-4 h-4"/> نسخ النص
          </button>
          <button onClick={()=>{onHide(); setOpen(false);}} className="w-full text-right px-4 py-2.5 text-[13px] hover:bg-white/5 flex gap-3 items-center text-white/80">
            <EyeOff className="w-4 h-4"/> إخفاء المنشور
          </button>
          {!isMine && (
            <button onClick={()=>setOpen(false)} className="w-full text-right px-4 py-2.5 text-[13px] hover:bg-white/5 flex gap-3 items-center text-white/80">
              <Flag className="w-4 h-4"/> إبلاغ
            </button>
          )}
          {canDelete && (
            <>
              <div className="h-[1px] bg-white/10 my-1"/>
              <button onClick={()=>{setOpen(false); setTimeout(()=>onEdit(post),50);}} className="w-full text-right px-4 py-2.5 text-[13px] hover:bg-white/5 flex gap-3 items-center text-white/80">
                <Edit3 className="w-4 h-4"/> تعديل المنشور
              </button>
              <button onClick={()=>{setOpen(false); setShowConfirm(true);}} className="w-full text-right px-4 py-2.5 text-[13px] hover:bg-red-500/10 text-red-400 flex gap-3 items-center">
                <Trash2 className="w-4 h-4"/> حذف المنشور
              </button>
            </>
          )}
        </div>
      )}

      {showConfirm && (
        <div className="absolute left-0 top-10 w-64 bg-[#151f1f] border border-red-500/30 rounded-2xl shadow-2xl z-30 p-4" onClick={e=>e.stopPropagation()}>
          <div className="flex gap-2 items-center text-sm font-bold text-red-300 mb-2">
            <AlertTriangle className="w-4 h-4"/> متأكد تحذف البوست؟
          </div>
          <p className="text-[12px] text-white/50 mb-4 line-clamp-2">"{post.content?.slice(0,60)}..."</p>
          <div className="flex gap-2 justify-end">
            <button onClick={()=>setShowConfirm(false)} className="px-4 py-1.5 rounded-full bg-white/10 text-xs hover:bg-white/15">إلغاء</button>
            <button onClick={handleDelete} className="px-4 py-1.5 rounded-full bg-red-500 text-white text-xs font-bold hover:bg-red-600">حذف نهائي</button>
          </div>
        </div>
      )}
    </div>
  )
}