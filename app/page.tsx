"use client"
import { useState, useEffect, useRef } from "react";
import { db, auth } from "./lib/firebase";
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, doc, getDoc, updateDoc, arrayUnion, arrayRemove, increment, where } from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { Home, Heart, MessageCircle, Share2, MoreHorizontal, Crown, ShieldCheck, Star, CheckCircle2, Image as ImageIcon, Video as VideoIcon, Send, Bell, MessageSquare, LogOut, X, Verified, Gem } from "lucide-react";

const timeAgo = (ts:any) => {
  if(!ts?.seconds) return "الآن";
  const s = Math.floor((Date.now() - ts.seconds*1000)/1000);
  if(s < 60) return "الآن";
  if(s < 3600) return `${Math.floor(s/60)} د`;
  if(s < 86400) return `${Math.floor(s/3600)} س`;
  if(s < 604800) return `${Math.floor(s/86400)} ي`;
  return new Date(ts.seconds*1000).toLocaleDateString('ar-EG');
};

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

function CommentsList({ postId, currentUser }: { postId: string, currentUser:any }) {
  const [comments, setComments] = useState<any[]>([]);
  const router = useRouter();
  useEffect(() => {
    const q = query(collection(db, 'posts', postId, 'comments'), orderBy('created_at', 'asc'));
    const unsub = onSnapshot(q, (snap) => {
      setComments(snap.docs.map(d => ({ id: d.id,...d.data() })));
    });
    return () => unsub();
  }, [postId]);

  return (
    <div className="space-y-2 mt-3">
      {comments.map((c:any)=>(
        <div key={c.id} className="flex gap-2 bg-white/[0.03] border border-white/5 p-2.5 rounded-xl">
          <img
            src={c.authorAvatar}
            onClick={()=>router.push(`/profile/${c.uid || c.authorId}`)}
            className="w-7 h-7 rounded-full cursor-pointer hover:brightness-125"
          />
          <div className="flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <p className={`text-xs font-bold cursor-pointer ${getNameColor(c.authorRole||'')}`} onClick={()=>router.push(`/profile/${c.uid || c.authorId}`)}>{c.authorName}</p>
              {c.authorRole && <RoleBadge role={c.authorRole}/>}
              <p className="text-[10px] text-white/30">{timeAgo(c.created_at)}</p>
            </div>
            <p className="text-[13px] text-white/80 mt-0.5">{c.text}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function PostateeApp() {
  const [text, setText] = useState("");
  const [posts, setPosts] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState<{[key:string]:string}>({});
  const [openComments, setOpenComments] = useState<{[key:string]:boolean}>({});
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotif, setShowNotif] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) { router.push('/login'); return; }
      const snap = await getDoc(doc(db, 'users', u.uid));
      if (snap.exists()) {
        const data = snap.data();
        if (!data.profileCompleted) { router.push('/profile/setup'); return; }
        setCurrentUser({...data, uid: u.uid });
        await updateDoc(doc(db, 'users', u.uid), { isOnline: true, lastSeen: serverTimestamp() });
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

  useEffect(() => {
    if(!currentUser?.uid) return;
    const q = query(collection(db, "notifications"), where("toUid","==",currentUser.uid), orderBy("created_at","desc"));
    const unsub = onSnapshot(q, (snap)=>{
      setNotifications(snap.docs.map(d=>({id:d.id,...d.data()})));
    });
    return () => unsub();
  }, [currentUser]);

  useEffect(()=>{
    const handleClick = (e:any)=>{ if(notifRef.current &&!notifRef.current.contains(e.target)) setShowNotif(false); };
    document.addEventListener('mousedown', handleClick);
    return ()=> document.removeEventListener('mousedown', handleClick);
  },[]);

  const handlePost = async (type = "text") => {
    if (!text.trim() && type==="text") return;
    let content = text;
    let image = null;
    if(type==="image") image = "https://picsum.photos/600/400?random=" + Math.floor(Math.random()*100);
    if(type==="video") content = text + " 🎥 فيديو جديد";
    await addDoc(collection(db, "posts"), {
      content, image, created_at: serverTimestamp(),
      uid: auth.currentUser?.uid, authorId: auth.currentUser?.uid,
      authorName: currentUser?.displayName, authorUsername: currentUser?.username,
      authorAvatar: currentUser?.avatar || "", authorRole: currentUser?.role || "",
      likes: [], likesCount: 0, commentsCount: 0
    });
    setText("");
  };

  const handleLike = async (post:any) => {
    const ref = doc(db, 'posts', post.id);
    const liked = post.likes?.includes(currentUser.uid);
    if(liked) await updateDoc(ref, { likes: arrayRemove(currentUser.uid), likesCount: increment(-1) });
    else {
      await updateDoc(ref, { likes: arrayUnion(currentUser.uid), likesCount: increment(1) });
      if(post.authorId!== currentUser.uid){
        await addDoc(collection(db, "notifications"), {
          toUid: post.authorId || post.uid, fromUid: currentUser.uid, fromName: currentUser.displayName,
          fromAvatar: currentUser.avatar, type: "like", postId: post.id, postContent: post.content?.slice(0,50),
          read: false, created_at: serverTimestamp()
        });
      }
    }
  };

  const handleComment = async (postId:string) => {
    const txt = commentText[postId]; if(!txt?.trim()) return;
    // هنا التعديل المهم - حفظ الرتبة مع التعليق
    await addDoc(collection(db, 'posts', postId, 'comments'), {
      text: txt, created_at: serverTimestamp(),
      uid: currentUser.uid, authorId: currentUser.uid,
      authorName: currentUser.displayName,
      authorAvatar: currentUser.avatar,
      authorRole: currentUser.role || "",
      authorUsername: currentUser.username
    });
    await updateDoc(doc(db, 'posts', postId), { commentsCount: increment(1) });
    setCommentText({...commentText, [postId]:""});
    const post = posts.find(p=>p.id===postId);
    if(post && (post.authorId||post.uid)!== currentUser.uid){
      await addDoc(collection(db, "notifications"), {
        toUid: post.authorId || post.uid, fromUid: currentUser.uid, fromName: currentUser.displayName,
        fromAvatar: currentUser.avatar, type: "comment", postId: postId, postContent: txt.slice(0,50),
        read: false, created_at: serverTimestamp()
      });
    }
  };

  const handleNotifClick = async (n:any) => {
    await updateDoc(doc(db, "notifications", n.id), { read: true });
    setShowNotif(false);
    const el = document.getElementById(`post-${n.postId}`);
    if(el){ el.scrollIntoView({behavior:"smooth", block:"center"}); el.classList.add("ring-2","ring-cyan-400"); setTimeout(()=>el.classList.remove("ring-2","ring-cyan-400"),2000); setOpenComments(prev=>({...prev,[n.postId]:true})); }
  };

  const markAllRead = async () => {
    for(const n of notifications.filter(n=>!n.read)) await updateDoc(doc(db,"notifications",n.id),{read:true});
  };

  const handleShare = async (post:any) => {
    const url = `${window.location.origin}/profile/${post.authorId||post.uid}`;
    if(navigator.share){ try{ await navigator.share({title: post.authorName, text: post.content, url}); } catch{} }
    else { await navigator.clipboard.writeText(post.content + " - " + url); alert("تم نسخ رابط المنشور ✓"); }
  };

  const handleLogout = async () => {
    try{ await updateDoc(doc(db,'users',currentUser.uid),{isOnline:false, lastSeen:serverTimestamp()}); }catch{}
    await signOut(auth); router.push('/login');
  };

  if (loading) return <div className="min-h-screen bg-[#050a0a] flex items-center justify-center text-cyan-400">جاري التحميل...</div>;
  const unreadCount = notifications.filter(n=>!n.read).length;

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&display=swap'); *{font-family:'Tajawal',sans-serif!important;}`}</style>
      <div className="min-h-screen bg-[#050a0a] text-white" dir="rtl">
        <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/10 px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2"><img src="/logo.png" className="w-9 h-9 rounded-xl bg-white/5 p-1 border border-cyan-400/20"/><span className="font-black text-xl">Postatee</span></div>
          <div className="flex items-center gap-3">
            <Home className="w-5 h-5 text-cyan-400"/>
            <div className="relative" ref={notifRef}>
              <button onClick={()=>setShowNotif(!showNotif)} className="relative w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                <Bell className="w-5 h-5 text-white/70"/>
                {unreadCount>0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center">{unreadCount}</span>}
              </button>
              {showNotif && (
                <div className="absolute left-0 mt-2 w-[340px] max-h-[420px] overflow-y-auto bg-[#0a1212] border border-white/10 rounded-2xl shadow-2xl z-50">
                  <div className="flex justify-between items-center p-3 border-b border-white/5 sticky top-0 bg-[#0a1212]">
                    <span className="font-bold text-sm">الإشعارات</span>
                    <div className="flex gap-2">
                      {unreadCount>0 && <button onClick={markAllRead} className="text-[11px] text-cyan-400">تعليم كمقروءة</button>}
                      <button onClick={()=>setShowNotif(false)}><X className="w-4 h-4 text-white/40"/></button>
                    </div>
                  </div>
                  {notifications.length===0 && <div className="p-8 text-center text-white/30 text-sm">لا توجد إشعارات</div>}
                  {notifications.map(n=>(
                    <div key={n.id} onClick={()=>handleNotifClick(n)} className={`flex gap-3 p-3 hover:bg-white/[0.04] cursor-pointer border-b border-white/[0.03] ${!n.read?'bg-cyan-400/[0.05]':''}`}>
                      <img src={n.fromAvatar} className="w-9 h-9 rounded-full"/>
                      <div className="flex-1">
                        <p className="text-[13px] leading-4"><span className="font-bold">{n.fromName}</span> {n.type==='like'? 'أعجب بمنشورك':'علق على منشورك'} <span className="text-white/50">"{n.postContent}"</span></p>
                        <p className="text-[11px] text-white/30 mt-1">{timeAgo(n.created_at)} {n.type==='like'? '❤️':'💬'}</p>
                      </div>
                      {!n.read && <div className="w-2 h-2 bg-cyan-400 rounded-full mt-2"/>}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <MessageSquare className="w-5 h-5 text-white/60"/>
            <img src={currentUser?.avatar || `https://i.pravatar.cc/100?u=${currentUser?.username}`} onClick={()=>router.push(`/profile/${currentUser?.uid}`)} className="w-8 h-8 rounded-full border border-cyan-400/30 cursor-pointer hover:opacity-80" title="حائطي"/>
            <button onClick={handleLogout} className="w-8 h-8 rounded-full bg-white/5 hover:bg-red-500/20 border border-white/10 flex items-center justify-center text-white/70 hover:text-red-400"><LogOut className="w-4 h-4"/></button>
          </div>
        </header>

        <div className="max-w-[600px] mx-auto p-3 space-y-3">
          <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-3">
            <div className="flex gap-3">
              <img src={currentUser?.avatar || `https://i.pravatar.cc/100?u=${currentUser?.username}`} onClick={()=>router.push(`/profile/${currentUser?.uid}`)} className="w-10 h-10 rounded-full cursor-pointer"/>
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

          {posts.map((post:any)=>(
            <div id={`post-${post.id}`} key={post.id} className="bg-white/[0.04] border border-white/10 rounded-2xl p-4 transition-all">
              <div className="flex justify-between">
                <div className="flex gap-3">
                  <img src={post.authorAvatar || `https://i.pravatar.cc/100?u=${post.uid}`} onClick={()=>router.push(`/profile/${post.authorId || post.uid}`)} className="w-10 h-10 rounded-full border border-cyan-400/20 cursor-pointer hover:brightness-110 transition"/>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`font-bold text-sm cursor-pointer ${getNameColor(post.authorRole || (post.authorUsername==='postatee'?'مالك':''))}`} onClick={()=>router.push(`/profile/${post.authorId || post.uid}`)}>{post.authorName}</span>
                      <RoleBadge role={post.authorRole || (post.authorUsername==='postatee'?'مالك':'')}/>
                    </div>
                    <span className="text-xs text-white/40">{timeAgo(post.created_at)}</span>
                  </div>
                </div>
                <MoreHorizontal className="w-5 h-5 text-white/30"/>
              </div>
              <p className="mt-3 text-[15px] whitespace-pre-wrap">{post.content}</p>
              {post.image && <img src={post.image} className="mt-3 rounded-xl w-full"/>}
              <div className="flex justify-between mt-4 pt-3 border-t border-white/5">
                <button onClick={()=>handleLike(post)} className={`flex gap-1.5 text-sm items-center ${post.likes?.includes(currentUser?.uid)?'text-red-500':'text-white/50'}`}><Heart className={`w-5 h-5 ${post.likes?.includes(currentUser?.uid)?'fill-red-500':''}`}/> {post.likesCount||0} أعجبني</button>
                <button onClick={()=>setOpenComments({...openComments, [post.id]:!openComments[post.id]})} className="flex gap-1.5 text-sm text-white/50 items-center"><MessageCircle className="w-5 h-5"/> {post.commentsCount||0} تعليق</button>
                <button onClick={()=>handleShare(post)} className="flex gap-1.5 text-sm text-white/50 items-center"><Share2 className="w-5 h-5"/> مشاركة</button>
              </div>
              {openComments[post.id] && (
                <div className="mt-3 border-t border-white/5 pt-3">
                  <div className="flex gap-2">
                    <img src={currentUser?.avatar} className="w-7 h-7 rounded-full"/>
                    <div className="flex-1 flex gap-2">
                      <input value={commentText[post.id]||""} onChange={e=>setCommentText({...commentText, [post.id]:e.target.value})} placeholder="اكتب تعليق..." className="flex-1 bg-white/5 border border-white/10 rounded-full px-3 py-1.5 text-sm outline-none"/>
                      <button onClick={()=>handleComment(post.id)} className="bg-cyan-400 text-black rounded-full w-8 h-8 flex items-center justify-center"><Send className="w-4 h-4"/></button>
                    </div>
                  </div>
                  <CommentsList postId={post.id} currentUser={currentUser}/>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}