"use client"
import { useState, useEffect } from "react";
import { db, auth } from "../../lib/firebase";
import { doc, getDoc, collection, query, where, orderBy, getDocs, updateDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { Camera, Edit2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";

const defaultAvatars = [
  "https://i.pravatar.cc/200?img=8","https://i.pravatar.cc/200?img=12","https://i.pravatar.cc/200?img=15","https://i.pravatar.cc/200?img=32","https://i.pravatar.cc/200?img=33","https://i.pravatar.cc/200?img=36","https://i.pravatar.cc/200?img=59","https://i.pravatar.cc/200?img=68",
];
const defaultCovers = [
  "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800","https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800","https://images.unsplash.com/photo-1500534623283-312a57ea4d8d?w=800",
];

export default function ProfileWall() {
  const { uid } = useParams();
  const [user, setUser] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [isMine, setIsMine] = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [showCoverPicker, setShowCoverPicker] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (me) => {
      if (me?.uid === uid) setIsMine(true);
      const snap = await getDoc(doc(db, 'users', uid as string));
      if (snap.exists()) setUser(snap.data());
      const q = query(collection(db, 'posts'), where('authorId','==', uid), orderBy('createdAt','desc'));
      const postsSnap = await getDocs(q);
      setPosts(postsSnap.docs.map(d=>d.data()));
    });
    return () => unsub();
  }, [uid]);

  const changeAvatar = async (url:string) => {
    await updateDoc(doc(db, 'users', uid as string), { avatar: url });
    setUser({...user, avatar: url}); setShowAvatarPicker(false);
  }
  const changeCover = async (url:string) => {
    await updateDoc(doc(db, 'users', uid as string), { cover: url });
    setUser({...user, cover: url}); setShowCoverPicker(false);
  }

  if (!user) return <div className="min-h-screen bg-[#050a0a] flex items-center justify-center text-white">جاري تحميل الحائط...</div>;

  return (
    <div className="min-h-screen bg-[#050a0a]" dir="rtl">
      {/* COVER */}
      <div className="relative h-[260px] w-full group">
        <img src={user.cover} className="w-full h-full object-cover"/>
        <div className="absolute inset-0 bg-black/20"/>
        {isMine && (
          <button onClick={()=>setShowCoverPicker(!showCoverPicker)} className="absolute bottom-4 left-4 bg-black/60 backdrop-blur p-2.5 rounded-full border border-white/20 hover:bg-black/80">
            <Camera className="w-5 h-5 text-white"/>
          </button>
        )}
        {showCoverPicker && (
          <div className="absolute top-[270px] left-4 right-4 bg-[#111] border border-white/10 p-4 rounded-2xl z-20 grid grid-cols-3 gap-2">
            {defaultCovers.map(c=><img key={c} src={c} onClick={()=>changeCover(c)} className="h-16 rounded-xl cursor-pointer object-cover border-2 border-transparent hover:border-cyan-400"/>)}
          </div>
        )}

        {/* AVATAR */}
        <div className="absolute -bottom-16 right-6 flex items-end gap-4">
          <div className="relative group/avatar">
            <img src={user.avatar} className="w-28 h-28 rounded-full border-4 border-[#050a0a] object-cover"/>
            <span className={`absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 border-[#050a0a] ${user.isOnline?'bg-green-400':'bg-gray-500'}`}></span>
            {isMine && (
              <button onClick={()=>setShowAvatarPicker(!showAvatarPicker)} className="absolute bottom-0 left-0 bg-white p-1.5 rounded-full shadow-lg">
                <Camera className="w-4 h-4 text-black"/>
              </button>
            )}
          </div>
          <div className="pb-4">
            <h1 className="text-white text-2xl font-black flex items-center gap-2">{user.displayName} {isMine && <Edit2 onClick={()=>router.push('/profile/setup')} className="w-4 h-4 text-white/40 cursor-pointer"/>}</h1>
            <p className="text-white/50 text-sm">@{user.username} • {user.isOnline?'متصل الآن':'غير متصل'} • {user.followers||0} متابعون • {user.following||0} يتابع • {user.friends||0} صديق</p>
          </div>
        </div>
      </div>

      {/* AVATAR PICKER */}
      {showAvatarPicker && (
        <div className="mt-20 mx-6 bg-white/[0.04] border border-white/10 p-4 rounded-2xl grid grid-cols-4 gap-3">
          {defaultAvatars.map(a=><img key={a} src={a} onClick={()=>changeAvatar(a)} className="aspect-square rounded-full cursor-pointer border-2 border-transparent hover:border-cyan-400"/>)}
        </div>
      )}

      {/* POSTS WALL */}
      <div className="max-w-[600px] mx-auto mt-24 px-4 pb-20 space-y-4">
        {posts.length===0 && <p className="text-center text-white/30 mt-10">لا توجد منشورات بعد</p>}
        {posts.map((p,i)=>
          <div key={i} className="bg-white/[0.04] border border-white/10 rounded-2xl p-4 text-white">{p.content}</div>
        )}
      </div>
    </div>
  );
}