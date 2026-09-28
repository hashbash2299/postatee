"use client"
import { useState, useEffect } from "react";
import { db, auth } from "@/lib/firebase";
import { collection, onSnapshot, doc, getDoc, updateDoc, setDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Video, Sparkles } from "lucide-react";
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
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      try {
        if (!u) { router.push('/login'); return; }
        const userRef = doc(db, 'users', u.uid);
        let snap = await getDoc(userRef);
        if (!snap.exists()) {
          await setDoc(userRef, { uid: u.uid, email: u.email, displayName: u.displayName || 'Postatee', username: 'user_'+u.uid.slice(0,5), role: 'عضو', profileCompleted: true, followers: 0, following: 0, photoURL: u.photoURL || null, createdAt: new Date() }, { merge: true });
          snap = await getDoc(userRef);
        }
        setCurrentUser({...snap.data(), uid: u.uid });
      } finally { setLoading(false); }
    });
    return () => unsub();
  }, [router]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "posts"), (snap) => {
      const data = snap.docs.map(d => ({ id: d.id,...d.data() }));
      data.sort((a:any,b:any)=>{
        const aTime = a.createdAtMillis || a.created_at?.seconds*1000 || a.created_at?.toDate?.()?.getTime() || 0;
        const bTime = b.createdAtMillis || b.created_at?.seconds*1000 || b.created_at?.toDate?.()?.getTime() || 0;
        return bTime - aTime;
      });
      setPosts(data);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "users"), (snap) => {
      setAllUsers(snap.docs.map(d => ({ id: d.id,...d.data() })));
    });
    return () => unsub();
  }, []);

  const onlineUsers = allUsers.filter((u:any) => u.isOnline);
  const offlineUsers = allUsers.filter((u:any) =>!u.isOnline);

  if (loading) return <div className="min-h-screen bg-[#0B1418] flex items-center justify-center text-cyan-400">أهلا بيك في  بوستاتك</div>;

  return (
    <div className="min-h-screen bg-[#0B1418] text-white overflow-x-hidden" dir="rtl">
      <div className="flex max-w-[1600px] mx-auto">
        {/* سايدبار ثابت */}
        <aside className="hidden lg:flex w-[300px] bg-[#122025] flex-col p-4 border-l border-[#1A2E35] h-[calc(100vh-88px)] sticky top-[88px] overflow-y-auto">
          <h3 className="font-bold mb-4">جهات الاتصال ({allUsers.length})</h3>
          <div className="mb-4">
            <p className="text-[11px] font-bold text-green-400 mb-2">● متصلون ({onlineUsers.length})</p>
            <div className="flex flex-col gap-1">
              {onlineUsers.map((u:any) => (
                <Link href={`/profile/${u.uid || u.id}`} key={u.id} className="flex items-center gap-3 p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-green-500/10">
                  <div className="relative"><img src={u.photoURL || `https://i.pravatar.cc/100?u=${u.id}`} className="w-9 h-9 rounded-full object-cover" /><div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 border-2 border-[#122025]"></div></div>
                  <div className="flex-1 min-w-0"><p className="text-sm font-bold truncate">{u.displayName || u.email}</p><p className="text-[11px] text-green-400 truncate">متصل الآن</p></div>
                </Link>
              ))}
            </div>
          </div>
          <div>
            <p className="text-[11px] font-bold text-white/40 mb-2">○ البقية</p>
            <div className="flex flex-col gap-1">
              {offlineUsers.map((u:any) => (
                <Link href={`/profile/${u.uid || u.id}`} key={u.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/10">
                  <div className="relative"><img src={u.photoURL || `https://i.pravatar.cc/100?u=${u.id}`} className="w-9 h-9 rounded-full object-cover" /><div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-gray-500 border-2 border-[#122025]"></div></div>
                  <div className="flex-1 min-w-0"><p className="text-sm font-bold truncate">{u.displayName || u.email}</p><p className="text-[11px] text-white/50 truncate">غير متصل</p></div>
                </Link>
              ))}
            </div>
          </div>
        </aside>

        {/* الفيد */}
        <main className="flex-1 max-w-[720px] mx-auto w-full pb-[80px] lg:pb-4">
          {/* ستوريز بتسکرول عادي */}
          <div className="bg-[#122025] lg:rounded-2xl m-0 lg:m-4 p-4 border-b lg:border border-[#1A2E35] overflow-hidden"><Stories currentUser={currentUser} /></div>

          <div className="mx-4 mt-3">
            <Link href="/video-maker">
              <div className="bg-gradient-to-r from-[#FFD700] via-[#FFC700] to-[#FFB000] rounded-2xl p-[2px] cursor-pointer hover:scale-[1.01] transition-all">
                <div className="bg-[#1A2E35] rounded-[14px] p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-yellow-600 rounded-xl flex items-center justify-center shadow-lg"><Video className="w-6 h-6 text-black" /></div>
                    <div>
                      <h3 className="font-black text-[16px] text-white flex items-center gap-1">اصنع فيديو مجاناً <Sparkles className="w-4 h-4 text-amber-400" /></h3>
                      <p className="text-[12px] text-white/60">دعوة فرح • تهنئة • تخرج • 15 ثانية</p>
                    </div>
                  </div>
                  <div className="bg-amber-400 text-black px-4 py-2 rounded-full font-black text-[13px]">جرب الآن</div>
                </div>
              </div>
            </Link>
          </div>

import Link from "next/link"
//...
<Link href="/chat-rooms">
  <div className="mt-3 bg-[#122025] border border-[#1E3A42] rounded-[16px] p-3 flex items-center justify-between hover:border-[#00E676] transition-colors">
    <div className="flex items-center gap-3">
      <div className="w-11 h-11 bg-[#00E676]/20 rounded-xl flex items-center justify-center text-xl">💬</div>
      <div>
        <h3 className="font-black text-[15px]">غرف دردشة سودانية</h3>
        <p className="text-[11px] text-white/50">بنات • الجزيرة • دارفور • كردفان</p>
      </div>
    </div>
    <div className="bg-[#00E676] text-black text-[12px] font-black px-4 py-2 rounded-full">ادخل</div>
  </div>
</Link>


          {/* كرييت بوست - ثابت زي فيسبوك */}
          <div className="sticky top-[88px] z-[20] bg-[#0B1418]/80 backdrop-blur-xl px-0 lg:px-4 py-2 mt-3">
            <div className="bg-[#122025] lg:rounded-2xl border-y lg:border border-[#1A2E35] shadow-[0_8px_24px_rgba(0,0,0,0.5)]">
              <CreatePost currentUser={currentUser} />
            </div>
          </div>

          {/* البوستات - بتطلع تحت الكرييت بوست */}
          <div className="space-y-2 px-0 lg:px-4 mt-3">
            {posts.filter(p=>!hiddenPosts.includes(p.id)).map(post=>(
              <div key={post.id} id={`post-${post.id}`} className="bg-[#122025] lg:rounded-2xl border-y lg:border border-[#1A2E35] overflow-hidden">
                <PostCard
                  post={post}
                  currentUser={currentUser}
                  onHide={()=>setHiddenPosts([...hiddenPosts, post.id])}
                  onStartEdit={(p:any)=>{ setEditingPost(p); setEditingContent(p.content); }}
                  isEditing={editingPost?.id===post.id}
                  editingContent={editingContent}
                  setEditingContent={setEditingContent}
                  onSaveEdit={async()=>{ await updateDoc(doc(db,'posts',editingPost.id),{content:editingContent}); setEditingPost(null); }}
                  onCancelEdit={()=>setEditingPost(null)}
                  commentText={commentText}
                  setCommentText={setCommentText}
                  openComments={openComments}
                  setOpenComments={setOpenComments}
                />
              </div>
            ))}
          </div>
        </main>
        <div className="hidden lg:block w-[20px]"></div>
      </div>
    </div>
  )
}