"use client"
export default function TickerBar(){
  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-[100] w-full bg-[#00E5FF] text-black text-[12px] font-bold h-[28px] flex items-center overflow-hidden whitespace-nowrap">
        <div className="animate-marquee flex gap-10">
          <span>👋 مرحباً بكم في Postatee - منصة سودانية لكل السودانيين حول العالم - معاً نبني سودان أفضل 🇸🇩</span>
          <span>👋 مرحباً بكم في Postatee - منصة سودانية لكل السودانيين حول العالم - معاً نبني سودان أفضل 🇸🇩</span>
          <span>👋 مرحباً بكم في Postatee - منصة سودانية لكل السودانيين حول العالم - معاً نبني سودان أفضل 🇸🇩</span>
          <span>👋 مرحباً بكم في Postatee - منصة سودانية لكل السودانيين حول العالم - معاً نبني سودان أفضل 🇸🇩</span>
        </div>
        <style>{`
          @keyframes marquee { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
         .animate-marquee { animation: marquee 25s linear infinite; }
        `}</style>
      </div>
      {/* مسافة فاضية عشان المحتوى ما يتداخل مع الشريط */}
      <div className="h-[28px]" />
    </>
  )
}