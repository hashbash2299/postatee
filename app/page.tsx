"use client"
import { useState, useEffect } from "react";
import { db, auth } from "./lib/firebase";
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { Search, Home, Heart, MessageCircle, Share2, MoreHorizontal, Crown, ShieldCheck, Star, CheckCircle2, ArrowRight, Plus, Image as ImageIcon, Video as VideoIcon, Send, Bell, MessageSquare, LogOut } from "lucide-react";

const RoleBadge = ({ role }: { role: string }) => {
  if (role === "مالك") return <span className="inline-flex items-center gap-1 bg-gradient-to-r from-cyan-400 to-teal-400 text-black text-[10px] font-black px-2 py-0.5 rounded-full"><Crown className="w-3 h-3"/> مالك</span>;
  if (role === "مؤسس") return <span className="inline-flex items-center gap-1 bg-white/10 border border-cyan-400/30 text-cyan-400 text-[10px] font-bold px-2 py-0.5 rounded-full"><ShieldCheck className="w-3 h-3"/> مؤسس</span>;
  if (role === "شخصية هامة") return <span className="inline-flex items-center gap-1 bg-gradient-to-r from-yellow-400 to-orange-400 text-black text-[10px] font-black px-2 py-0.5 rounded-full"><Star className="w-3 h-3"/> هامة</span>;
  return null;
};

export default function PostateeApp() {
  const [text, setText] = useState("");
  const [posts, setPosts] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) { router.push('/login'); return; }
      const snap = await getDoc(doc(db, 'users', u.uid));
      if (snap.exists()) {
        const data = snap.data();
        if (!data.profileCompleted) { router.push('/profile/setup'); return; }
        setCurrentUser({...data, uid: u.uid }); // مهم نضيف uid
      }
      setLoading(false);
    });
    return () => unsub();
  }, [router]);

  useEffect(() => {
    const q = query(collection(db, "posts"), orderBy("created_at", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setPosts(snap.docs.map(d => ({ id: d.id,...d.data() })));
    });
    return () => unsub();
  }, []);

  const handlePost = async (type = "text") => {
    if (!text.trim() && type==="text") return;
    let content = text;
    let image = null;
    if(type==="image") image = "https://picsum.photos/600/400?random=" + Math.floor(Math.random()*100);
    if(type==="video") content = text + " 🎥 فيديو جديد";
    await addDoc(collection(db, "posts"), {
      content, image, created_at: serverTimestamp(),
      uid: auth.currentUser?.uid,
      authorId: auth.currentUser?.uid, // عشان الحائط يشتغل
      authorName: currentUser?.displayName,
      authorUsername: currentUser?.username,
      authorAvatar: currentUser?.avatar || ""
    });
    setText("");
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  if (loading) return <div className="min-h-screen bg-[#050a0a] flex items-center justify-center text-cyan-400">جاري التحميل...</div>;

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&display=swap'); *{font-family:'Tajawal',sans-serif!important;}`}</style>
      <div className="min-h-screen bg-[#050a0a] text-white" dir="rtl">
        <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/10 px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2"><img src="/logo.png" className="w-9 h-9 rounded-xl bg-white/5 p-1 border border-cyan-400/20"/><span className="font-black text-xl">Postatee</span></div>
          <div className="flex items-center gap-3">
            <Home className="w-5 h-5 text-cyan-400"/>
            <Bell className="w-5 h-5 text-white/60"/>
            <MessageSquare className="w-5 h-5 text-white/60"/>
            {/* هنا التعديل - يوديك للحائط بتاعك مباشرة */}
            <img
              src={currentUser?.avatar || `https://i.pravatar.cc/100?u=${currentUser?.username}`}
              onClick={()=>router.push(`/profile/${currentUser?.uid}`)}
              className="w-8 h-8 rounded-full border border-cyan-400/30 cursor-pointer hover:opacity-80"
              title="حائطي"
            />
            <button onClick={handleLogout} className="w-8 h-8 rounded-full bg-white/5 hover:bg-red-500/20 border border-white/10 flex items-center justify-center text-white/70 hover:text-red-400"><LogOut className="w-4 h-4"/></button>
          </div>
        </header>

        <div className="max-w-[600px] mx-auto p-3 space-y-3">
          <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-3">
            <div className="flex gap-3">
              <img
                src={currentUser?.avatar || `https://i.pravatar.cc/100?u=${currentUser?.username}`}
                onClick={()=>router.push(`/profile/${currentUser?.uid}`)}
                className="w-10 h-10 rounded-full cursor-pointer"
              />
              <input value={text} onChange={e=>setText(e.target.value)} placeholder={`بماذا تفكر يا ${currentUser?.displayName || ''}؟`} className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 py-2.5 text-sm outline-none"/>
            </div>
            <div className="flex justify-between mt-3 pt-3 border-t border-white/5">
              <div className="flex gap-4">
                <button onClick={()=>handlePost("image")} className="flex items-center gap-1.5 text-sm text-green-400"><ImageIcon className="w-5 h-5"/> صورة</button>
                <button onClick={()=>handlePost("video")} className="flex items-center gap-1.5 text-sm text-red-400"><VideoIcon className="w-5 h-5"/> فيديو</button>
              </div>
              <button onClick={()=>handlePost("text")} className="bg-cyan-400 text-black font-black px-6 py-1.5 rounded-full flex items-center gap-1"><Send className="w-4 h-4"/> نشر</button>
            </div>
          </div>

          {posts.length === 0 && <div className="text-center text-white/40 py-12 border border-dashed border-white/10 rounded-2xl">لا توجد منشورات بعد - كن أول من ينشر! 💎</div>}

          {posts.map((post:any)=>(
            <div key={post.id} className="bg-white/[0.04] border border-white/10 rounded-2xl p-4">
              <div className="flex justify-between">
                <div className="flex gap-3">
                  {/* هنا التعديل المهم - ضغطة تودي الحائط */}
                  <img
                    src={post.authorAvatar || `https://i.pravatar.cc/100?u=${post.uid}`}
                    onClick={()=>router.push(`/profile/${post.authorId || post.uid}`)}
                    className="w-10 h-10 rounded-full border border-cyan-400/20 cursor-pointer hover:brightness-110 transition"
                  />
                  <div><div className="flex items-center gap-2"><span className="font-bold text-sm">{post.authorName}</span>{post.authorUsername === 'postatee' && <RoleBadge role="مالك"/>}<CheckCircle2 className="w-4 h-4 text-cyan-400"/></div><span className="text-xs text-white/40">الآن</span></div>
                </div>
                <MoreHorizontal className="w-5 h-5 text-white/30"/>
              </div>
              <p className="mt-3 text-[15px] whitespace-pre-wrap">{post.content}</p>
              {post.image && <img src={post.image} className="mt-3 rounded-xl w-full"/>}
              <div className="flex justify-between mt-4 pt-3 border-t border-white/5">
                <button className="flex gap-1.5 text-sm text-white/50"><Heart className="w-5 h-5"/> أعجبني</button>
                <button className="flex gap-1.5 text-sm text-white/50"><MessageCircle className="w-5 h-5"/> تعليق</button>
                <button className="flex gap-1.5 text-sm text-white/50"><Share2 className="w-5 h-5"/> مشاركة</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}