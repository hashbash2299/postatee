"use client"
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { db, auth } from "@/lib/firebase";
import { doc, onSnapshot, setDoc, deleteDoc, serverTimestamp, collection, query, where, getDocs } from "firebase/firestore";
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

  useEffect(()=>{
    if(!targetUid) return;
    return onSnapshot(doc(db,"users",targetUid), s=> setProfile(s.data()));
  },[targetUid]);

  // عدد الأصدقاء والمشاركات
  useEffect(()=>{
    if(!targetUid) return;
    const fetchStats = async()=>{
      // أصدقاء
      const q1 = query(collection(db,"friendRequests"), where("status","==","accepted"));
      const snap1 = await getDocs(q1);
      let count=0;
      snap1.forEach(d=>{
        const data=d.data() as any;
        if(data.from===targetUid || data.to===targetUid) count++;
      });
      // منشورات
      const q2 = query(collection(db,"posts"), where("uid","==",targetUid));
      const snap2 = await getDocs(q2);
      const allPosts:any[]=[];
      let photos=0, videos=0;
      snap2.forEach(d=>{
        const p=d.data();
        allPosts.push({id:d.id,...p});
        if(p.type==="photo" || p.image) photos++;
        if(p.type==="video" || p.video) videos++;
      });
      setStats({friends:count, posts:allPosts.length, photos, videos});
      setPosts(allPosts);
    };
    fetchStats();
  },[targetUid]);

  useEffect(()=>{
    if(!myUid ||!targetUid || myUid===targetUid) return;
    const id1 = `${myUid}_${targetUid}`;
    const id2 = `${targetUid}_${myUid}`;
    const unsub1 = onSnapshot(doc(db,"friendRequests",id1), s=>{
      if(s.exists()){
        const d=s.data() as any;
        if(d.status==="accepted") setFriendStatus("accepted");
        else setFriendStatus("pending_sent");
      } else {
        // لو اتمسح
        setFriendStatus(prev=> prev==="pending_received"? prev : "none");
      }
    });
    const unsub2 = onSnapshot(doc(db,"friendRequests",id2), s=>{
      if(s.exists() && s.data().status==="pending"){
        setFriendStatus("pending_received");
      } else if(s.exists() && s.data().status==="accepted"){
        setFriendStatus("accepted");
      }
    });
    return ()=>{unsub1(); unsub2();};
  },[myUid, targetUid]);

  const handleAdd = async()=>{
    if(!myUid) return;
    await setDoc(doc(db,"friendRequests",`${myUid}_${targetUid}`),{
      from:myUid, to:targetUid, status:"pending", createdAt:serverTimestamp()
    });
    setFriendStatus("pending_sent");
  };

  const isOther = myUid && targetUid && myUid!== targetUid;

  if(!profile) return <div className="min-h-screen bg-black text-white p-10 flex items-center justify-center">جاري تحميل البروفايل...</div>;

  const filteredPosts = posts.filter(p=>{
    if(filter==="all") return true;
    if(filter==="photo") return p.type==="photo" || p.image;
    if(filter==="video") return p.type==="video" || p.video;
    if(filter==="text") return!p.image &&!p.video;
    return true;
  });

  return (
    <div dir="rtl" className="min-h-screen bg-[#050a0a] text-white">
      {/* غلاف */}
      <div className="relative h-[180px] w-full bg-zinc-900">
        {profile.cover && <img src={profile.cover} className="w-full h-full object-cover"/>}
        <div className="absolute -bottom-12 right-6 w-24 h-24 rounded-full border-4 border-[#050a0a] overflow-hidden bg-zinc-800">
          <img src={profile.avatar || profile.photoURL} className="w-full h-full object-cover"/>
        </div>
      </div>

      <div className="p-6 pt-16">
        <h1 className="text-2xl font-black">{profile.displayName}</h1>
        <p className="text-white/50 text-sm">@{profile.username} • {profile.role}</p>

        {/* الإحصائيات */}
        <div className="grid grid-cols-4 gap-2 mt-6">
          <div className="bg-white/5 rounded-2xl p-3 text-center border border-white/5">
            <p className="font-black text-lg">{stats.friends}</p>
            <p className="text-[11px] text-white/40">أصدقاء</p>
          </div>
          <div className="bg-white/5 rounded-2xl p-3 text-center border border-white/5">
            <p className="font-black text-lg">{stats.posts}</p>
            <p className="text-[11px] text-white/40">منشورات</p>
          </div>
          <div className="bg-white/5 rounded-2xl p-3 text-center border border-white/5">
            <p className="font-black text-lg">{stats.photos}</p>
            <p className="text-[11px] text-white/40">صور</p>
          </div>
          <div className="bg-white/5 rounded-2xl p-3 text-center border border-white/5">
            <p className="font-black text-lg">{stats.videos}</p>
            <p className="text-[11px] text-white/40">فيديو</p>
          </div>
        </div>

        {/* الزرين - دايما سوا */}
        {isOther && (
          <div className="grid grid-cols-2 gap-3 w-full mt-6">
            {friendStatus==="none" && (
              <button onClick={handleAdd} className="h-[52px] rounded-full bg-white text-black font-black text-[15px]">إضافة صديق</button>
            )}
            {friendStatus==="pending_sent" && (
              <button className="h-[52px] rounded-full bg-white/15 text-white font-black text-[15px]" disabled>تم الإرسال</button>
            )}
            {friendStatus==="accepted" && (
              <button onClick={()=>router.push(`/chat/${targetUid}`)} className="h-[52px] rounded-full bg-white text-black font-black text-[15px]">مراسلة</button>
            )}
            {friendStatus==="pending_received" && (
              <button onClick={()=>router.push(`/chat/${targetUid}`)} className="h-[52px] rounded-full bg-yellow-400 text-black font-black text-[15px]">قبول الطلب</button>
            )}
            <button onClick={()=>router.push(`/chat/request/${targetUid}`)} className="h-[52px] rounded-full border-2 border-[#00E5FF] text-[#00E5FF] font-black text-[15px]">طلب مراسلة</button>
          </div>
        )}

        {/* تبات حسب النوع */}
        <div className="flex gap-2 mt-8 overflow-x-auto">
          {[
            {k:"all", l:`الكل ${stats.posts}`},
            {k:"photo", l:`صور ${stats.photos}`},
            {k:"video", l:`فيديو ${stats.videos}`},
            {k:"text", l:"نصوص"},
          ].map((t:any)=>(
            <button key={t.k} onClick={()=>setFilter(t.k)} className={`px-5 h-9 rounded-full text-sm font-bold whitespace-nowrap border ${filter===t.k?'bg-white text-black border-white':'bg-white/5 text-white/60 border-white/10'}`}>{t.l}</button>
          ))}
        </div>

        {/* المنشورات */}
        <div className="mt-6 space-y-3">
          {filteredPosts.length===0 && <p className="text-center text-white/30 py-10">ما في منشورات من النوع ده</p>}
          {filteredPosts.map(p=>(
            <div key={p.id} className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <p className="text-sm text-white/80">{p.text || p.caption || "منشور بدون نص"}</p>
              {p.image && <img src={p.image} className="mt-3 rounded-xl w-full"/>}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}