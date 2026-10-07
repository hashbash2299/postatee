"use client"
import { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, setDoc, serverTimestamp, collection, query, where, getDocs } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import { Camera, Check, Circle, Crown, Gem, Star, Verified } from "lucide-react";

// ✅ التغيير الوحيد - واحدة ديفولت فقط فلكلور سوداني + محايد
const DEFAULT_AVATAR = "/default-avatar.png";
const DEFAULT_COVER = "/default-cover.jpg";
const defaultAvatars = [DEFAULT_AVATAR];
const defaultCovers = [DEFAULT_COVER];

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

const RESERVED = ["postatee","admin","بوستاتي","postate","المالك","root"];

export default function SetupProfile() {
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [avatar, setAvatar] = useState(DEFAULT_AVATAR);
  const [cover, setCover] = useState(DEFAULT_COVER);
  const [isOnline, setIsOnline] = useState(true);
  const [uid, setUid] = useState("");
  const [existingData, setExistingData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) { router.replace('/login'); return; }
      setUid(u.uid);
      const snap = await getDoc(doc(db, 'users', u.uid));
      if (snap.exists()) {
        const data = snap.data();
        setExistingData(data);
        if(data.profileCompleted && data.displayName && data.username){
          router.replace('/');
          return;
        }
        if(data.displayName && data.displayName!== 'Postatee' &&!data.displayName.includes('@')){
          setDisplayName(data.displayName);
        }
        if(data.username) setUsername(data.username);
        if(data.avatar) setAvatar(data.avatar);
        if(data.cover) setCover(data.cover);
      }
      setLoading(false);
    });
    return () => unsub();
  }, [router]);

  const handleSave = async () => {
    const cleanUsername = username.toLowerCase().trim().replace('@','').replace(/\s+/g,'_').replace(/[^a-z0-9_]/g,'');
    const cleanDisplayName = displayName.trim();

    if (!cleanDisplayName ||!cleanUsername) return alert("اكمل البيانات");
    if (cleanDisplayName.length < 2) return alert("الاسم قصير شديد");
    if (cleanUsername.length < 3) return alert("اليوزرنيم قصير");
    if (cleanDisplayName.includes('@') || cleanDisplayName.includes('.com')) {
      return alert("الاسم ما ينفع يكون ايميل، اكتب اسمك العربي");
    }
    if(RESERVED.includes(cleanDisplayName.toLowerCase()) || RESERVED.includes(cleanUsername)){
      return alert("الاسم ده محجوز للنظام");
    }

    setSaving(true);
    try {
      if(existingData?.usernameLower!== cleanUsername){
        const q = query(collection(db, 'users'), where('usernameLower','==',cleanUsername));
        const snap = await getDocs(q);
        if(!snap.empty && snap.docs[0].id!== uid){
          alert("اليوزرنيم محجوز");
          setSaving(false);
          return;
        }
      }

      await setDoc(doc(db, 'users', uid), {
        uid,
        displayName: cleanDisplayName,
        displayNameLower: cleanDisplayName.toLowerCase(),
        displayNameArabic: cleanDisplayName,
        displayNameArabicLower: cleanDisplayName.toLowerCase(),
        username: cleanUsername,
        usernameLower: cleanUsername,
        avatar,
        cover,
        isOnline,
        lastSeen: serverTimestamp(),
        profileCompleted: true,
        updatedAt: serverTimestamp(),
        createdAt: existingData?.createdAt || serverTimestamp(),
      }, { merge: true });

      router.replace('/');
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
            <img src={cover || DEFAULT_COVER} className="w-full h-full object-cover" alt="cover"/>
            <div className="absolute inset-0 bg-black/30"/>
            <div className="absolute bottom-4 left-4 right-4 flex items-end gap-4">
              <div className="relative">
                <img src={avatar || DEFAULT_AVATAR} className="w-24 h-24 rounded-full border-4 border-[#050a0a] object-cover" alt="avatar"/>
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

            <div><label className="text-sm text-white/60">الاسم الكامل (عربي)</label><input value={displayName} onChange={e=>setDisplayName(e.target.value)} placeholder="مثلا: محمد أحمد" className="mt-2 w-full bg-white/5 border border-white/10 rounded-full px-5 py-3 text-white outline-none focus:border-cyan-400/50"/></div>
            <div><label className="text-sm text-white/60">اسم المستخدم (انجليزي)</label><input value={username} onChange={e=>setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g,''))} placeholder="بدون @" dir="ltr" className="mt-2 w-full bg-white/5 border border-white/10 rounded-full px-5 py-3 text-white outline-none focus:border-cyan-400/50 text-left"/></div>

            <div><label className="text-sm text-white/60 mb-2 flex gap-2"><Camera className="w-4 h-4"/> الصورة الافتراضية - يمكنك تغييرها لاحقاً</label>
              <div className="grid grid-cols-4 gap-3">{defaultAvatars.map((a,i)=><img key={i} src={a} onClick={()=>setAvatar(a)} className={`w-full aspect-square rounded-full cursor-pointer border-2 ${avatar===a?'border-cyan-400':'border-transparent'} bg-[#1a2a2f]`} alt="av"/>)}</div>
              <p className="text-[11px] text-white/30 mt-2">أفاتار محايد بدون ملامح - تقدر تغيره من البروفايل بضغطة كاميرا</p>
            </div>

            <div><label className="text-sm text-white/60 mb-2">الخلفية الافتراضية - فلكلور سوداني</label>
              <div className="grid grid-cols-3 gap-3">{defaultCovers.map((c,i)=><img key={i} src={c} onClick={()=>setCover(c)} className={`w-full h-20 rounded-xl object-cover cursor-pointer border-2 ${cover===c?'border-cyan-400':'border-transparent'}`} alt="cover"/>)}</div>
              <p className="text-[11px] text-white/30 mt-2">تصميم فلكلور سوداني أصيل - تقدر تغيره من البروفايل</p>
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