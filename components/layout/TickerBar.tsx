"use client"
export default function TickerBar(){
  return (
    <div className="w-full bg-[#00E5FF] text-black text-[12px] font-bold h-[28px] flex items-center overflow-hidden">
      <div className="animate-marquee whitespace-nowrap flex gap-10">
        <span>👋 مرحباً بكم في Postatee - منصة سودانية لكل السودانيين حول العالم - معاً نبني سودان أفضل 🇸🇩</span>
        <span>👋 مرحباً بكم في Postatee - منصة سودانية لكل السودانيين حول العالم - معاً نبني سودان أفضل 🇸🇩</span>
        <span>👋 مرحباً بكم في Postatee - منصة سودانية لكل السودانيين حول العالم - معاً نبني سودان أفضل 🇸🇩</span>
        <span>👋 مرحباً بكم في Postatee - منصة سودانية لكل السودانيين حول العالم - معاً نبني سودان أفضل 🇸🇩</span>
      </div>
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
       .animate-marquee {
          animation: marquee 50s linear infinite;
        }
      `}</style>
    </div>
  )
}