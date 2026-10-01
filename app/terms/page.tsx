export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12 leading-8" dir="rtl">
      <h1 className="text-3xl font-bold text-blue-800 mb-6">شروط الاستخدام</h1>

      <h2 className="text-xl font-bold mt-6 mb-3">1. القبول بالشروط</h2>
      <p>باستخدامك لموقع بوستاتي postatee.com فأنت توافق على هذه الشروط.</p>

      <h2 className="text-xl font-bold mt-6 mb-3">2. طبيعة عملنا</h2>
      <p className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
        بوستاتي هو موقع تواصل اجتماعي وسيط لنشر الوظائف فقط. نحن <strong>لسنا شركة توظيف</strong> ولا نضمن حصولك على وظيفة. نحن نجمع الوظائف من مصادرها الرسمية ولسنا مسؤولين عن أي عملية توظيف تتم بينك وبين جهة العمل.
      </p>

      <h2 className="text-xl font-bold mt-6 mb-3">3. دقة المعلومات</h2>
      <p>نبذل قصارى جهدنا لنشر وظائف حقيقية وموثوقة، لكننا لا نتحمل مسؤولية أي تغيير في تفاصيل الوظيفة من قبل الشركة المعلنة. يجب عليك دائماً التأكد من المصدر الرسمي.</p>

      <h2 className="text-xl font-bold mt-6 mb-3">4. الاستخدام المحظور</h2>
      <ul className="list-disc pr-6 space-y-2">
        <li>يمنع نسخ محتوى الموقع ونشره بدون ذكر المصدر.</li>
        <li>يمنع استخدام الموقع لأي غرض غير قانوني.</li>
      </ul>

      <h2 className="text-xl font-bold mt-6 mb-3">5. الملكية الفكرية</h2>
      <p>جميع محتويات الموقع، الشعار، والتصميم هي ملك لموقع بوستاتي.</p>

      <p className="mt-8 text-sm text-gray-500">اذا كان لديك سؤال: info@postatee.com</p>
    </div>
  )
}