"use client"
import { useState, useEffect } from "react";
import { db, auth } from "../lib/firebase";
import { collection, query, where, getDocs, updateDoc, doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";

export default function AdminPage(){
  const [users,setUsers]=useState<any[]>([]);
  const [search,setSearch]=useState("");
  const [me,setMe]=useState<any>(null);
  const router=useRouter();

  useEffect(()=>{
    onAuthStateChanged(auth, async(u)=>{
      if(!u){router.push('/login');return;}
      const snap=await getDoc(doc(db,'users',u.uid));
      const data=snap.data();
      if(data?.username !== 'postatee'){ alert("ماعندك صلاحية"); router.push('/'); return; }
      setMe(data);
    });
  },[]);

  const searchUser = async()=>{
    const q=query(collection(db,'users'), where('username','>=',search), where('username','<=',search+'\uf8ff'));
    const snap=await getDocs(q);
    setUsers(snap.docs.map(d=>({id:d.id,...d.data()})));
  };

  const giveRole = async(uid:string, role:string)=>{
    await updateDoc(doc(db,'users',uid),{role: role});
    alert(`تم منح ${role} بنجاح ✓`);
    searchUser();
  };

  if(!me) return <div className="min-h-screen bg-[#050a0a] text-cyan-400 flex items-center justify-center">فحص الصلاحيات...</div>;

  return (
    <div className="min-h-screen bg-[#050a0a] text-white p-4" dir="rtl">
      <h1 className="text-xl font-black mb-4">لوحة المالك - منح الرتب 👑</h1>
      <div className="flex gap-2 mb-4">
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="اكتب اليوزرنيم" className="bg-white/5 border border-white/10 rounded-full px-4 py-2 flex-1"/>
        <button onClick={searchUser} className="bg-cyan-400 text-black font-black px-6 rounded-full">بحث</button>
      </div>
      {users.map(u=>(
        <div key={u.id} className="bg-white/[0.04] border border-white/10 rounded-xl p-3 mb-2 flex justify-between items-center">
          <div className="flex gap-3 items-center"><img src={u.avatar} className="w-10 h-10 rounded-full"/><div><p className="font-bold">{u.displayName}</p><p className="text-xs text-white/40">@{u.username} - {u.role||'عادي'}</p></div></div>
          <div className="flex gap-2">
            <button onClick={()=>giveRole(u.id,'مؤسس')} className="bg-cyan-400 text-black text-xs px-3 py-1 rounded-full font-bold">مؤسس - أزرق</button>
            <button onClick={()=>giveRole(u.id,'شخصية هامة')} className="bg-red-500 text-white text-xs px-3 py-1 rounded-full font-bold">هامة - أحمر</button>
            <button onClick={()=>giveRole(u.id,'شارة خضراء')} className="bg-green-500 text-black text-xs px-3 py-1 rounded-full font-bold">خضراء</button>
            <button onClick={()=>giveRole(u.id,'')} className="bg-white/10 text-xs px-3 py-1 rounded-full">إزالة</button>
          </div>
        </div>
      ))}
    </div>
  );
}