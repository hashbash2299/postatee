"use client"
import { useParams } from "next/navigation"
import { sudaneseRooms } from "@/lib/chatRoomsData"
import Link from "next/link"

export default function RoomPage(){
  const { id } = useParams()
  const room = sudaneseRooms.find(r=>r.id===id) || sudaneseRooms[1]

  return (
    <div className="h-screen bg-[#0B1416] flex flex-col text-white">
      <div className="bg-[#122025] border-b border-[#1E3A42] p-3 flex items-center gap-3">
        <Link href="/chat-rooms" className="w-9 h-9 bg-[#1A2E35] rounded-full flex items-center justify-center">←</Link>
        <div className={`w-10 h-10 rounded-xl ${room.bg} flex items-center justify-center text-xl`}>{room.icon}</div>
        <div className="flex-1">
          <h2 className="font-black text-[15px]">{room.name} • 🟢 {room.online} متصل</h2>
          <p className="text-[11px] text-white/50">{room.desc}</p>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-3 bg-[#0B1416]">
        <div className="bg-[#1A2E35] p-3 rounded-2xl rounded-br-sm max-w-[80%] text-[14px]">السلام عليكم يا ناس {room.name} 👋</div>
        <div className="bg-[#00E676] text-black p-3 rounded-2xl rounded-bl-sm max-w-[80%] ml-auto text-[14px] font-bold">وعليكم السلام، منورنا والله 🇸🇩</div>
      </div>

      <div className="p-3 bg-[#122025] flex gap-2">
        <input placeholder="اكتب رسالتك..." className="flex-1 bg-[#1A2E35] rounded-full px-4 py-3 text-[14px] outline-none focus:ring-2 focus:ring-[#00E676]" />
        <button className="w-12 h-12 bg-[#00E676] rounded-full flex items-center justify-center text-black font-black">➤</button>
      </div>
    </div>
  )
}