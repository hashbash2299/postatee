"use client"
import Link from "next/link"
import { sudaneseRooms } from "@/lib/chatRoomsData"

export default function ChatRoomsPage(){
  return (
    <div className="min-h-screen bg-[#0B1416] text-white pb-20">
      {/* هيدر */}
      <div className="sticky top-0 z-10 bg-[#0B1416]/80 backdrop-blur-md border-b border-[#1A2E35] p-4 flex items-center gap-3">
        <Link href="/" className="w-9 h-9 bg-[#1A2E35] rounded-full flex items-center justify-center">←</Link>
        <div>
          <h1 className="font-black text-[18px]">غرف الدردشة السودانية 🇸🇩</h1>
          <p className="text-[12px] text-white/50">اختار غرفتك وخش الونسة</p>
        </div>
      </div>

      {/* الشبكة */}
      <div className="p-3 grid grid-cols-2 gap-3 max-w-[600px] mx-auto">
        {sudaneseRooms.map(room=>(
          <Link key={room.id} href={`/chat-rooms/${room.id}`}>
            <div className="aspect-square bg-[#122025] rounded-[26px] border border-[#1E3A42] p-4 flex flex-col justify-between hover:border-[#00E676] hover:scale-[1.02] active:scale-[0.98] transition-all group">
              <div className="flex justify-between items-start">
                <div className={`w-[56px] h-[56px] rounded-[18px] ${room.bg} flex items-center justify-center text-[28px] group-hover:scale-110 transition-transform`}>
                  {room.icon}
                </div>
                <div className="bg-[#00E676]/10 text-[#00E676] text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1">
                  <span className="w-2 h-2 bg-[#00E676] rounded-full animate-pulse"></span>
                  {room.online}
                </div>
              </div>
              <div>
                <h3 className="font-black text-[16px] leading-tight">{room.name}</h3>
                <p className="text-[12px] text-white/50 mt-1">{room.desc}</p>
                <div className="mt-3 h-1 w-full bg-white/5 rounded-full overflow-hidden">
                  <div className={`h-full bg-gradient-to-r ${room.color} w-[70%]`}></div>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}