export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12" dir="rtl">
      <h1 className="text-4xl font-bold text-white mb-3">من نحن - بوستاتي</h1>
      <p className="text-gray-400 mb-8">منصة سودانية للتواصل والمشاركة</p>

      <div className="bg-[#132028] border border-white/10 p-6 rounded-xl mb-6">
        <h2 className="text-2xl font-bold text-white mb-4">رسالتنا 🎯</h2>
        <p className="text-gray-300 leading-8">
          بوستاتي Postatee هي منصة تواصل اجتماعي سودانية، انشأناها عشان ندي مساحة حرة وآمنة للسودانيين 
          يشاركو أفكارهم، بوستاتهم، صورهم، ويتواصلو مع بعض بدون قيود المنصات الكبيرة.
          هدفنا نلم شمل المجتمع السوداني في مكان واحد، باللهجة السودانية وبطريقة قريبة مننا.
        </p>
      </div>

      <div className="bg-[#132028] border border-white/10 p-6 rounded-xl mb-6">
        <h2 className="text-2xl font-bold text-white mb-4">ماذا نقدم؟ 💬</h2>
        <ul className="list-disc pr-6 space-y-3 text-gray-300">
          <li>نشر بوستات نصية، صور وفيديوهات بسهولة.</li>
          <li>التفاعل باللايكات والتعليقات والمشاركة.</li>
          <li>متابعة الأصدقاء والمبدعين السودانيين.</li>
          <li>مجتمع آمن، نحترم الخصوصية ونرفض خطاب الكراهية.</li>
        </ul>
      </div>

      <div className="bg-[#132028] border border-white/10 p-6 rounded-xl">
        <h2 className="text-2xl font-bold text-white mb-4">لماذا بوستاتي؟ ⭐</h2>
        <p className="text-gray-300 leading-8">
          لأننا منكم ولكم. منصة سودانية 100%، مصممة لتناسب انترنتنا وثقافتنا.
          لا نبيع بياناتك، لا نزعجك بإعلانات كثيرة، هدفنا مجتمع نضيف ومحترم.
        </p>
      </div>
    </div>
  )
}