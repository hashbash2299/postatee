"use client"
import { useState, useEffect } from "react";
import { db, auth } from "./lib/firebase";
import { collection, query, orderBy, onSnapshot, doc, getDoc, updateDoc, setDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import CreatePost from "../components/feed/CreatePost";
import PostCard from "../components/feed/PostCard";
import Stories from "../components/feed/Stories";

export default function Page(){
  const [posts, setPosts] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [hiddenPosts, setHiddenPosts] = useState<string[]>([]);
  const [editingPost, setEditingPost] = useState<any>(null);
  const [editingContent, setEditingContent] = useState("");
  const [commentText, setCommentText] = useState<any>({});
  const [openComments, setOpenComments] = useState<any>({});
  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) { router.push('/login'); return; }
      // FIX: setDoc بدل updateDoc عشان ما يقع تاني
      const snap = await getDoc(doc(db, 'users', u.uid));
      if (snap.exists()) {
        const data = snap.data();
        if (!data.profileCompleted) {
          // لو profileCompleted ناقص اعملو true تلقائي للحساب المالك
          if(data.role === 'مالك'){
            await setDoc(doc(db,'users',u.uid),{profileCompleted:true},{merge:true});
          } else {
            router.push('/profile/setup'); return;
          }
        }
        setCurrentUser({...data, uid: u.uid });
      } else {
        // لو دخل وملفو ما موجود - انشئو تلقائي بدل ما يديك No document
        await setDoc(doc(db,'users',u.uid),{
          uid: u.uid,
          email: u.email,
          displayName: u.displayName || 'محمد أحمد',
          username: 'mohammed',
          role: 'مالك',
          profileCompleted: true,
          followers: 0,
          following: 0,
          createdAt: new Date()
        },{merge:true});
        const newSnap = await getDoc(doc(db,'users',u.uid));
        setCurrentUser({...newSnap.data(), uid: u.uid});
      }
      setLoading(false);
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
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@700;800&display=swap'); *{font-family:'Tajawal',sans-serif!important}.scrollbar-hide::-webkit-scrollbar{display:none}.scrollbar-hide{-ms-overflow-style:none; scrollbar-width:none}`}</style>

      {/* ===== MOBILE HEADER ===== */}
      <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-[#122025] sticky top-0 z-50 border-b border-[#1A2E35]">
        <div className="flex items-center gap-4">
          <img src={currentUser?.photoURL || `https://i.pravatar.cc/100?img=15`} className="w-9 h-9 rounded-full border-2 border-[#00E5FF]"/>
          <span className="relative text-xl">🔔<span className="absolute -top-2 -right-2 bg-[#00E5FF] text-black text-[10px] w-4 h-4 flex items-center justify-center rounded-full font-bold">5</span></span>
          <span className="relative text-xl">💬<span className="absolute -top-2 -right-2 bg-[#00E5FF] text-black text-[10px] w-4 h-4 flex items-center justify-center rounded-full font-bold">3</span></span>
          <span className="text-xl">🔍</span>
        </div>
        <div className="flex items-center gap-2">
          <div><h1 className="font-black text-[22px] leading-none">P<span className="text-[#00E5FF]">ostatee</span></h1><p className="text-[8px] text-gray-400 -mt-1">منصة سودانية لكل السودانيين حول العالم</p></div>
          <div className="w-8 h-8 bg-[#00E5FF] rounded-lg flex items-center justify-center text-black font-black">P</div>
        </div>
      </header>

      <div className="flex max-w-[1600px] mx-auto">
        {/* LEFT - جهات الاتصال */}
        <aside className="hidden lg:flex w-[300px] bg-[#122025] h-screen sticky top-0 flex-col p-4 overflow-y-auto scrollbar-hide border-l border-[#1A2E35]">
          <div className="flex items-center gap-3 mb-6">
            <img src={currentUser?.photoURL || "https://i.pravatar.cc/100?img=15"} className="w-12 h-12 rounded-full"/>
            <div><p className="font-bold">{currentUser?.displayName || 'محمد أحمد'}</p><p className="text-xs text-gray-400">عرض ملفي الشخصي</p></div>
            <div className="mr-auto w-8 h-8 bg-[#1A2E35] rounded-full flex items-center justify-center">▼</div>
          </div>
          <div className="flex items-center justify-between mb-3"><h3 className="font-bold">جهات الاتصال</h3><span>•••</span></div>
          <div className="relative mb-4"><input placeholder="بحث في جهات الاتصال..." className="w-full bg-[#0B1418] border border-[#1A2E35] rounded-full py-2 pr-9 pl-3 text-sm"/><span className="absolute left-3 top-2.5 text-gray-400">⌕</span></div>
          <div className="space-y-1">
            {[
              ["سارة عثمان","متصل الآن",true,"20"],["أحمد الطيب","متصل الآن",true,"12"],["إيمان عبد الله","متصل الآن",true,"32"],
              ["مصطفى إدريس","منذ 5 دقائق",false,"5"],["نهى محمد","منذ 12 دقيقة",false,"26"],["عمر دفع الله","منذ ساعة",false,"8"],
              ["رويدا علي","منذ ساعة",false,"23"],["حسين آدم","منذ ساعتين",false,"15"],["خالد محمود","منذ 30 دقيقة",false,"11"],
              ["مها عبد الرحمن","منذ 4 ساعات",false,"29"],
            ].map(([name,status,online,img],i)=>(
              <div key={i} className="flex items-center gap-3 py-2 hover:bg-[#1A2E35] rounded-xl px-2 cursor-pointer">
                <div className="relative"><img src={`https://i.pravatar.cc/100?img=${img}`} className="w-10 h-10 rounded-full"/><span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#122025] ${online?'bg-green-500':'bg-gray-500'}`}></span></div>
                <div className="flex-1"><p className="text-[13px] font-medium">{name}</p><p className="text-[11px] text-gray-400">{status}</p></div>
                <span className={`w-2 h-2 rounded-full ${online?'bg-green-500':'bg-gray-500'}`}></span>
              </div>
            ))}
          </div>
          <button className="mt-4 w-full bg-[#1A2E35] rounded-full py-2 text-sm">عرض المزيد</button>
        </aside>

        {/* CENTER */}
        <main className="flex-1 max-w-[720px] mx-auto w-full pb-[80px] lg:pb-0">
          {/* Stories - نفس التصميم */}
          <div className="bg-[#122025] lg:rounded-2xl m-0 lg:m-4 p-4 border-b lg:border border-[#1A2E35]">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold">القصص</h3>
              <span className="text-[#00E5FF] text-sm cursor-pointer">عرض الكل {'<'} </span>
            </div>
            <Stories currentUser={currentUser} />
          </div>

          {/* Create Post */}
          <div className="bg-[#122025] lg:rounded-2xl m-0 lg:m-4 mt-2 lg:mt-4 border-y lg:border border-[#1A2E35]">
            <CreatePost currentUser={currentUser} />
          </div>

          {/* Posts */}
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
            {posts.length===0 && <div className="bg-[#122025] rounded-2xl p-10 text-center text-gray-400 m-4">لا توجد منشورات بعد - كن أول من ينشر! 🇸🇩</div>}
          </div>
        </main>

        {/* RIGHT SIDEBAR - Desktop only */}
        <aside className="hidden lg:block w-[320px] bg-[#122025] h-screen sticky top-0 p-4 overflow-y-auto scrollbar-hide border-r border-[#1A2E35]">
          <div className="relative mb-6">
            <input placeholder="ابحث عن أصدقاء، منشورات، صفحات..." className="w-full bg-[#0B1418] border border-[#1A2E35] rounded-full py-2.5 pr-4 pl-10 text-sm"/>
            <span className="absolute left-3 top-2.5">🔍</span>
          </div>
          <div className="absolute top-3 right-4 flex items-center gap-2">
            <div className="w-10 h-10 bg-[#00E5FF] rounded-xl flex items-center justify-center font-black text-black text-xl">P</div>
            <div><h1 className="font-black text-xl leading-none">Postatee</h1><p className="text-[8px] text-gray-400">منصة سودانية لكل السودانيين حول العالم</p></div>
          </div>
          <div className="mt-14 space-y-1">
            <div className="bg-[#00E5FF] text-black rounded-xl p-3 font-bold flex items-center gap-3">🏠 الصفحة الرئيسية</div>
            <div className="p-3 flex items-center gap-3 text-gray-300 hover:bg-[#1A2E35] rounded-xl cursor-pointer"><span>🧭</span> استكشف</div>
            <div className="p-3 flex items-center gap-3 text-gray-300 hover:bg-[#1A2E35] rounded-xl cursor-pointer"><span>👥</span> المجموعات</div>
            <div className="p-3 flex items-center gap-3 text-gray-300 hover:bg-[#1A2E35] rounded-xl cursor-pointer"><span>🚩</span> الصفحات</div>
            <div className="p-3 flex items-center gap-3 text-gray-300 hover:bg-[#1A2E35] rounded-xl cursor-pointer"><span>📅</span> المناسبات</div>
            <div className="p-3 flex items-center gap-3 text-gray-300 hover:bg-[#1A2E35] rounded-xl cursor-pointer"><span>💬</span> الرسائل</div>
            <div className="p-3 flex items-center gap-3 text-gray-300 hover:bg-[#1A2E35] rounded-xl cursor-pointer"><span>🔔</span> الإشعارات</div>
            <div className="p-3 flex items-center gap-3 text-gray-300 hover:bg-[#1A2E35] rounded-xl cursor-pointer"><span>🔖</span> العناصر المحفوظة</div>
            <div className="p-3 flex items-center gap-3 text-gray-300 hover:bg-[#1A2E35] rounded-xl cursor-pointer"><span>⊞</span> المزيد</div>
          </div>
          <div className="mt-6 rounded-[20px] overflow-hidden relative h-[260px] bg-gradient-to-b from-[#1A2E35] to-black border border-[#1A2E35]">
            <img src="https://images.unsplash.com/photo-1500835556837-99ac94a94552?w=400" className="absolute inset-0 w-full h-full object-cover opacity-60"/>
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"/>
            <div className="absolute top-4 left-0 right-0 text-center"><h2 className="font-black text-xl">P Postatee</h2><p className="text-[10px]">منصة سودانية لكل السودانيين حول العالم</p></div>
            <div className="absolute bottom-4 right-4 text-right"><p className="font-bold text-lg leading-6">معاً..<br/>نبني سودان أفضل</p></div>
            <div className="absolute bottom-0 left-0 right-0 h-2 bg-[#00E5FF]"/>
          </div>
        </aside>
      </div>

      {/* MOBILE BOTTOM NAV - زي الصورة التانية بالضبط */}
      <nav className="lg:hidden fixed bottom-0 w-full bg-[#122025] border-t border-[#1A2E35] flex justify-around items-center py-2 z-50">
        <button onClick={()=>router.push('/profile')} className="flex flex-col items-center text-gray-400"><span className="text-xl">👤</span><span className="text-[10px] mt-1">الملف الشخصي</span></button>
        <button className="flex flex-col items-center text-gray-400"><span className="text-xl">🧭</span><span className="text-[10px] mt-1">اكتشف</span></button>
        <button className="flex flex-col items-center"><div className="w-14 h-14 bg-[#00E5FF] rounded-full flex items-center justify-center -mt-8 border-4 border-[#0B1418] text-black text-2xl font-bold">+</div><span className="text-[10px] mt-1 font-bold">إنشاء منشور</span></button>
        <button className="flex flex-col items-center text-gray-400"><span className="text-xl">👥</span><span className="text-[10px] mt-1">المجموعات</span></button>
        <button className="flex flex-col items-center text-[#00E5FF]"><span className="text-xl">🏠</span><span className="text-[10px] mt-1 font-bold">الصفحة الرئيسية</span></button>
      </nav>
    </div>
  )
}