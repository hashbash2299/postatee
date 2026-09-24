"use client"
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { db, auth } from "@/lib/firebase";
import { doc, onSnapshot, setDoc, serverTimestamp, collection, query, where, getDocs } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

export default function ProfilePage(){
  const { uid: targetUid } = useParams() as {uid:string};
  const router = useRouter();
  const [myUid, setMyUid] = useState<string|null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [friendStatus, setFriendStatus] = useState<"none"|"pending_sent"|"pending_received"|"accepted">("none");
  const [stats, setStats] = useState({ friends:0, posts:0, photos:0, videos:0 });
  const [posts, setPosts] = useState<any[]>([]);
  const [filter, setFilter] = useState<"all"|"photo"|"video"|"text">("all");

  useEffect(()=> onAuthStateChanged(auth, u=> setMyUid(u?.uid||null)),[]);
  useEffect(()=>{ if(!targetUid) return; return onSnapshot(doc(db,"users",targetUid), s=> setProfile(s.data())); },[targetUid]);

  useEffect(()=>{
    if(!targetUid) return;
    const fetchStats = async()=>{
      const q1 = query(collection(db,"friendRequests"), where("status","==","accepted"));
      const snap1 = await getDocs(q1);
      let count=0; snap1.forEach(d=>{ const data=d.data() as any; if(data.from===targetUid || data.to===targetUid) count++; });
      const q2 = query(collection(db,"posts"), where("uid","==",targetUid));
      const snap2 = await getDocs(q2);
      const allPosts:any[]=[]; let photos=0, videos=0;
      snap2.forEach(d=>{ const p=d.data(); allPosts.push({id:d.id,...p}); if(p.type==="photo"||p.image) photos++; if(p.type==="video"||p.video) videos++; });
      setStats({friends:count, posts:allPosts.length, photos, videos}); setPosts(allPosts);
    }; fetchStats();
  },[targetUid]);

  useEffect(()=>{
    if(!myUid ||!targetUid || myUid===targetUid) return;
    const id1 = `${myUid}_${targetUid}`; const id2 = `${targetUid}_${myUid}`;
    const unsub1 = onSnapshot(doc(db,"friendRequests",id1), s=>{
      if(s.exists()){ const d=s.data() as any; setFriendStatus(d.status==="accepted"?"accepted":"pending_sent"); }
    });
    const unsub2 = onSnapshot(doc(db,"friendRequests",id2), s=>{
      if(s.exists()){ const d=s.data() as any; if(d.status==="pending") setFriendStatus("pending_received"); if(d.status==="accepted") setFriendStatus("accepted"); }
    });
    return ()=>{unsub1(); unsub2();};
  },[myUid, targetUid]);

  const handleAdd = async()=>{ if(!myUid) return; await setDoc(doc(db,"friendRequests",`${myUid}_${targetUid}`),{ from:myUid, to:targetUid, status:"pending", createdAt:serverTimestamp() }); setFriendStatus("pending_sent"); };

  if(!profile) return <div className="min-h-screen bg-[#0a0e0e] flex items-center justify-center text-white/50 text-sm">جاري التحميل...</div>;
  const isOther = myUid && targetUid && myUid!==targetUid;
  const filtered = posts.filter(p=>{ if(filter==="all") return true; if(filter==="photo") return p.image; if(filter==="video") return p.video; if(filter==="text") return!p.image&&!p.video; return true; });

  return (
    <div dir="rtl" className="min-h-screen bg-[#0a0e0e] text-white">
      <div className="w-full max-w-[720px] mx-auto">

        {/* الغلاف */}
        <div className="relative h-[220px] md:h-[280px] w-full overflow-hidden">
          <img src={profile.cover || "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1200"} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0e0e] via-[#0a0e0e]/20 to-transparent" />
        </div>

        {/* المعلومات */}
        <div className="px-5 -mt-14 relative z-10">
          <div className="flex items-end gap-4">
            <img src={profile.avatar || profile.photoURL} className="w-[88px] h-[88px] rounded-full border-[4px] border-[#0a0e0e] bg-zinc-800 object-cover shadow-xl" />
            <div className="pb-2">
              <h1 className="text-[20px] font-black leading-none">{profile.displayName || "Hashem Abbas"}</h1>
              <p className="text-[13px] text-white/40 mt-1">@{profile.username} • {profile.role || "مستخدم"}</p>
            </div>
          </div>

          {/* الإحصائيات - تصميم مرتب */}
          <div className="flex items-center justify-between mt-6 bg-white/[0.03] border border-white/[0.06] rounded-[20px] px-2 py-3">
            <div className="flex-1 text-center"><p className="font-black text-[18px]">{stats.friends}</p><p className="text-[11px] text-white/35">صديق</p></div>
            <div className="w-px h-8 bg-white/10" />
            <div className="flex-1 text-center"><p className="font-black text-[18px]">{stats.posts}</p><p className="text-[11px] text-white/35">منشور</p></div>
            <div className="w-px h-8 bg-white/10" />
            <div className="flex-1 text-center"><p className="font-black text-[18px]">{stats.photos}</p><p className="text-[11px] text-white/35">صور</p></div>
            <div className="w-px h-8 bg-white/10" />
            <div className="flex-1 text-center"><p className="font-black text-[18px]">{stats.videos}</p><p className="text-[11px] text-white/35">فيديو</p></div>
          </div>

          {/* الزرين - مقاس منطقي */}
          {isOther && (
            <div className="flex gap-2.5 mt-5">
              {friendStatus==="none" && <button onClick={handleAdd} className="flex-1 max-w-[180px] h-10 rounded-full bg-white text-black font-bold text-[13px] hover:bg-zinc-100 transition">إضافة صديق</button>}
              {friendStatus==="pending_sent" && <button disabled className="flex-1 max-w-[180px] h-10 rounded-full bg-white/10 text-white/60 font-bold text-[13px]">تم الإرسال</button>}
              {friendStatus==="accepted" && <button onClick={()=>router.push(`/chat/${targetUid}`)} className="flex-1 max-w-[180px] h-10 rounded-full bg-white text-black font-bold text-[13px]">مراسلة</button>}
              {friendStatus==="pending_received" && <button className="flex-1 max-w-[180px] h-10 rounded-full bg-[#ffec8b] text-black font-bold text-[13px]">قبول الطلب</button>}

              <button onClick={()=>router.push(`/chat/request/${targetUid}`)} className="flex-1 max-w-[180px] h-10 rounded-full bg-transparent border border-cyan-400/70 text-cyan-300 font-bold text-[13px] hover:bg-cyan-400/10 transition">طلب مراسلة</button>
            </div>
          )}

          {/* فلاتر */}
          <div className="flex gap-2 mt-6">
            {[{k:"all",l:"الكل"},{k:"photo",l:`صور ${stats.photos}`},{k:"video",l:`فيديو ${stats.videos}`},{k:"text",l:"نصوص"}].map((t:any)=>(
              <button key={t.k} onClick={()=>setFilter(t.k)} className={`h-8 px-4 rounded-full text-[12px] font-bold border transition ${filter===t.k?'bg-white text-black border-white':'bg-white/5 text-white/50 border-white/10 hover:bg-white/10'}`}>{t.l}</button>
            ))}
          </div>

          <div className="mt-6 pb-20 space-y-3">
            {filtered.length===0 && <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-10 text-center text-white/25 text-sm">ما في منشورات</div>}
            {filtered.map(p=>(
              <div key={p.id} className="bg-white/[0.04] border border-white/[0.06] rounded-[18px] p-4">
                <p className="text-[14px] leading-6 text-white/80">{p.text || p.caption}</p>
                {p.image && <img src={p.image} className="mt-3 rounded-xl w-full max-h-[400px] object-cover" />}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}