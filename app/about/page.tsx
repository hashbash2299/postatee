export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12" dir="rtl">
      <h1 className="text-3xl font-bold text-blue-800 mb-6">من نحن - بوستاتي للوظائف</h1>
      
      <p className="text-gray-700 leading-8 mb-4">
        مرحباً بكم في <span className="font-bold">بوستاتي Postatee</span>،  المنصة الأولى للباحثين عن عمل في السودان والمملكة العربية السعوديةوعدد من الدول الاخرى.
      </p>
      <p className="text-gray-700 leading-8 mb-6">
        انطلقت فكرة بوستاتي في عام 2026 بهدف التواصل الاجتماعي وحل مشكلة تشتت الوظائف. نحن نجمع لكم الفرص من مصادرها الرسمية والموثوقة في مكان واحد، بشكل يومي ومجاني 100%.
      </p>

      <h2 className="text-xl font-bold mt-8 mb-3">ماذا نقدم؟</h2>
      <ul className="space-y-2">
        <li className="bg-blue-50 p-3 rounded-lg">✅ تواصل اجتماعي ونشر يومي لأحدث الوظائف الحكومية والخاصة</li>
        <li className="bg-blue-50 p-3 rounded-lg">✅ وظائف للسودانيين في الخليج وخاصة السعودية</li>
        <li className="bg-blue-50 p-3 rounded-lg">✅ وظائف للخريجين وبدون خبرة</li>
        <li className="bg-blue-50 p-3 rounded-lg">✅ نصائح لكتابة السيرة الذاتية واجتياز المقابلات</li>
      </ul>

      <h2 className="text-xl font-bold mt-8 mb-3">رسالتنا</h2>
      <p className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
        نحن <strong>لسنا شركة توظيف</strong> ولا نتقاضى أي رسوم من الباحثين عن عمل. نحن منصةإجتماعية إعلامية وسيطة فقط.
      </p>
    </div>
  )
}