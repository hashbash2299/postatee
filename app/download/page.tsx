export default function DownloadPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
      <h1 className="text-3xl font-bold mb-4">تحميل تطبيق Postatee 📱</h1>
      <p className="text-gray-600 mb-8">آخر إصدار - آمن ومباشر من موقعنا الرسمي</p>
      
      <a 
        href="/downloads/postatee.apk"
        download
        className="bg-black text-white px-8 py-4 rounded-full text-lg font-bold hover:bg-gray-800 transition"
      >
        ⬇️ تحميل الآن - postatee.apk
      </a>

      <p className="mt-6 text-sm text-gray-500">
        الرابط المباشر: postatee.com/downloads/postatee.apk
      </p>
    </div>
  )
}