"use client"
import { useState, useEffect, useRef } from "react";
import { db, auth } from "../../lib/firebase";
import { doc, getDoc, collection, getDocs, query, where, updateDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { Camera, ArrowLeft, User, Image as ImageIcon } from "lucide-react";
import { useParams, useRouter } from "next/navigation";

export default function ProfileWall() {
  const { uid } = useParams();
  const [user, setUser] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [isMine, setIsMine] = useState(false);
  const avatarInput = useRef<HTMLInputElement>(null);
  const coverInput = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (me) => {
      if (me?.uid === uid) setIsMine(true);
      const snap = await getDoc(doc(db, 'users', uid as string));
      if (snap.exists()) setUser(snap.data());

      // Fix 1: نجيب بوستاتك سواء كانت محفوظة بـ uid أو authorId
      const postsRef = collection(db, 'posts');
      const q1 = await getDocs(query(postsRef, where('uid','==', uid)));
      const q2 = await getDocs(query(postsRef, where('authorId','==', uid)));
      const all = [...q1.docs,...q2.docs];
      const unique = Array.from(new Map(all.map(d=>[d.id, {id:d.id,...d.data()}])).values());
      // ترتيب من الجديد للقديم
      unique.sort((a:any,b:any)=> (b.created_at?.seconds||0) - (a.created_at?.seconds||0));
      setPosts(unique as any[]);
    });
    return () => unsub();
  }, [uid]);

  const handleUpload = async (e:any, type:'avatar'|'cover') => {
    const file = e.target.files[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = ev.target?.result as string;
      await updateDoc(doc(db, 'users', uid as string), { [type]: base64 });
      setUser({...user, [type]: base64});
    };
    reader.readAsDataURL(file);
  };

  if (!user) return <div className="min-h-screen bg-[#050a0a] flex items-center justify-center text-white">جاري تحميل الحائط...</div>;

  return (
    <div className="min-h-screen bg-[#050a0a]" dir="rtl">
      {/* Fix 2: هيدر صغير فيه زر رجوع */}
      <header className="sticky top-0 z-50 h-[56px] bg-[#050a0a]/80 backdrop-blur-xl border-b border-white/10 flex items-center justify-between px-4">
        <button onClick={()=>router.push('/')} className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center">
          <ArrowLeft className="w-5 h-5 text-white"/>
        </button>
        <span className="font-black">{user.displayName}</span>
        <div className="w-9"/>
      </header>

      {/* COVER */}
      <div className="relative h-[200px] w-full group bg-white/5">
        {user.cover? <img src={user.cover} className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center text-white/20"><ImageIcon className="w-12 h-12"/></div>}
        <div className="absolute inset-0 bg-black/20"/>
        {isMine && (
          <>
            <button onClick={()=>coverInput.current?.click()} className="absolute bottom-4 left-4 bg-black/60 backdrop-blur p-2.5 rounded-full border border-white/20">
              <Camera className="w-5 h-5 text-white"/>
            </button>
            <input ref={coverInput} type="file" accept="image/*" hidden onChange={(e)=>handleUpload(e,'cover')}/>
          </>
        )}

        {/* AVATAR */}
        <div className="absolute -bottom-14 right-6 flex items-end gap-4">
          <div className="relative">
            <div className="w-24 h-24 rounded-full border-4 border-[#050a0a] bg-[#111] overflow-hidden flex items-center justify-center">
              {user.avatar? <img src={user.avatar} className="w-full h-full object-cover"/> : <User className="w-10 h-10 text-white/30"/>}
            </div>
            <span className={`absolute bottom-1 right-1 w-3.5 h-3.5 rounded-full border-2 border-[#050a0a] ${user.isOnline?'bg-green-400':'bg-gray-500'}`}></span>
            {isMine && (
              <>
                <button onClick={()=>avatarInput.current?.click()} className="absolute -bottom-1 -left-1 bg-white p-1.5 rounded-full shadow-lg">
                  <Camera className="w-4 h-4 text-black"/>
                </button>
                <input ref={avatarInput} type="file" accept="image/*" hidden onChange={(e)=>handleUpload(e,'avatar')}/>
              </>
            )}
          </div>
          <div className="pb-2">
            <h1 className="text-white text-xl font-black">{user.displayName}</h1>
            <p className="text-white/50 text-xs">@{user.username} • {user.isOnline?'متصل الآن':'غير متصل'}</p>
          </div>
        </div>
      </div>

      {/* POSTS WALL */}
      <div className="max-w-[600px] mx-auto mt-20 px-3 pb-20 space-y-3">
        <div className="flex gap-6 border-b border-white/10 pb-2 text-sm">
          <span className="font-bold text-white border-b-2 border-cyan-400 pb-2">المنشورات</span>
          <span className="text-white/40">{posts.length} منشور</span>
        </div>

        {posts.length===0 && <div className="text-center text-white/30 mt-10 border border-dashed border-white/10 rounded-2xl py-10">لسه ما نشرت حاجة</div>}

        {posts.map((p:any)=>
          <div key={p.id} className="bg-white/[0.04] border border-white/10 rounded-2xl p-4">
            <div className="flex gap-2 items-center mb-2">
              <img src={user.avatar} className="w-8 h-8 rounded-full"/>
              <span className="text-sm font-bold text-white">{user.displayName}</span>
            </div>
            <p className="text-[15px] whitespace-pre-wrap text-white/90">{p.content}</p>
            {p.image && <img src={p.image} className="mt-3 rounded-xl w-full"/>}
          </div>
        )}
      </div>
    </div>
  );
}