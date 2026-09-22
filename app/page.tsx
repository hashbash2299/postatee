"use client"
import { useState, useEffect } from "react";
import { db, auth } from "./lib/firebase";
import { collection, query, orderBy, onSnapshot, doc, getDoc, updateDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import CreatePost from "../components/feed/CreatePost";
import PostCard from "../components/feed/PostCard";
import Navbar from "../components/layout/Navbar";
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
      const snap = await getDoc(doc(db, 'users', u.uid));
      if (snap.exists()) {
        const data = snap.data();
        if (!data.profileCompleted) { router.push('/profile/setup'); return; }
        setCurrentUser({...data, uid: u.uid });
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

  if (loading) return <div className="min-h-screen bg-[#050a0a] flex items-center justify-center text-violet-400">جاري التحميل...</div>;

  return (
    <div className="min-h-screen bg-[#050a0a] text-white" dir="rtl">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&display=swap'); *{font-family:'Tajawal',sans-serif!important;}.scrollbar-hide::-webkit-scrollbar{display:none}`}</style>

      <Navbar currentUser={currentUser} setOpenComments={setOpenComments} />

      <div className="max-w-[600px] mx-auto p-3 space-y-3">
        <Stories currentUser={currentUser} />
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
          />
        ))}
      </div>
    </div>
  )
}