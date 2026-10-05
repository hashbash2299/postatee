export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12 leading-8" dir="rtl">
      <h1 className="text-3xl font-bold text-white mb-2">سياسة الخصوصية</h1>
      <p className="text-sm text-gray-400 mb-8">آخر تحديث: 1 أكتوبر 2026</p>

      <p className="mb-6 text-gray-300">في <strong className="text-white">بوستاتي Postatee</strong> (postatee.com) نحن نحترم خصوصيتك. توضح هذه الصفحة كيف نجمع ونستخدم بياناتك.</p>

      <h2 className="text-xl font-bold mt-8 mb-3 text-white">1. المعلومات التي نجمعها</h2>
      <ul className="list-disc pr-6 space-y-2 text-gray-300">
        <li>معلومات تقدمها انت طوعاً مثل اسمك وايميلك عند التسجيل أو التواصل معنا.</li>
        <li>معلومات تلقائية مثل عنوان IP، نوع المتصفح، والصفحات التي تزورها، عبر Google Analytics.</li>
        <li>نحن منصة تواصل اجتماعي، قد نجمع معلومات مثل اسمك، بريدك، وما تنشره من محتوى (بوستات، تعليقات، صور) لتحسين تجربتك.</li>
      </ul>

      <h2 className="text-xl font-bold mt-8 mb-3 text-white">2. ملفات تعريف الارتباط (Cookies)</h2>
      <p className="text-gray-300">نحن نستخدم الكوكيز لتحسين تجربتك. نستخدم كوكيز خاصة بطرف ثالث مثل Google AdSense لعرض اعلانات مناسبة لك. يمكنك تعطيل الكوكيز من اعدادات متصفحك.</p>

      <h2 className="text-xl font-bold mt-8 mb-3 text-white">3. Google AdSense</h2>
      <p className="bg-[#132028] border border-white/10 p-4 rounded-lg mb-4 text-gray-300">
        نستخدم شركة Google كطرف ثالث لعرض الإعلانات. تستخدم Google ملف تعريف ارتباط يسمى DART لتقديم الإعلانات بناءً على زياراتك لمواقع أخرى. يمكنك إلغاء استخدام ملف DART من خلال زيارة سياسة خصوصية Google.
      </p>

      <h2 className="text-xl font-bold mt-8 mb-3 text-white">4. كيف نستخدم معلوماتك</h2>
      <ul className="list-disc pr-6 space-y-2 text-gray-300">
        <li>لتحسين الموقع وتجربة المستخدم.</li>
        <li>للرد على استفساراتك.</li>
        <li>لعرض محتوى مناسب وتأمين حسابك من المحتوى المخالف.</li>
      </ul>

      <h2 className="text-xl font-bold mt-8 mb-3 text-white">5. حقوقك</h2>
      <p className="text-gray-300">يحق لك طلب حذف بياناتك أو تعديلها في أي وقت عبر مراسلتنا على: info@postatee.com</p>

      <h2 className="text-xl font-bold mt-8 mb-3 text-white">6. اتصل بنا</h2>
      <p className="text-gray-300">اذا كان لديك أي سؤال حول سياسة الخصوصية، تواصل معنا عبر <a href="/contact" className="text-blue-400 underline">صفحة اتصل بنا</a>.</p>
    </div>
  )
}