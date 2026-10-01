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

  if (loading) return <div className="min-h-screen bg-[#0B1418] flex items-center justify-center text-cyan-400">أهلا بيك في Postatee</div>;

  return (
    <div className="min-h-screen bg-[#0B1418] text-white overflow-x-hidden" dir="rtl">
      <div className="flex justify-center max-w-[1600px] mx-auto">
        {/* الفيد - بقى في النص */}
        <main className="flex-1 max-w-[720px] mx-auto w-full pb-[80px] lg:pb-4">
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

          <Link href="/chat-rooms">
            <div className="mt-3 bg-[#122025] border border-[#1E3A42] rounded-[16px] p-3 flex items-center justify-between hover:border-[#00E676] transition-colors mx-4 lg:mx-0">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-[#00E676]/20 rounded-xl flex items-center justify-center text-xl">💬</div>
                <div>
                  <h3 className="font-black text-[15px]">غرف الدردشات العامة</h3>
                  <p className="text-[11px] text-white/50">بنات • الجزيرة • دارفور • كردفان</p>
                </div>
              </div>
              <div className="bg-[#00E676] text-black text-[12px] font-black px-4 py-2 rounded-full">ادخل</div>
            </div>
          </Link>

          <div className="sticky top-[88px] z-[20] bg-[#0B1418]/80 backdrop-blur-xl px-0 lg:px-4 py-2 mt-3">
            <div className="bg-[#122025] lg:rounded-2xl border-y lg:border border-[#1A2E35] shadow-[0_8px_24px_rgba(0,0,0,0.5)]">
              <CreatePost currentUser={currentUser} />
            </div>
          </div>

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
      </div>
    </div>
  )
}