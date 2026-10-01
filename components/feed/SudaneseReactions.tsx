"use client"
import { useState } from "react";

export const SUDANESE_REACTIONS = [
  { id: "gudam", label: "قدااااام", emoji: "🔥", color: "text-orange-400" },
  { id: "dahk", label: "ضحكتني شديد", emoji: "😂", color: "text-yellow-400" },
  { id: "kalam", label: "دا الكلام", emoji: "👌", color: "text-cyan-400" },
  { id: "zoli", label: "زولي شديد", emoji: "❤️", color: "text-red-400" },
  { id: "balaghta", label: "بالغت ياخ", emoji: "😳", color: "text-purple-400" },
];

export function ReactionPicker({ onSelect, onClose }:{ onSelect:(id:string)=>void, onClose:()=>void }){
  return (
    <div className="absolute bottom-[50px] right-0 left-0 md:left-auto md:right-0 bg-[#1A2E35] border border-white/10 rounded-2xl p-2 shadow-[0_10px_30px_rgba(0,0,0,0.6)] flex gap-1 z-50 animate-in slide-in-from-bottom-2">
      {SUDANESE_REACTIONS.map(r=>(
        <button
          key={r.id}
          onClick={()=>{ onSelect(r.id); onClose(); }}
          className="flex flex-col items-center gap-1 hover:bg-white/10 rounded-xl p-2 transition-all hover:scale-110 min-w-[60px]"
        >
          <span className="text-[22px]">{r.emoji}</span>
          <span className="text-[8px] font-black text-white/80 whitespace-nowrap">{r.label}</span>
        </button>
      ))}
    </div>
  )
}