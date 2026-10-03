import Link from "next/link";
export default function GamesHub() {
  return (
    <div className="min-h-screen bg-[#0B1418] p-4 max-w-[480px] mx-auto" dir="rtl">
      <div className="flex items-center gap-2 mb-5 mt-2">
        <Link href="/" className="text-white/60 text-sm bg-[#122025] px-3 py-1 rounded-full">← الرئيسية</Link>
        <h1 className="text-white font-black text-xl">🎮 العاب بوستاتي</h1>
      </div>

      <Link href="/games/tower" className="block bg-gradient-to-b from-[#87CEEB] to-[#2196F3] border-2 border-white/20 rounded-[24px] p-5 h-[190px] relative overflow-hidden">
        <p className="text-5xl">🏗️</p>
        <p className="text-white font-black text-[18px] mt-3">برج بوستاتي</p>
        <p className="text-white/80 text-[12px] mt-1">ابني أعلى برج - كل طوبة بتطلعك لفوق</p>
        <span className="absolute bottom-4 left-4 bg-black text-white text-[11px] px-4 py-1.5 rounded-full font-black">العب الآن ▶</span>
      </Link>
    </div>
  );
}