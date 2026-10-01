"use client";
import { useState } from "react";

export default function ContactPage() {
  const [sent, setSent] = useState(false);
  
  return (
    <div className="max-w-3xl mx-auto px-4 py-12" dir="rtl">
      <h1 className="text-3xl font-bold text-blue-800 mb-6">اتصل بنا</h1>
      <p className="text-gray-600 mb-8">اذا عندك استفسار، وظيفة عايز تنشرها، او مشكلة في الموقع، راسلنا و حنرد خلال 24 ساعة.</p>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="font-bold">📧 البريد الالكتروني</h3>
          <p>info@postatee.com</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="font-bold">📍 العنوان</h3>
          <p>الخرطوم - السودان / الدمام - السعودية</p>
        </div>
      </div>

      {sent ? (
        <div className="bg-green-100 border border-green-300 text-green-800 p-6 rounded-lg text-center">
          <h2 className="text-xl font-bold">✅ تم ارسال رسالتك بنجاح!</h2>
          <p>شكراً لتواصلك، سنرد عليك قريباً.</p>
        </div>
      ) : (
        <form onSubmit={(e)=>{e.preventDefault(); setSent(true)}} className="space-y-4 bg-white p-6 border rounded-xl shadow-sm">
          <div>
            <label className="block font-bold mb-1">الاسم الكامل</label>
            <input required type="text" className="w-full border p-3 rounded-lg" placeholder="مثال: محمد أحمد" />
          </div>
          <div>
            <label className="block font-bold mb-1">البريد الالكتروني</label>
            <input required type="email" className="w-full border p-3 rounded-lg" placeholder="your@email.com" />
          </div>
          <div>
            <label className="block font-bold mb-1">الرسالة</label>
            <textarea required rows={5} className="w-full border p-3 rounded-lg" placeholder="اكتب رسالتك هنا..."></textarea>
          </div>
          <button type="submit" className="w-full bg-blue-700 text-white py-3 rounded-lg font-bold hover:bg-blue-800">
            ارسال الرسالة
          </button>
        </form>
      )}
    </div>
  )
}