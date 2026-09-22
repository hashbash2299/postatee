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
  const [loadingId,setLoadingId]=useState<string|null>(null);
  const router=useRouter();

  useEffect(()=>{
    onAuthStateChanged(auth, async(u)=>{
      if(!u){router.push('/login');return;}
      const snap=await getDoc(doc(db,'users',u.uid));
      const data=snap.data();
      if(data?.username!== 'postatee'){ alert("ماعندك صلاحية"); router.push('/'); return; }
      setMe(data);
    });
  },[]);

  const searchUser = async()=>{
    if(!search.trim()) return;
    const q=query(collection(db,'users'), where('username','>=',search.trim()), where('username','<=',search.trim()+'\uf8ff'));
    const snap=await getDocs(q);
    setUsers(snap.docs.map(d=>({id:d.id,...d.data()})));
  };

  const giveRole = async(uid:string, role:string)=>{
    setLoadingId(uid);
    try {
      // 1. عدل الرتبة في users
      await updateDoc(doc(db,'users',uid),{role: role});

      // 2. صلح كل بوستاتو القديمة
      const postsRef = collection(db,'posts');
      const q1 = await getDocs(query(postsRef, where('uid','==',uid)));
      const q2 = await getDocs(query(postsRef, where('authorId','==',uid)));
      const allPostDocs = [...q1.docs,...q2.docs];
      const uniquePostIds = Array.from(new Set(allPostDocs.map(d=>d.id)));

      for(const postId of uniquePostIds){
        await updateDoc(doc(db,'posts',postId),{ authorRole: role });
      }

      // 3. صلح كل تعليقاتو القديمة
      const allPostsSnap = await getDocs(collection(db,'posts'));
      for(const postDoc of allPostsSnap.docs){
        const c1 = await getDocs(query(collection(db,'posts',postDoc.id,'comments'), where('uid','==',uid)));
        const c2 = await getDocs(query(collection(db,'posts',postDoc.id,'comments'), where('authorId','==',uid)));
        const allComments = [...c1.docs,...c2.docs];
        for(const com of allComments){
          await updateDoc(doc(db,'posts',postDoc.id,'comments',com.id),{ authorRole: role });
        }
      }

      alert(`تم منح ${role || 'عادي'} بنجاح وتحديث ${uniquePostIds.length} بوست وكل تعليقاتو ✓`);
      searchUser();
    } catch(e:any){
      alert("خطأ: "+e.message);
    } finally {
      setLoadingId(null);
    }
  };

  if(!me) return <div className="min-h-screen bg-[#050a0a] text-cyan-400 flex items-center justify-center">فحص الصلاحيات...</div>;

  const getRoleBadge = (role:string) => {
    if(role==='مالك') return <span className="bg-violet-500 text-white text-[10px] px-2 py-0.5 rounded-full font-black">المالك 👑</span>
    if(role==='مؤسس') return <span className="bg-cyan-400 text-black text-[10px] px-2 py-0.5 rounded-full font-bold">مؤسس</span>
    if(role==='شخصية هامة') return <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">هامة</span>
    if(role==='شارة خضراء') return <span className="bg-green-500 text-black text-[10px] px-2 py-0.5 rounded-full font-bold">موثق</span>
    return <span className="bg-white/10 text-white/40 text-[10px] px-2 py-0.5 rounded-full">عادي</span>
  }

  return (
    <div className="min-h-screen bg-[#050a0a] text-white p-4" dir="rtl">
      <div className="max-w-[700px] mx-auto">
        <h1 className="text-xl font-black mb-1 flex items-center gap-2">لوحة المالك - منح الرتب 👑</h1>
        <p className="text-xs text-white/40 mb-4">انت الوحيد بتقدر تدي رتبة المالك (بنفسجي)</p>

        <div className="flex gap-2 mb-6">
          <input value={search} onChange={e=>setSearch(e.target.value)} onKeyDown={e=>e.key==='Enter' && searchUser()} placeholder="اكتب اليوزرنيم مثلا: ahmed" className="bg-white/5 border border-white/10 rounded-full px-4 py-2.5 flex-1 outline-none focus:border-violet-500/50"/>
          <button onClick={searchUser} className="bg-violet-500 text-white font-black px-6 rounded-full hover:bg-violet-600">بحث</button>
        </div>

        {users.length===0 && <p className="text-center text-white/20 text-sm py-10">ابحث عن مستخدم</p>}

        {users.map(u=>(
          <div key={u.id} className="bg-white/[0.04] border border-white/10 rounded-xl p-3 mb-2 flex justify-between items-center gap-3">
            <div className="flex gap-3 items-center flex-1">
              <img src={u.avatar || `https://i.pravatar.cc/100?u=${u.id}`} className="w-10 h-10 rounded-full"/>
              <div className="flex-1">
                <p className="font-bold text-sm flex items-center gap-2">{u.displayName} {getRoleBadge(u.role)}</p>
                <p className="text-xs text-white/40">@{u.username}</p>
              </div>
            </div>
            <div className="flex gap-1.5 flex-wrap justify-end max-w-[260px]">
              {/* المالك - بنفسجي - أهم واحد */}
              <button disabled={loadingId===u.id} onClick={()=>giveRole(u.id,'مالك')} className="bg-gradient-to-r from-violet-500 to-purple-600 text-white text-[11px] px-3.5 py-1.5 rounded-full font-black disabled:opacity-30 shadow-[0_0_10px_rgba(139,92,246,0.4)]">
                {loadingId===u.id?'جاري...':'المالك - بنفسجي'}
              </button>
              <button disabled={loadingId===u.id} onClick={()=>giveRole(u.id,'مؤسس')} className="bg-cyan-400 text-black text-[11px] px-3 py-1.5 rounded-full font-bold disabled:opacity-30">مؤسس - أزرق</button>
              <button disabled={loadingId===u.id} onClick={()=>giveRole(u.id,'شخصية هامة')} className="bg-red-500 text-white text-[11px] px-3 py-1.5 rounded-full font-bold disabled:opacity-30">هامة - أحمر</button>
              <button disabled={loadingId===u.id} onClick={()=>giveRole(u.id,'شارة خضراء')} className="bg-green-500 text-black text-[11px] px-3 py-1.5 rounded-full font-bold disabled:opacity-30">موثق - أخضر</button>
              <button disabled={loadingId===u.id} onClick={()=>giveRole(u.id,'')} className="bg-white/10 text-[11px] px-3 py-1.5 rounded-full disabled:opacity-30">إزالة</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}