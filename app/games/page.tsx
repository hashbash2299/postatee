import Link from "next/link";

export default function GamesHub() {
  return (
    <div className="min-h-screen bg-[#0B1418] p-4 max-w-[480px] mx-auto" dir="rtl">
      <div className="flex items-center gap-2 mb-5 mt-2">
        <Link href="/" className="text-white/60 text-sm bg-[#122025] px-3 py-1 rounded-full">← الرئيسية</Link>
        <h1 className="text-white font-black text-xl">🎮 العاب بوستاتي</h1>
      </div>

      <div className="flex flex-col gap-4">
        {/* لعبة بوستي كراش - الجديدة */}
        <Link href="/games/bosti-crush" className="block bg-gradient-to-br from-[#FF8E53] via-[#FE6B8B] to-[#A66CFF] border-2 border-white/30 rounded-[24px] p-5 h-[190px] relative overflow-hidden shadow-[0_8px_30px_rgba(254,107,139,0.4)] group">
          {/* لمعة كاندي */}
          <div className="absolute top-0 left-0 w-full h-[60%] bg-gradient-to-b from-white/30 to-transparent pointer-events-none"></div>
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/20 rounded-full blur-2xl group-hover:scale-150 transition-all duration-700"></div>

          <div className="flex justify-between items-start relative z-10">
            <p className="text-5xl drop-shadow-[0_3px_0_rgba(0,0,0,0.3)]">🪔</p>
            <span className="bg-yellow-300 text-black text-[10px] px-3 py-1 rounded-full font-black animate-pulse">جديد 🔥</span>
          </div>
          <p className="text-white font-black text-[20px] mt-3 drop-shadow-md">بوستي كراش</p>
          <p className="text-white/90 text-[12px] mt-1 font-bold">جوطها ولم الجبنة والسبحة والدلوكة!</p>
          <div className="flex gap-1 mt-2">
            <span className="text-[10px] bg-black/30 text-white px-2 py-0.5 rounded-full">عجيييب</span>
            <span className="text-[10px] bg-black/30 text-white px-2 py-0.5 rounded-full">معللم</span>
            <span className="text-[10px] bg-black/30 text-white px-2 py-0.5 rounded-full">زول خطر</span>
          </div>
          <span className="absolute bottom-4 left-4 bg-black text-white text-[11px] px-5 py-2 rounded-full font-black shadow-lg group-active:scale-95 transition">العب الآن ▶</span>
        </Link>

        {/* لعبة البرج - القديمة */}
        <Link href="/games/tower" className="block bg-gradient-to-b from-[#87CEEB] to-[#2196F3] border-2 border-white/20 rounded-[24px] p-5 h-[190px] relative overflow-hidden">
          <p className="text-5xl">🏗️</p>
          <p className="text-white font-black text-[18px] mt-3">برج بوستاتي</p>
          <p className="text-white/80 text-[12px] mt-1">ابني أعلى برج - كل طوبة بتطلعك لفوق</p>
          <span className="absolute bottom-4 left-4 bg-black text-white text-[11px] px-4 py-1.5 rounded-full font-black">العب الآن ▶</span>
        </Link>
      </div>
    </div>
  );
}