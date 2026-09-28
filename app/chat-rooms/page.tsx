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
        {sudaneseRooms.map((room: any)=>(
          <Link key={room.id} href={`/chat-rooms/${room.id}`} className={`${room.isBig? 'col-span-2' : ''}`}>
            <div className={`
              bg-[#122025] rounded-[26px] border border-[#1E3A42] p-4 flex justify-between hover:border-[#00E676] hover:scale-[1.02] active:scale-[0.98] transition-all group
              ${room.isBig
               ? 'h-[115px] flex-row items-center bg-gradient-to-r from-[#122025] to-[#1E3520] border-[#FFD700]/30'
                : 'aspect-square flex-col'}
            `}>
              <div className={`flex ${room.isBig? 'items-center gap-4' : 'justify-between items-start'}`}>
                <div className={`w-[56px] h-[56px] rounded-[18px] ${room.bg} flex items-center justify-center text-[28px] group-hover:scale-110 transition-transform shrink-0`}>
                  {room.icon}
                </div>
                {room.isBig && (
                  <div>
                    <h3 className="font-black text-[18px] leading-tight flex items-center gap-2">
                      {room.name}
                      <span className="bg-[#FFD700] text-black text-[9px] px-2 py-0.5 rounded-full">الأكثر نشاطا 🔥</span>
                    </h3>
                    <p className="text-[12px] text-white/50 mt-1">{room.desc}</p>
                    <p className="text-[11px] text-white/30 mt-1">خش سلم على أهلك كلهم هنا ❤️</p>
                  </div>
                )}
                {!room.isBig && (
                  <div className="bg-[#00E676]/10 text-[#00E676] text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 h-fit">
                    <span className="w-2 h-2 bg-[#00E676] rounded-full animate-pulse"></span>
                    {room.online}
                  </div>
                )}
              </div>

              {/* محتوى الكرت */}
              {room.isBig? (
                <div className="text-right">
                  <div className="bg-[#FFD700]/15 text-[#FFD700] text-[11px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1">
                    <span className="w-2 h-2 bg-[#FFD700] rounded-full animate-pulse"></span>
                    {room.online} متصل الآن
                  </div>
                </div>
              ) : (
                <div>
                  <h3 className="font-black text-[16px] leading-tight">{room.name}</h3>
                  <p className="text-[12px] text-white/50 mt-1">{room.desc}</p>
                  <div className="mt-3 h-1 w-full bg-white/5 rounded-full overflow-hidden">
                    <div className={`h-full bg-gradient-to-r ${room.color} w-[70%]`}></div>
                  </div>
                  <div className="mt-2 text-[10px] text-white/30 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-[#00E676] rounded-full animate-pulse"></span>
                    {room.online} متصل
                  </div>
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}