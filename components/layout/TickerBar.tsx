"use client"
export default function TickerBar(){
  return (
    <div className="w-full bg-[#00E5FF] text-black text-[12px] font-bold h-[28px] flex items-center overflow-hidden">
      <div className="flex w-max animate-marquee">
        {/* المجموعة الاولى */}
        <div className="flex gap-5 shrink-0 pl-5">
          <span>👋 مرحباً بكم في Postatee - منصة سودانية لكل السودانيين حول العالم - معاً نبني سودان أفضل 🇸🇩</span>
          <span>👋 مرحباً بكم في Postatee - منصة سودانية لكل السودانيين حول العالم - معاً نبني سودان أفضل 🇸🇩</span>
          <span>👋 مرحباً بكم في Postatee - منصة سودانية لكل السودانيين حول العالم - معاً نبني سودان أفضل 🇸🇩</span>
          <span>👋 مرحباً بكم في Postatee - منصة سودانية لكل السودانيين حول العالم - معاً نبني سودان أفضل 🇸🇩</span>
        </div>
        {/* نفس المجموعة مكررة - ده البقفل الفراغ */}
        <div className="flex gap-5 shrink-0 pl-5" aria-hidden="true">
          <span>👋 مرحباً بكم في Postatee - منصة سودانية لكل السودانيين حول العالم - معاً نبني سودان أفضل 🇸🇩</span>
          <span>👋 مرحباً بكم في Postatee - منصة سودانية لكل السودانيين حول العالم - معاً نبني سودان أفضل 🇸🇩</span>
          <span>👋 مرحباً بكم في Postatee - منصة سودانية لكل السودانيين حول العالم - معاً نبني سودان أفضل 🇸🇩</span>
          <span>👋 مرحباً بكم في Postatee - منصة سودانية لكل السودانيين حول العالم - معاً نبني سودان أفضل 🇸🇩</span>
        </div>
      </div>
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(50%); }
          50% { transform: translateX(50%); }
        }
      .animate-marquee {
          animation: marquee 70s linear infinite;
        }
      `}</style>
    </div>
  )
}