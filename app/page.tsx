"use client"
import { useState, useEffect, useRef } from "react";
import { db, auth } from "./lib/firebase";
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, doc, getDoc, updateDoc, arrayUnion, arrayRemove, increment, where, deleteDoc } from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { Home, Heart, MessageCircle, Share2, MoreHorizontal, Crown, Star, Image as ImageIcon, Video as VideoIcon, Send, Bell, MessageSquare, LogOut, X, Verified, Gem, Smile, Trash2, Edit3, EyeOff, Copy, Flag } from "lucide-react";

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

const feelingsList = [
  { id:"happy", label:"سعيد", icon:"😊" }, { id:"love", label:"يقع في الحب", icon:"😍" },
  { id:"excited", label:"متحمس", icon:"🔥" }, { id:"sad", label:"حزين", icon:"😔" },
  { id:"angry", label:"غاضب", icon:"😡" }, { id:"thinking", label:"يفكر", icon:"🤔" },
  { id:"sleepy", label:"نعسان", icon:"😴" }, { id:"blessed", label:"ممتن", icon:"🙏" },
  { id:"celebrate", label:"يحتفل", icon:"🎉" }, { id:"cool", label:"رائع", icon:"😎" },
];

function useLiveUser(uid: string) {
  const [user, setUser] = useState<any>(null);
  useEffect(() => {
    if(!uid) return;
    const unsub = onSnapshot(doc(db, 'users', uid), (snap) => { if(snap.exists()) setUser(snap.data()); });
    return () => unsub();
  }, [uid]);
  return user;
}
function LiveAuthor({ uid, fallbackName, fallbackRole, fallbackAvatar, size = "post" }: any) {
  const liveUser = useLiveUser(uid);
  const router = useRouter();
  const displayName = liveUser?.displayName || fallbackName;
  const role = liveUser?.role || fallbackRole || "";
  const avatar = liveUser?.avatar || fallbackAvatar;
  const isPost = size === "post";
  return (
    <>
      <img src={avatar || `https://i.pravatar.cc/100?u=${uid}`} onClick={()=>router.push(`/profile/${uid}`)} className={`${isPost? 'w-10 h-10' : 'w-7 h-7'} rounded-full border border-cyan-400/20 cursor-pointer`}/>
      <div className={isPost? "" : "flex-1"}>
        <div className="flex items-center gap-2">
          <span className={`font-bold ${isPost? 'text-sm' : 'text-xs'} cursor-pointer ${getNameColor(role)}`} onClick={()=>router.push(`/profile/${uid}`)}>{displayName}</span>
          <RoleBadge role={role}/>
        </div>
        {isPost && <span className="text-xs text-white/40">@{liveUser?.username || fallbackName}</span>}
      </div>
    </>
  );
}
function CommentsList({ postId }: any) {
  const [comments, setComments] = useState<any[]>([]);
  useEffect(() => {
    const q = query(collection(db, 'posts', postId, 'comments'), orderBy('created_at', 'asc'));
    const unsub = onSnapshot(q, (snap) => { setComments(snap.docs.map(d => ({ id: d.id,...d.data() }))); });
    return () => unsub();
  }, [postId]);
  return (
    <div className="space-y-2 mt-3">
      {comments.map((c:any)=>{
        const uid = c.uid || c.authorId;
        return (
          <div key={c.id} className="flex gap-2 bg-white/[0.03] border border-white/5 p-2.5 rounded-xl">
            <LiveAuthor uid={uid} fallbackName={c.authorName} fallbackRole={c.authorRole} fallbackAvatar={c.authorAvatar} size="comment" />
            <div className="flex-1 -mt-1">
              <p className="text-[10px] text-white/30">{timeAgo(c.created_at)}</p>
              <p className="text-[13px] text-white/80 mt-1">{c.text}</p>
            </div>
          </div>
        )
      })}
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
  const [media, setMedia] = useState<string|null>(null);
  const [mediaType, setMediaType] = useState<"image"|"video"|null>(null);
  const [feeling, setFeeling] = useState<any>(null);
  const [showFeelings, setShowFeelings] = useState(false);
  const [openMenu, setOpenMenu] = useState<string|null>(null);
  const [hiddenPosts, setHiddenPosts] = useState<string[]>([]);
  const [editingPost, setEditingPost] = useState<any>(null);
  const fileRef = useRef<HTMLInputElement>(null);
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
    const unsub = onSnapshot(q, (snap) => { setPosts(snap.docs.map(d => ({ id: d.id,...d.data() }))); });
    return () => unsub();
  }, []);

  useEffect(() => {
    if(!currentUser?.uid) return;
    const q = query(collection(db, "notifications"), where("toUid","==",currentUser.uid), orderBy("created_at","desc"));
    const unsub = onSnapshot(q, (snap)=>{ setNotifications(snap.docs.map(d=>({id:d.id,...d.data()}))); });
    return () => unsub();
  }, [currentUser]);

  const handleFile = (e:any)=>{
    const file = e.target.files[0]; if(!file) return;
    if(file.size > 15*1024*1024) return alert("الملف كبير، اختار أقل من 15MB");
    const isVideo = file.type.startsWith("video/");
    const reader = new FileReader();
    reader.onload = (ev)=>{ setMedia(ev.target?.result as string); setMediaType(isVideo?"video":"image"); };
    reader.readAsDataURL(file);
  };

  const handlePost = async () => {
    if (!text.trim() &&!media) return;
    await addDoc(collection(db, "posts"), {
      content:text, image: mediaType==="image"?media:null, video: mediaType==="video"?media:null,
      feeling: feeling, created_at: serverTimestamp(),
      uid: auth.currentUser?.uid, authorId: auth.currentUser?.uid,
      authorName: currentUser?.displayName, authorUsername: currentUser?.username,
      authorAvatar: currentUser?.avatar || "", authorRole: currentUser?.role || "",
      likes: [], likesCount: 0, commentsCount: 0
    });
    setText(""); setMedia(null); setMediaType(null); setFeeling(null); setShowFeelings(false);
  };

  const handleLike = async (post:any) => {
    const ref = doc(db, 'posts', post.id);
    const liked = post.likes?.includes(currentUser.uid);
    if(liked) await updateDoc(ref, { likes: arrayRemove(currentUser.uid), likesCount: increment(-1) });
    else {
      await updateDoc(ref, { likes: arrayUnion(currentUser.uid), likesCount: increment(1) });
      if((post.authorId||post.uid)!== currentUser.uid){
        await addDoc(collection(db, "notifications"), { toUid: post.authorId || post.uid, fromUid: currentUser.uid, fromName: currentUser.displayName, fromAvatar: currentUser.avatar, type: "like", postId: post.id, postContent: post.content?.slice(0,50), read: false, created_at: serverTimestamp() });
      }
    }
  };
  const handleComment = async (postId:string) => {
    const txt = commentText[postId]; if(!txt?.trim()) return;
    await addDoc(collection(db, 'posts', postId, 'comments'), { text: txt, created_at: serverTimestamp(), uid: currentUser.uid, authorId: currentUser.uid, authorName: currentUser.displayName, authorAvatar: currentUser.avatar, authorRole: currentUser.role || "", authorUsername: currentUser.username });
    await updateDoc(doc(db, 'posts', postId), { commentsCount: increment(1) });
    setCommentText({...commentText, [postId]:""});
  };
  const handleDelete = async (postId:string)=>{ if(!confirm("تحذف المنشور؟")) return; await deleteDoc(doc(db,'posts',postId)); setOpenMenu(null); };
  const handleCopy = (content:string)=>{ navigator.clipboard.writeText(content); alert("تم النسخ ✓"); setOpenMenu(null); };
  const handleHide = (id:string)=>{ setHiddenPosts([...hiddenPosts,id]); setOpenMenu(null); };
  const handleEditSave = async()=>{ if(!editingPost) return; await updateDoc(doc(db,'posts',editingPost.id),{content:editingPost.content}); setEditingPost(null); setOpenMenu(null); };

  if (loading) return <div className="min-h-screen bg-[#050a0a] flex items-center justify-center text-cyan-400">جاري التحميل...</div>;

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&display=swap'); *{font-family:'Tajawal',sans-serif!important;}`}</style>
      <div className="min-h-screen bg-[#050a0a] text-white" dir="rtl">
        <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/10 px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2"><span className="font-black text-xl">Postatee</span></div>
          <div className="flex items-center gap-3">
            <div className="relative" ref={notifRef}>
              <button onClick={()=>setShowNotif(!showNotif)} className="relative w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center"><Bell className="w-5 h-5"/><span className="absolute -top-1 -right-1 bg-red-500 text-[10px] w-5 h-5 rounded-full flex items-center justify-center">{notifications.filter(n=>!n.read).length}</span></button>
            </div>
            <img src={currentUser?.avatar} onClick={()=>router.push(`/profile/${currentUser?.uid}`)} className="w-8 h-8 rounded-full border border-cyan-400/30 cursor-pointer"/>
            <button onClick={async()=>{await signOut(auth); router.push('/login');}} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center"><LogOut className="w-4 h-4"/></button>
          </div>
        </header>

        <div className="max-w-[600px] mx-auto p-3 space-y-3">
          {/* CREATE POST - NEW */}
          <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-3">
            <div className="flex gap-3">
              <img src={currentUser?.avatar} className="w-10 h-10 rounded-full"/>
              <div className="flex-1">
                <input value={text} onChange={e=>setText(e.target.value)} placeholder={`بماذا تفكر يا ${currentUser?.displayName}? ${feeling? `— ${feeling.icon} ${feeling.label}`:''}`} className="w-full bg-white/5 border border-white/10 rounded-full px-4 py-2.5 text-sm outline-none"/>
                {feeling && <div className="mt-2 text-xs bg-yellow-400/10 border border-yellow-400/20 text-yellow-300 px-3 py-1 rounded-full inline-flex gap-1">{feeling.icon} يشعر بـ {feeling.label} <button onClick={()=>setFeeling(null)}><X className="w-3 h-3"/></button></div>}
              </div>
            </div>

            {media && (
              <div className="relative mt-3 rounded-xl overflow-hidden border border-white/10">
                {mediaType==="image"? <img src={media} className="w-full max-h-[400px] object-cover"/> : <video src={media} controls className="w-full max-h-[400px]"/>}
                <button onClick={()=>{setMedia(null); setMediaType(null);}} className="absolute top-2 left-2 bg-black/70 p-1.5 rounded-full"><X className="w-4 h-4"/></button>
              </div>
            )}

            <div className="flex justify-between mt-3 pt-3 border-t border-white/5">
              <div className="flex gap-4 items-center">
                <button onClick={()=>{fileRef.current!.accept="image/*"; fileRef.current?.click();}} className="flex items-center gap-1.5 text-sm text-green-400 font-bold"><ImageIcon className="w-5 h-5"/> صورة</button>
                <button onClick={()=>{fileRef.current!.accept="video/*"; fileRef.current?.click();}} className="flex items-center gap-1.5 text-sm text-red-400 font-bold"><VideoIcon className="w-5 h-5"/> فيديو</button>
                <button onClick={()=>setShowFeelings(!showFeelings)} className="flex items-center gap-1.5 text-sm text-yellow-400 font-bold"><Smile className="w-5 h-5"/> شعور</button>
                <input ref={fileRef} type="file" hidden onChange={handleFile}/>
              </div>
              <button onClick={handlePost} className="bg-cyan-400 text-black font-black px-6 py-1.5 rounded-full flex items-center gap-1"><Send className="w-4 h-4"/> نشر</button>
            </div>

            {showFeelings && (
              <div className="mt-3 grid grid-cols-3 gap-2 bg-black/60 border border-white/10 p-3 rounded-2xl">
                {feelingsList.map(f=>(
                  <button key={f.id} onClick={()=>{setFeeling(f); setShowFeelings(false);}} className="flex items-center gap-2 p-2 rounded-xl hover:bg-white/10 text-sm">
                    <span className="text-xl">{f.icon}</span> {f.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {posts.filter(p=>!hiddenPosts.includes(p.id)).map((post:any)=>{
            const uid = post.authorId || post.uid;
            const isMine = uid===currentUser.uid;
            return (
            <div key={post.id} className="bg-white/[0.04] border border-white/10 rounded-2xl p-4">
              <div className="flex justify-between relative">
                <div className="flex gap-3 items-center">
                  <LiveAuthor uid={uid} fallbackName={post.authorName} fallbackRole={post.authorRole} fallbackAvatar={post.authorAvatar} size="post" />
                  {post.feeling && <span className="text-xs text-white/50 mr-1">— {post.feeling.icon} يشعر بـ {post.feeling.label}</span>}
                </div>
                <button onClick={()=>setOpenMenu(openMenu===post.id?null:post.id)} className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center"><MoreHorizontal className="w-5 h-5 text-white/40"/></button>
                {openMenu===post.id && (
                  <div className="absolute left-0 top-10 w-48 bg-[#101a1a] border border-white/10 rounded-xl shadow-2xl z-20 overflow-hidden">
                    <button onClick={()=>handleCopy(post.content)} className="w-full text-right px-4 py-2.5 text-sm hover:bg-white/5 flex gap-2 items-center"><Copy className="w-4 h-4"/> نسخ النص</button>
                    <button onClick={()=>handleHide(post.id)} className="w-full text-right px-4 py-2.5 text-sm hover:bg-white/5 flex gap-2 items-center"><EyeOff className="w-4 h-4"/> إخفاء المنشور</button>
                    <button className="w-full text-right px-4 py-2.5 text-sm hover:bg-white/5 flex gap-2 items-center"><Flag className="w-4 h-4"/> إبلاغ</button>
                    {isMine && <>
                      <div className="h-[1px] bg-white/10 my-1"/>
                      <button onClick={()=>setEditingPost({...post})} className="w-full text-right px-4 py-2.5 text-sm hover:bg-white/5 flex gap-2 items-center"><Edit3 className="w-4 h-4"/> تعديل المنشور</button>
                      <button onClick={()=>handleDelete(post.id)} className="w-full text-right px-4 py-2.5 text-sm hover:bg-red-500/10 text-red-400 flex gap-2 items-center"><Trash2 className="w-4 h-4"/> حذف المنشور</button>
                    </>}
                  </div>
                )}
              </div>

              {editingPost?.id===post.id? (
                <div className="mt-3">
                  <textarea value={editingPost.content} onChange={e=>setEditingPost({...editingPost, content:e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm outline-none min-h-[80px]"/>
                  <div className="flex gap-2 mt-2"><button onClick={handleEditSave} className="bg-cyan-400 text-black px-4 py-1.5 rounded-full text-sm font-bold">حفظ</button><button onClick={()=>setEditingPost(null)} className="bg-white/10 px-4 py-1.5 rounded-full text-sm">إلغاء</button></div>
                </div>
              ) : <p className="mt-3 text-[15px] whitespace-pre-wrap">{post.content}</p>}

              {post.image && <img src={post.image} className="mt-3 rounded-xl w-full"/>}
              {post.video && <video src={post.video} controls className="mt-3 rounded-xl w-full max-h-[500px] bg-black"/>}

              <div className="flex justify-between mt-4 pt-3 border-t border-white/5">
                <button onClick={()=>handleLike(post)} className={`flex gap-1.5 text-sm items-center ${post.likes?.includes(currentUser?.uid)?'text-red-500':'text-white/50'}`}><Heart className={`w-5 h-5 ${post.likes?.includes(currentUser?.uid)?'fill-red-500':''}`}/> {post.likesCount||0}</button>
                <button onClick={()=>setOpenComments({...openComments, [post.id]:!openComments[post.id]})} className="flex gap-1.5 text-sm text-white/50"><MessageCircle className="w-5 h-5"/> {post.commentsCount||0} تعليق</button>
                <button onClick={()=>{navigator.clipboard.writeText(post.content); alert("تم النسخ");}} className="flex gap-1.5 text-sm text-white/50"><Share2 className="w-5 h-5"/> مشاركة</button>
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
                  <CommentsList postId={post.id}/>
                </div>
              )}
            </div>
          )})}
        </div>
      </div>
    </>
  );
}