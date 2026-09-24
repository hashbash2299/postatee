"use client"
import { useState, useEffect } from "react";
import { auth, db } from "../../lib/firebase";
import { doc, getDoc, updateDoc, serverTimestamp, collection, query, where, getDocs } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import { Camera, Check, Circle, Crown, Gem, Star, Verified } from "lucide-react";

const defaultAvatars = [
  "https://i.pravatar.cc/200?img=8",
  "https://i.pravatar.cc/200?img=12",
  "https://i.pravatar.cc/200?img=15",
  "https://i.pravatar.cc/200?img=32",
  "https://i.pravatar.cc/200?img=33",
  "https://i.pravatar.cc/200?img=36",
  "https://i.pravatar.cc/200?img=59",
  "https://i.pravatar.cc/200?img=68",
];
const defaultCovers = [
  "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800",
  "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800",
  "https://images.unsplash.com/photo-1500534623283-312a57ea4d8d?w=800",
  "https://images.unsplash.com/photo-1531306728370-e2ebd9d7bb99?w=800",
  "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800",
];

const getNameColor = (role:string) => {
  if(role === "مؤسس") return "text-cyan-400";
  if(role === "شخصية هامة") return "text-red-400";
  if(role === "شارة خضراء") return "text-green-400";
  if(role === "مالك") return "text-cyan-300";
  return "text-white";
};
const RoleBadge = ({ role }: { role: string }) => {
  if (role === "مالك") return <span className="inline-flex items-center gap-1 bg-gradient-to-r from-cyan-400 to-teal-400 text-black text-[10px] font-black px-2 py-0.5 rounded-full"><Crown className="w-3 h-3"/> مالك</span>;
  if (role === "مؤسس") return <span className="inline-flex items-center gap-1 bg-cyan-500/20 border border-cyan-400/50 text-cyan-400 text-[10px] font-bold px-2 py-0.5 rounded-full"><Gem className="w-3 h-3"/> مؤسس</span>;
  if (role === "شخصية هامة") return <span className="inline-flex items-center gap-1 bg-red-500/20 border border-red-500/50 text-red-400 text-[10px] font-black px-2 py-0.5 rounded-full"><Star className="w-3 h-3 fill-red-400"/> هامة</span>;
  if (role === "شارة خضراء") return <span className="inline-flex items-center gap-1 bg-green-500/20 border border-green-500/40 text-green-400 text-[10px] font-bold px-2 py-0.5 rounded-full"><Verified className="w-3 h-3"/> موثق</span>;
  return null;
};

export default function SetupProfile() {
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [avatar, setAvatar] = useState(defaultAvatars[0]);
  const [cover, setCover] = useState(defaultCovers[0]);
  const [isOnline, setIsOnline] = useState(true);
  const [uid, setUid] = useState("");
  const [existingData, setExistingData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      try {
        if (!u) {
          router.push('/login');
          return;
        }
        setUid(u.uid);
        const snap = await getDoc(doc(db, 'users', u.uid));
        if (snap.exists()) {
          const data = snap.data();
          setExistingData(data);
          if(data.displayName) setDisplayName(data.displayName);
          if(data.username) setUsername(data.username);
          if(data.avatar) setAvatar(data.avatar);
          if(data.cover) setCover(data.cover);
        }
      } catch (err) {
        console.error("Error loading profile:", err);
      } finally {
        setLoading(false);
      }
    });
    return () => unsub();
  }, [router]);

  const handleSave = async () => {
    if (!displayName.trim() ||!username.trim()) return alert("اكمل البيانات");
    const usernameLower = username.toLowerCase().trim().replace(/\s+/g,'_').replace('@','');
    if (usernameLower.length < 3) return alert("اليوزرنيم قصير");

    setSaving(true);
    try {
      if(existingData?.usernameLower!== usernameLower){
        const q = query(collection(db, 'users'), where('usernameLower','==',usernameLower));
        const snap = await getDocs(q);
        if(!snap.empty){
          alert("اليوزرنيم محجوز");
          setSaving(false);
          return;
        }
      }
      await updateDoc(doc(db, 'users', uid), {
        displayName: displayName.trim(),
        username: usernameLower,
        usernameLower: usernameLower,
        avatar,
        cover,
        isOnline,
        lastSeen: serverTimestamp(),
        profileCompleted: true,
      });
      router.push('/');
    } catch(e:any){
      alert(e.message);
    } finally {
      setSaving(false);
    }
  };

  if(loading) {
    return (
      <div className="min-h-screen bg-[#050a0a] flex flex-col items-center justify-center text-white gap-3">
        <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm text-white/50">جاري التحميل...</p>
      </div>
    );
  }

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700;800;900&display=swap'); *{font-family:'Tajawal',sans-serif!important;}`}</style>
      <div className="min-h-screen bg-[#050a0a] p-4 flex justify-center" dir="rtl">
        <div className="w-full max-w-[600px]">
          <div className="relative h-[200px] rounded-[24px] overflow-hidden border border-white/10">
            <img src={cover} className="w-full h-full object-cover" alt="cover"/>
            <div className="absolute inset-0 bg-black/30"/>
            <div className="absolute bottom-4 left-4 right-4 flex items-end gap-4">
              <div className="relative">
                <img src={avatar} className="w-24 h-24 rounded-full border-4 border-[#050a0a] object-cover" alt="avatar"/>
                <span className={`absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 border-black ${isOnline? 'bg-green-400' : 'bg-gray-500'}`}></span>
              </div>
              <div className="pb-2">
                <div className="flex items-center gap-2">
                  <h2 className={`font-black text-xl ${getNameColor(existingData?.role || '')}`}>{displayName || "اسمك"}</h2>
                  {existingData?.role && <RoleBadge role={existingData.role}/>}
                </div>
                <p className="text-white/60 text-sm">@{username || "username"} • {isOnline? "متصل الآن" : "غير متصل"}</p>
              </div>
            </div>
          </div>

          <div className="mt-6 bg-white/[0.04] border border-white/10 rounded-[24px] p-6 space-y-6">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-white/5 rounded-2xl p-3"><p className="text-xl font-black text-white">0</p><p className="text-xs text-white/40">متابعون</p></div>
              <div className="bg-white/5 rounded-2xl p-3"><p className="text-xl font-black text-white">0</p><p className="text-xs text-white/40">يتابع</p></div>
              <div className="bg-white/5 rounded-2xl p-3"><p className="text-xl font-black text-white">0</p><p className="text-xs text-white/40">أصدقاء</p></div>
            </div>

            <div><label className="text-sm text-white/60">الاسم الكامل</label><input value={displayName} onChange={e=>setDisplayName(e.target.value)} className="mt-2 w-full bg-white/5 border border-white/10 rounded-full px-5 py-3 text-white outline-none focus:border-cyan-400/50"/></div>
            <div><label className="text-sm text-white/60">اسم المستخدم</label><input value={username} onChange={e=>setUsername(e.target.value)} placeholder="بدون @" className="mt-2 w-full bg-white/5 border border-white/10 rounded-full px-5 py-3 text-white outline-none focus:border-cyan-400/50"/></div>

            <div><label className="text-sm text-white/60 mb-2 flex gap-2"><Camera className="w-4 h-4"/> اختر صورة رمزية</label>
              <div className="grid grid-cols-4 gap-3">{defaultAvatars.map((a,i)=><img key={i} src={a} onClick={()=>setAvatar(a)} className={`w-full aspect-square rounded-full cursor-pointer border-2 ${avatar===a?'border-cyan-400':'border-transparent'}`} alt="av"/>)}</div>
            </div>

            <div><label className="text-sm text-white/60 mb-2">اختر خلفية افتراضية</label>
              <div className="grid grid-cols-3 gap-3">{defaultCovers.map((c,i)=><img key={i} src={c} onClick={()=>setCover(c)} className={`w-full h-20 rounded-xl object-cover cursor-pointer border-2 ${cover===c?'border-cyan-400':'border-transparent'}`} alt="cover"/>)}</div>
            </div>

            <div className="flex items-center justify-between bg-white/5 p-4 rounded-full border border-white/10">
              <span className="text-sm flex items-center gap-2"><Circle className={`w-3 h-3 ${isOnline?'fill-green-400 text-green-400':'fill-gray-500 text-gray-500'}`}/> الحالة</span>
              <button onClick={()=>setIsOnline(!isOnline)} className={`px-4 py-1.5 rounded-full text-xs font-bold ${isOnline?'bg-green-400 text-black':'bg-white/10 text-white/60'}`}>{isOnline?'متصل':'غير متصل'}</button>
            </div>

            <button onClick={handleSave} disabled={saving} className="w-full bg-gradient-to-r from-cyan-400 to-teal-400 text-black font-black py-3 rounded-full flex items-center justify-center gap-2 text-[14px] disabled:opacity-50">
              <Check className="w-5 h-5"/> {saving? 'جاري الحفظ...' : 'حفظ وادخل المنصة'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}