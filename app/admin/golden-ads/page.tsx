"use client"
import { useEffect, useState } from "react"
import { db } from "@/lib/firebase"
import { collection, addDoc, onSnapshot, deleteDoc, doc, updateDoc, serverTimestamp, orderBy, query } from "firebase/firestore"

export default function GoldenAdsAdmin(){
  const [ads,setAds]=useState<any[]>([])
  const [form,setForm]=useState({ brand:"", title:"", img:"", link:"#", color:"from-yellow-400 to-orange-500", order:1, active:true })

  useEffect(()=>{
    const q = query(collection(db,'golden_ads'), orderBy('order'))
    const unsub = onSnapshot(q, s=> setAds(s.docs.map(d=>({id:d.id,...d.data()}))))
    return ()=> unsub()
  },[])

  const handleAdd = async ()=>{
    if(!form.brand ||!form.img) return alert("اكتب اسم البراند ورابط الصورة")
    await addDoc(collection(db,'golden_ads'), {...form, created_at:serverTimestamp() })
    setForm({ brand:"", title:"", img:"", link:"#", color:"from-yellow-400 to-orange-500", order:ads.length+1, active:true })
  }

  return (
    <div className="min-h-screen bg-[#080e0e] p-6" dir="rtl">
      <h1 className="text-white text-[22px] font-bold mb-6">إدارة الشركاء الذهبيين 👑</h1>

      <div className="bg-[#122025] border border-white/10 rounded-[16px] p-4 max-w-[600px] mb-8">
        <h3 className="text-white font-bold mb-4">إضافة اعلان جديد</h3>
        <div className="space-y-3">
          <input value={form.brand} onChange={e=>setForm({...form,brand:e.target.value})} placeholder="اسم البراند - MTN Sudan" className="w-full bg-[#1E2D32] rounded-full px-4 py-3 text-white text-[14px] outline-none border border-white/10"/>
          <input value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="نص الاعلان - خصم 50%" className="w-full bg-[#1E2D32] rounded-full px-4 py-3 text-white text-[14px] outline-none border border-white/10"/>
          <input value={form.img} onChange={e=>setForm({...form,img:e.target.value})} placeholder="رابط الصورة (URL)" className="w-full bg-[#1E2D32] rounded-full px-4 py-3 text-white text-[14px] outline-none border border-white/10"/>
          <input value={form.link} onChange={e=>setForm({...form,link:e.target.value})} placeholder="رابط عند الضغط" className="w-full bg-[#1E2D32] rounded-full px-4 py-3 text-white text-[14px] outline-none border border-white/10"/>
          <select value={form.color} onChange={e=>setForm({...form,color:e.target.value})} className="w-full bg-[#1E2D32] rounded-full px-4 py-3 text-white text-[14px] outline-none border border-white/10">
            <option value="from-yellow-400 to-orange-500">ذهبي برتقالي</option>
            <option value="from-cyan-400 to-blue-500">سماوي ازرق</option>
            <option value="from-purple-400 to-pink-500">بنفسجي وردي</option>
            <option value="from-green-400 to-emerald-500">اخضر</option>
          </select>
          <button onClick={handleAdd} className="w-full bg-[#00E5FF] text-black rounded-full py-3 font-bold">إضافة الاعلان</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-[1000px]">
        {ads.map(ad=>(
          <div key={ad.id} className="bg-[#122025] border border-white/10 rounded-[16px] overflow-hidden">
            <img src={ad.img} className="w-full h-[180px] object-cover"/>
            <div className="p-3">
              <h4 className="text-white font-bold">{ad.brand}</h4>
              <p className="text-white/50 text-[12px]">{ad.title}</p>
              <div className="flex gap-2 mt-3">
                <button onClick={()=> updateDoc(doc(db,'golden_ads',ad.id),{active:!ad.active})} className={`flex-1 rounded-full py-2 text-[12px] font-bold ${ad.active?'bg-green-500/20 text-green-400':'bg-white/10 text-white/50'}`}>{ad.active?'نشط':'متوقف'}</button>
                <button onClick={()=> deleteDoc(doc(db,'golden_ads',ad.id))} className="flex-1 bg-red-500/20 text-red-400 rounded-full py-2 text-[12px] font-bold">حذف</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}