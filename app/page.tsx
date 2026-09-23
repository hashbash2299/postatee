"use client"
import { useState, useEffect } from "react";
import { db, auth } from "./lib/firebase";
import { collection, query, orderBy, onSnapshot, doc, getDoc, updateDoc, setDoc, where } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Users } from "lucide-react";
import CreatePost from "../components/feed/CreatePost";
import PostCard from "../components/feed/PostCard";
import Stories from "../components/feed/Stories";
import TickerBar from "../components/layout/TickerBar";

export default function Page(){
  const [posts, setPosts] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [hiddenPosts, setHiddenPosts] = useState<string[]>([]);
  const [editingPost, setEditingPost] = useState<any>(null);
  const [editingContent, setEditingContent] = useState("");
  const [commentText, setCommentText] = useState<any>({});
  const [openComments, setOpenComments] = useState<any>({});
  const [reqCount, setReqCount] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      try {
        if (!u) { router.push('/login'); return; }
        const userRef = doc(db, 'users', u.uid);
        let snap = await getDoc(userRef);
        if (!snap.exists()) {
          await setDoc(userRef, {
            uid: u.uid,
            email: u.email,
            displayName: u.displayName || 'محمد أحمد',
            username: 'mohammed_' + u.uid.slice(0,5),
            role: 'مالك',
            profileCompleted: true,
            followers: 0,
            following: 0,
            photoURL: u.photoURL || null,
            createdAt: new Date()
          }, { merge: true });
          snap = await getDoc(userRef);
        }
        const data = snap.data();
        if (data &&!data.profileCompleted) {
          await setDoc(userRef, { profileCompleted: true }, { merge: true });
        }
        setCurrentUser({...data, uid: u.uid });

        // عداد طلبات الصداقة لايف
        const qReq = query(collection(db,'friendRequests'), where('to','==', u.uid), where('status','==','pending'));
        const unsubReq = onSnapshot(qReq, s=> setReqCount(s.size));
        return ()=> unsubReq();

      } catch (e) {
        console.error("Auth error:", e);
      } finally {
        setLoading(false);
      }
    });
    return () => unsub();
  }, [router]);

  useEffect(() => {
    const q = query(collection(db, "posts"), orderBy("created_at", "desc"));
    const unsub = onSnapshot(q, (snap) => { setPosts(snap.docs.map(d => ({ id: d.id,...d.data() }))); });
    return () => unsub();
  }, []);

  if (loading) return <div className="min-h-screen bg-[#0B1418] flex items-center justify-center text-cyan-400">جاري التحميل...</div>;

  return (
    <div className="min-h-screen bg-[#0B1418] text-white" dir="rtl">
      <TickerBar />
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@700;800&display=swap'); *{font-family:'Tajawal',sans-serif!important}.scrollbar-hide::-webkit-scrollbar{display:none}`}</style>

      {/* MOBILE HEADER */}
      <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-[#122025] sticky top-0 z-50 border-b border-[#1A2E35]">
        <div className="flex items-center gap-3">
          <Link href={`/profile/${currentUser?.uid}`}><img src={currentUser?.photoURL || `https://i.pravatar.cc/100?img=15`} className="w-9 h-9 rounded-full border-2 border-[#00E5FF]"/></Link>
          {/* زرار الاصدقاء موبايل */}
          <Link href="/friends" className="relative w-9 h-9 rounded-full bg-white/10 flex items-center justify-center">
            <Users className="w-5 h-5 text-white"/>
            {reqCount>0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center">{reqCount}</span>}
          </Link>
          <span className="relative text-xl">🔔</span>
          <span className="relative text-xl">💬</span>
        </div>
        <div className="flex items-center gap-2">
          <div><h1 className="font-black text-[20px] leading-none">Posta<span className="text-[#00E5FF]">tee</span></h1><p className="text-[8px] text-gray-400">منصة سودانية لكل السودانيين</p></div>
          <div className="w-8 h-8 bg-[#00E5FF] rounded-lg flex items-center justify-center text-black font-black">P</div>
        </div>
      </header>

      <div className="flex max-w-[1600px] mx-auto">
        <aside className="hidden lg:flex w-[300px] bg-[#122025] h-screen sticky top-0 flex-col p-4 overflow-y-auto scrollbar-hide border-l border-[#1A2E35]">
          <div className="flex items-center gap-3 mb-6">
            <Link href={`/profile/${currentUser?.uid}`}><img src={currentUser?.photoURL || "https://i.pravatar.cc/100?img=15"} className="w-12 h-12 rounded-full"/></Link>
            <div><p className="font-bold">{currentUser?.displayName || 'محمد أحمد'}</p><Link href={`/profile/${currentUser?.uid}`} className="text-xs text-[#00E5FF]">عرض ملفي الشخصي</Link></div>
          </div>
          <h3 className="font-bold mb-3">جهات الاتصال</h3>
          <div className="relative mb-4"><input placeholder="بحث في جهات الاتصال..." className="w-full bg-[#0B1418] border border-[#1A2E35] rounded-full py-2 pr-9 pl-3 text-sm"/><span className="absolute left-3 top-2.5 text-gray-400">⌕</span></div>
          {[
            ["سارة عثمان","متصل الآن",true,"20"],["أحمد الطيب","متصل الآن",true,"12"],["إيمان عبد الله","متصل الآن",true,"32"],
            ["مصطفى إدريس","منذ 5 دقائق",false,"5"],["نهى محمد","منذ 12 دقيقة",false,"26"],
          ].map(([name,status,online,img],i)=>(
            <div key={i} className="flex items-center gap-3 py-2 hover:bg-[#1A2E35] rounded-xl px-2 cursor-pointer">
              <div className="relative"><img src={`https://i.pravatar.cc/100?img=${img}`} className="w-10 h-10 rounded-full"/><span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#122025] ${online?'bg-green-500':'bg-gray-500'}`}></span></div>
              <div className="flex-1"><p className="text-[13px]">{name}</p><p className="text-[11px] text-gray-400">{status}</p></div>
            </div>
          ))}
        </aside>

        <main className="flex-1 max-w-[720px] mx-auto w-full pb-[80px] lg:pb-0">
          <div className="bg-[#122025] lg:rounded-2xl m-0 lg:m-4 p-4 border-b lg:border border-[#1A2E35]">
            <div className="flex justify-between items-center mb-3"><h3 className="font-bold">القصص</h3><span className="text-[#00E5FF] text-sm">عرض الكل {'<'} </span></div>
            <Stories currentUser={currentUser} />
          </div>
          <div className="bg-[#122025] lg:rounded-2xl m-0 lg:m-4 mt-2 lg:mt-4 border-y lg:border border-[#1A2E35]">
            <CreatePost currentUser={currentUser} />
          </div>
          <div className="space-y-2 lg:space-y-3">
            {posts.filter(p=>!hiddenPosts.includes(p.id)).map(post=>(
              <div key={post.id} className="bg-[#122025] lg:rounded-2xl border-y lg:border border-[#1A2E35] overflow-hidden">
                <PostCard post={post} currentUser={currentUser}
                  onHide={()=>setHiddenPosts([...hiddenPosts, post.id])}
                  onStartEdit={(p:any)=>{ setEditingPost(p); setEditingContent(p.content); }}
                  isEditing={editingPost?.id===post.id}
                  editingContent={editingContent}
                  setEditingContent={setEditingContent}
                  onSaveEdit={async()=>{ await updateDoc(doc(db,'posts',editingPost.id),{content:editingContent}); setEditingPost(null); }}
                  onCancelEdit={()=>setEditingPost(null)}
                  commentText={commentText} setCommentText={setCommentText}
                  openComments={openComments} setOpenComments={setOpenComments}
                />
              </div>
            ))}
          </div>
        </main>

        {/* RIGHT SIDEBAR - ضفنا رابط الاصدقاء هنا */}
        <aside className="hidden lg:block w-[320px] bg-[#122025] h-screen sticky top-0 p-4 border-r border-[#1A2E35]">
          <div className="flex items-center gap-2 mb-6"><div className="w-10 h-10 bg-[#00E5FF] rounded-xl flex items-center justify-center font-black text-black text-xl">P</div><div><h1 className="font-black text-xl leading-none">Postatee</h1><p className="text-[8px] text-gray-400">منصة سودانية لكل السودانيين حول العالم</p></div></div>
          <div className="relative mb-6"><input placeholder="ابحث عن أصدقاء، منشورات، صفحات..." className="w-full bg-[#0B1418] border border-[#1A2E35] rounded-full py-2.5 pr-4 pl-10 text-sm"/><span className="absolute left-3 top-2.5">🔍</span></div>
          <div className="space-y-1">
            <div className="bg-[#00E5FF] text-black rounded-xl p-3 font-bold">🏠 الصفحة الرئيسية</div>
            <Link href="/friends" className="p-3 text-gray-300 flex items-center justify-between rounded-xl hover:bg-[#1A2E35] transition-all">
              <span className="flex items-center gap-2"><Users className="w-5 h-5"/> الأصدقاء</span>
              {reqCount>0 && <span className="bg-red-500 text-white text-xs font-black px-2 py-0.5 rounded-full">{reqCount}</span>}
            </Link>
            <div className="p-3 text-gray-300">🧭 استكشف</div><div className="p-3 text-gray-300">👥 المجموعات</div><div className="p-3 text-gray-300">📄 الصفحات</div><div className="p-3 text-gray-300">💬 الرسائل</div><div className="p-3 text-gray-300">🔔 الإشعارات</div>
          </div>
        </aside>
      </div>

      {/* MOBILE BOTTOM NAV - ضفنا الاصدقاء هنا كمان */}
      <nav className="lg:hidden fixed bottom-0 w-full bg-[#122025] border-t border-[#1A2E35] flex justify-around items-center py-2 z-50">
        <Link href={`/profile/${currentUser?.uid}`} className="flex flex-col items-center text-gray-400"><span className="text-xl">👤</span><span className="text-[10px]">الملف الشخصي</span></Link>
        <Link href="/friends" className="flex flex-col items-center text-gray-400 relative"><span className="text-xl"><Users className="w-5 h-5"/></span><span className="text-[10px]">الأصدقاء</span>{reqCount>0 && <span className="absolute -top-1 right-1 bg-red-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center">{reqCount}</span>}</Link>
        <button className="flex flex-col items-center"><div className="w-14 h-14 bg-[#00E5FF] rounded-full flex items-center justify-center -mt-8 border-4 border-[#0B1418] text-black text-2xl font-bold">+</div><span className="text-[10px] font-bold">إنشاء منشور</span></button>
        <button className="flex flex-col items-center text-gray-400"><span className="text-xl">👥</span><span className="text-[10px]">المجموعات</span></button>
        <button className="flex flex-col items-center text-[#00E5FF]"><span className="text-xl">🏠</span><span className="text-[10px]">الصفحة الرئيسية</span></button>
      </nav>
    </div>
  )
}