"use client"
import { useState, useEffect } from "react";
import { db, auth } from "./lib/firebase";
import { collection, query, orderBy, onSnapshot, doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import CreatePost from "../components/feed/CreatePost";
import PostCard from "../components/feed/PostCard";
import { collection as col, addDoc, orderBy as ob } from "firebase/firestore";

// CommentsList هنا مؤقتاً لحد ما نفصلو
function CommentsList({ postId }: any) {
  const [comments, setComments] = useState<any[]>([]);
  useEffect(() => {
    const q = query(collection(db, 'posts', postId, 'comments'), ob('created_at', 'asc'));
    const unsub = onSnapshot(q, (snap) => { setComments(snap.docs.map(d => ({ id: d.id,...d.data() }))); });
    return () => unsub();
  }, [postId]);
  return <div className="space-y-2 mt-3">{comments.map((c:any)=><div key={c.id} className="bg-white/[0.03] p-2 rounded-xl text-sm">{c.authorName}: {c.text}</div>)}</div>
}

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
      const snap = await getDoc(doc(db, 'users', u.uid));
      if (snap.exists()) { const data = snap.data(); if (!data.profileCompleted) { router.push('/profile/setup'); return; } setCurrentUser({...data, uid: u.uid }); }
      setLoading(false);
    });
    return () => unsub();
  }, [router]);

  useEffect(() => {
    const q = query(collection(db, "posts"), orderBy("created_at", "desc"));
    const unsub = onSnapshot(q, (snap) => { setPosts(snap.docs.map(d => ({ id: d.id,...d.data() }))); });
    return () => unsub();
  }, []);

  if (loading) return <div className="min-h-screen bg-[#050a0a] flex items-center justify-center text-cyan-400">جاري التحميل...</div>;

  return (
    <div className="min-h-screen bg-[#050a0a] text-white" dir="rtl">
      <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/10 px-4 py-2.5 flex justify-between"><span className="font-black">Postatee</span><button onClick={async()=>{await signOut(auth); router.push('/login');}} className="text-xs bg-white/10 px-3 py-1 rounded-full">خروج</button></header>
      <div className="max-w-[600px] mx-auto p-3 space-y-3">
        <CreatePost currentUser={currentUser} />
        {posts.filter(p=>!hiddenPosts.includes(p.id)).map(post=>(
          <PostCard key={post.id} post={post} currentUser={currentUser}
            onHide={()=>setHiddenPosts([...hiddenPosts, post.id])}
            onStartEdit={(p:any)=>{ setEditingPost(p); setEditingContent(p.content); }}
            isEditing={editingPost?.id===post.id}
            editingContent={editingContent}
            setEditingContent={setEditingContent}
            onSaveEdit={async()=>{ await updateDoc(doc(db,'posts',editingPost.id),{content:editingContent}); setEditingPost(null); }}
            onCancelEdit={()=>setEditingPost(null)}
            commentText={commentText} setCommentText={setCommentText}
            openComments={openComments} setOpenComments={setOpenComments}
            CommentsList={CommentsList}
          />
        ))}
      </div>
    </div>
  )
}