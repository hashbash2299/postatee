export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12 leading-8" dir="rtl">
      <h1 className="text-3xl font-bold text-blue-800 mb-2">سياسة الخصوصية</h1>
      <p className="text-sm text-gray-500 mb-8">آخر تحديث: 1 أكتوبر 2026</p>

      <p className="mb-6">في <strong>بوستاتي Postatee</strong> (postatee.com) نحن نحترم خصوصيتك. توضح هذه الصفحة كيف نجمع ونستخدم بياناتك.</p>

      <h2 className="text-xl font-bold mt-8 mb-3">1. المعلومات التي نجمعها</h2>
      <ul className="list-disc pr-6 space-y-2">
        <li>معلومات تقدمها انت طوعاً مثل اسمك وايميلك عند التواصل معنا عبر صفحة اتصل بنا.</li>
        <li>معلومات تلقائية مثل عنوان IP، نوع المتصفح، والصفحات التي تزورها، عبر Google Analytics.</li>
      </ul>

      <h2 className="text-xl font-bold mt-8 mb-3">2. ملفات تعريف الارتباط (Cookies)</h2>
      <p>نحن نستخدم الكوكيز لتحسين تجربتك. نستخدم كوكيز خاصة بطرف ثالث مثل Google AdSense لعرض اعلانات مناسبة لك. يمكنك تعطيل الكوكيز من اعدادات متصفحك.</p>

      <h2 className="text-xl font-bold mt-8 mb-3">3. Google AdSense</h2>
      <p className="bg-gray-50 p-4 rounded-lg border mb-4">
        نستخدم شركة Google كطرف ثالث لعرض الإعلانات. تستخدم Google ملف تعريف ارتباط يسمى DART لتقديم الإعلانات بناءً على زياراتك لمواقع أخرى. يمكنك إلغاء استخدام ملف DART من خلال زيارة سياسة خصوصية Google.
      </p>

      <h2 className="text-xl font-bold mt-8 mb-3">4. كيف نستخدم معلوماتك</h2>
      <ul className="list-disc pr-6 space-y-2">
        <li>لتحسين الموقع وتجربة المستخدم.</li>
        <li>للرد على استفساراتك.</li>
        <li>لارسال تنبيهات وظائف (اذا اشتركت).</li>
      </ul>

      <h2 className="text-xl font-bold mt-8 mb-3">5. حقوقك</h2>
      <p>يحق لك طلب حذف بياناتك أو تعديلها في أي وقت عبر مراسلتنا على: info@postatee.com</p>

      <h2 className="text-xl font-bold mt-8 mb-3">6. اتصل بنا</h2>
      <p>اذا كان لديك أي سؤال حول سياسة الخصوصية، تواصل معنا عبر <a href="/contact" className="text-blue-600 underline">صفحة اتصل بنا</a>.</p>
    </div>
  )
}