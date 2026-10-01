"use client";
import { useState } from "react";

export default function ContactPage() {
  const [sent, setSent] = useState(false);
  
  return (
    <div className="max-w-3xl mx-auto px-4 py-12" dir="rtl">
      <h1 className="text-3xl font-bold text-white mb-6">اتصل بنا</h1>
      <p className="text-gray-400 mb-8">اذا عندك استفسار، اقتراح، او مشكلة في منصة بوستاتي للتواصل الاجتماعي، راسلنا و حنرد خلال 24 ساعة.</p>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="bg-[#132028] border border-white/10 p-4 rounded-lg">
          <h3 className="font-bold text-white">📧 البريد الالكتروني</h3>
          <p className="text-gray-300 mt-1">info@postatee.com</p>
        </div>
        <div className="bg-[#132028] border border-white/10 p-4 rounded-lg">
          <h3 className="font-bold text-white">📍 العنوان</h3>
          <p className="text-gray-300 mt-1">الخرطوم - السودان / الدمام - السعودية</p>
        </div>
      </div>

      {sent ? (
        <div className="bg-green-900/30 border border-green-500/30 text-green-300 p-6 rounded-lg text-center">
          <h2 className="text-xl font-bold">✅ تم ارسال رسالتك بنجاح!</h2>
          <p>شكراً لتواصلك، سنرد عليك قريباً.</p>
        </div>
      ) : (
        <form onSubmit={(e)=>{e.preventDefault(); setSent(true)}} className="space-y-4 bg-[#132028] border border-white/10 p-6 rounded-xl shadow-sm">
          <div>
            <label className="block font-bold mb-1 text-white">الاسم الكامل</label>
            <input required type="text" className="w-full border border-white/10 bg-[#0B1418] text-white p-3 rounded-lg placeholder:text-gray-500" placeholder="مثال: محمد أحمد" />
          </div>
          <div>
            <label className="block font-bold mb-1 text-white">البريد الالكتروني</label>
            <input required type="email" className="w-full border border-white/10 bg-[#0B1418] text-white p-3 rounded-lg placeholder:text-gray-500" placeholder="your@email.com" />
          </div>
          <div>
            <label className="block font-bold mb-1 text-white">الرسالة</label>
            <textarea required rows={5} className="w-full border border-white/10 bg-[#0B1418] text-white p-3 rounded-lg placeholder:text-gray-500" placeholder="اكتب رسالتك هنا..."></textarea>
          </div>
          <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700">
            ارسال الرسالة
          </button>
        </form>
      )}
    </div>
  )
}