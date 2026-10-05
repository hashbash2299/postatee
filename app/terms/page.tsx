export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12 leading-8" dir="rtl">
      <h1 className="text-3xl font-bold text-white mb-6">شروط الاستخدام</h1>

      <h2 className="text-xl font-bold mt-6 mb-3 text-white">1. القبول بالشروط</h2>
      <p className="text-gray-300">باستخدامك لموقع بوستاتي postatee.com فأنت توافق على هذه الشروط.</p>

      <h2 className="text-xl font-bold mt-6 mb-3 text-white">2. طبيعة عملنا</h2>
      <p className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg text-gray-900">
        بوستاتي هو موقع <strong>تواصل اجتماعي</strong> سوداني. بوستاتي منصة تواصل اجتماعي، انت مسؤول عن ما تنشره. يمنع نشر محتوى مسيء، اباحي، أو يحرض على العنف. نحتفظ بحق حذف أي محتوى مخالف.
      </p>

      <h2 className="text-xl font-bold mt-6 mb-3 text-white">3. دقة المعلومات</h2>
      <p className="text-gray-300">نبذل قصارى جهدنا لتوفير منصة آمنة، لكنك مسؤول عن دقة ما تنشره من محتوى. يمنع انتحال الشخصيات ونشر معلومات مضللة.</p>

      <h2 className="text-xl font-bold mt-6 mb-3 text-white">4. الاستخدام المحظور</h2>
      <ul className="list-disc pr-6 space-y-2 text-gray-300">
        <li>يمنع نسخ محتوى الموقع ونشره بدون ذكر المصدر.</li>
        <li>يمنع استخدام الموقع لأي غرض غير قانوني.</li>
        <li>يمنع نشر خطاب كراهية أو محتوى اباحي.</li>
      </ul>

      <h2 className="text-xl font-bold mt-6 mb-3 text-white">5. الملكية الفكرية</h2>
      <p className="text-gray-300">جميع محتويات الموقع، الشعار، والتصميم هي ملك لموقع بوستاتي.</p>

      <p className="mt-8 text-sm text-gray-500">اذا كان لديك سؤال: info@postatee.com</p>
    </div>
  )
}