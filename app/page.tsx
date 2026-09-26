"use client"
import { useState, useEffect } from "react";
import { db, auth } from "./lib/firebase";
import { collection, onSnapshot, doc, getDoc, updateDoc, setDoc, where, query } from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Users, LogOut, Bell, MessageCircle, Video, Sparkles, X, Circle } from "lucide-react";
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
  const [notifCount, setNotifCount] = useState(0);
  const [msgCount, setMsgCount] = useState(0);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [showMobileContacts, setShowMobileContacts] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    try {
      const u = auth.currentUser;
      if (u) { await updateDoc(doc(db, 'users', u.uid), { isOnline: false }).catch(()=>{}); }
      await signOut(auth);
      router.push('/login');
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    let unsubReq: any = null;
    let unsubNotif: any = null;
    let unsubMsg: any = null;
    const unsub = onAuthStateChanged(auth, async (u) => {
      try {
        if (!u) { router.push('/login'); return; }
        const userRef = doc(db, 'users', u.uid);
        let snap = await getDoc(userRef);
        if (!snap.exists()) {
          await setDoc(userRef, { uid: u.uid, email: u.email, displayName: u.displayName || 'محمد أحمد', username: 'mohammed_' + u.uid.slice(0,5), role: 'مالك', profileCompleted: true, followers: 0, following: 0, photoURL: u.photoURL || null, createdAt: new Date() }, { merge: true });
          snap = await getDoc(userRef);
        }
        setCurrentUser({...snap.data(), uid: u.uid });
        unsubReq = onSnapshot(query(collection(db,'friendRequests'), where('to','==', u.uid), where('status','==','pending')), s=> setReqCount(s.size));
        unsubNotif = onSnapshot(query(collection(db,'notifications'), where('toUid','==', u.uid)), s=> setNotifCount(s.docs.filter(d=> d.data().read === false).length));
        unsubMsg = onSnapshot(query(collection(db,'chats'), where('members','array-contains', u.uid)), s=> setMsgCount(s.size));
      } finally { setLoading(false); }
    });
    return () => { unsub(); if(unsubReq) unsubReq(); if(unsubNotif) unsubNotif(); if(unsubMsg) unsubMsg(); }
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
      const data = snap.docs.map(d => ({ id: d.id,...d.data() }));
      setAllUsers(data);
    });
    return () => unsub();
  }, []);

  const onlineUsers = allUsers.filter((u:any) => u.isOnline);
  const offlineUsers = allUsers.filter((u:any) =>!u.isOnline);

  if (loading) return <div className="min-h-screen bg-[#0B1418] flex items-center justify-center text-cyan-400 fb-font">جاري التحميل...</div>;

  return (
    <div className="min-h-screen bg-[#0B1418] text-white overflow-x-hidden" dir="rtl">
      <TickerBar />
      <style>{`
      img{max-width:100%}
      @media(min-width:1024px){.desktop-header{display:flex!important}.mobile-header{display:none!important} }
      @media(max-width:1023px){.desktop-header{display:none!important}.mobile-header{display:flex!important} }
      `}</style>

      <header className="desktop-header items-center justify-between px-6 py-3 bg-[#122025] border-b border-[#1A2E35] max-w-[1600px] mx-auto w-full" style={{display:'flex'}}>
        <div className="flex items-center gap-4">
          <Link href={`/profile/${currentUser?.uid}`} className="flex items-center gap-2"><img src={currentUser?.photoURL || currentUser?.avatar || `https://i.pravatar.cc/100?img=15`} className="w-10 h-10 rounded-full border-2 border-[#00E5FF] object-cover"/><span className="font-bold text-sm fb-font">{currentUser?.displayName}</span></Link>
          <Link href="/friends" className="relative w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"><Users className="w-5 h-5"/>{reqCount>0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[11px] w-5 h-5 rounded-full flex items-center justify-center">{reqCount}</span>}</Link>
          <Link href="/messages" className="relative w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"><MessageCircle className="w-5 h-5"/>{msgCount>0 && <span className="absolute -top-1 -right-1 bg-[#00E5FF] text-black text-[11px] w-5 h-5 rounded-full flex items-center justify-center font-bold">{msgCount>9?'+9':msgCount}</span>}</Link>
          <Link href="/notifications" className="relative w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"><Bell className="w-5 h-5"/>{notifCount>0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[11px] w-5 h-5 rounded-full flex items-center justify-center animate-pulse">{notifCount}</span>}</Link>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleLogout} className="w-10 h-10 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center hover:bg-red-500/20"><LogOut className="w-5 h-5 text-red-400"/></button>
          <div><h1 className="font-black text-[22px] leading-none fb-font">Posta<span className="text-[#00E5FF]">tee</span></h1><p className="text-[9px] text-gray-400 fb-font">منصة سودانية</p></div><div className="w-10 h-10 bg-[#00E5FF] rounded-xl flex items-center justify-center text-black font-black">P</div>
        </div>
      </header>

      <header className="mobile-header items-center justify-between px-3 py-3 bg-[#122025] border-b border-[#1A2E35]" style={{display:'flex'}}>
        <div className="flex items-center gap-2">
          <Link href={`/profile/${currentUser?.uid}`}><img src={currentUser?.photoURL || currentUser?.avatar || `https://i.pravatar.cc/100?img=15`} className="w-9 h-9 rounded-full border-2 border-[#00E5FF] object-cover"/></Link>
          <Link href="/friends" className="relative w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"><Users className="w-4 h-4"/>{reqCount>0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">{reqCount}</span>}</Link>
          <Link href="/messages" className="relative w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"><MessageCircle className="w-4 h-4"/>{msgCount>0 && <span className="absolute -top-1 -right-1 bg-[#00E5FF] text-black text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold">{msgCount}</span>}</Link>
          <button onClick={()=>setShowMobileContacts(true)} className="relative w-8 h-8 rounded-full bg-[#00E5FF]/20 border border-[#00E5FF]/30 flex items-center justify-center"><Circle className="w-4 h-4 text-[#00E5FF] fill-[#00E5FF]" />{onlineUsers.length>0 && <span className="absolute -top-1 -right-1 bg-green-500 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold">{onlineUsers.length}</span>}</button>
          <button onClick={handleLogout} className="w-8 h-8 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center active:scale-90"><LogOut className="w-4 h-4 text-red-400"/></button>
        </div>
        <div className="flex items-center gap-2"><h1 className="font-black text-[18px] fb-font">Posta<span className="text-[#00E5FF]">tee</span></h1><div className="w-8 h-8 bg-[#00E5FF] rounded-lg flex items-center justify-center text-black font-black">P</div></div>
      </header>

      {/* Drawer الجوال */}
      {showMobileContacts && (
        <div className="fixed inset-0 z-[999] lg:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={()=>setShowMobileContacts(false)}></div>
          <div className="absolute right-0 top-0 h-full w-[85%] max-w-[340px] bg-[#122025] border-l border-[#1A2E35] p-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-lg fb-font">جهات الاتصال</h3>
              <button onClick={()=>setShowMobileContacts(false)} className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center"><X className="w-5 h-5"/></button>
            </div>

            <div className="mb-5">
              <p className="text-xs font-bold text-green-400 mb-2 fb-font">● متصلون الآن ({onlineUsers.length})</p>
              <div className="flex flex-col gap-1">
                {onlineUsers.map((u:any)=>(
                  <Link href={`/profile/${u.uid || u.id}`} key={u.id} onClick={()=>setShowMobileContacts(false)} className="flex items-center gap-3 p-2 rounded-xl bg-green-500/10 border border-green-500/20">
                    <div className="relative"><img src={u.photoURL || `https://i.pravatar.cc/100?u=${u.id}`} className="w-10 h-10 rounded-full object-cover"/><div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 border-2 border-[#122025]"></div></div>
                    <div><p className="text-sm font-bold fb-font">{u.displayName || u.email}</p><p className="text-[11px] text-green-400">متصل الآن</p></div>
                  </Link>
                ))}
                {onlineUsers.length===0 && <p className="text-white/40 text-xs">لا يوجد متصلين</p>}
              </div>
            </div>

            <div>
              <p className="text-xs font-bold text-white/60 mb-2 fb-font">○ غير متصلين / جدد ({offlineUsers.length})</p>
              <div className="flex flex-col gap-1">
                {offlineUsers.map((u:any)=>(
                  <Link href={`/profile/${u.uid || u.id}`} key={u.id} onClick={()=>setShowMobileContacts(false)} className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/10">
                    <div className="relative"><img src={u.photoURL || `https://i.pravatar.cc/100?u=${u.id}`} className="w-10 h-10 rounded-full object-cover grayscale"/><div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-gray-500 border-2 border-[#122025]"></div></div>
                    <div><p className="text-sm font-bold fb-font">{u.displayName || u.email}</p><p className="text-[11px] text-white/50">سجل جديد</p></div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex max-w-[1600px] mx-auto">
        <aside className="hidden lg:flex w-[300px] bg-[#122025] flex-col p-4 border-l border-[#1A2E35] h-[calc(100vh-65px)] sticky top-0 overflow-y-auto">
          <h3 className="font-bold mb-4 fb-font">جهات الاتصال ({allUsers.length})</h3>
          <div className="mb-4">
            <p className="text-[11px] font-bold text-green-400 mb-2">● متصلون ({onlineUsers.length})</p>
            <div className="flex flex-col gap-1">
              {onlineUsers.map((u:any) => (
                <Link href={`/profile/${u.uid || u.id}`} key={u.id} className="flex items-center gap-3 p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-all border border-green-500/10">
                  <div className="relative"><img src={u.photoURL || `https://i.pravatar.cc/100?u=${u.id}`} className="w-9 h-9 rounded-full object-cover" alt="" /><div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 border-2 border-[#122025]"></div></div>
                  <div className="flex-1 min-w-0"><p className="text-sm font-bold fb-font truncate">{u.displayName || u.email}</p><p className="text-[11px] text-green-400 truncate">متصل الآن</p></div>
                </Link>
              ))}
            </div>
          </div>
          <div>
            <p className="text-[11px] font-bold text-white/40 mb-2">○ البقية</p>
            <div className="flex flex-col gap-1">
              {offlineUsers.map((u:any) => (
                <Link href={`/profile/${u.uid || u.id}`} key={u.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/10 transition-all">
                  <div className="relative"><img src={u.photoURL || `https://i.pravatar.cc/100?u=${u.id}`} className="w-9 h-9 rounded-full object-cover" alt="" /><div className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#122025] bg-gray-500"></div></div>
                  <div className="flex-1 min-w-0"><p className="text-sm font-bold fb-font truncate">{u.displayName || u.email}</p><p className="text-[11px] text-white/50 truncate">غير متصل</p></div>
                </Link>
              ))}
            </div>
          </div>
        </aside>

        <main className="flex-1 max-w-[720px] mx-auto w-full pb-[80px] lg:pb-0 overflow-hidden">
          <div className="bg-[#122025] lg:rounded-2xl m-0 lg:m-4 p-4 border-b lg:border border-[#1A2E35] overflow-hidden"><Stories currentUser={currentUser} /></div>
          <div className="mx-4 mt-3">
            <Link href="/video-maker">
              <div className="bg-gradient-to-r from-[#FFD700] via-[#FFC700] to-[#FFB000] rounded-2xl p-[2px] cursor-pointer hover:scale-[1.01] transition-all">
                <div className="bg-[#1A2E35] rounded-[14px] p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-yellow-600 rounded-xl flex items-center justify-center shadow-lg"><Video className="w-6 h-6 text-black" /></div>
                    <div>
                      <h3 className="font-black text-[16px] text-white fb-font flex items-center gap-1">اصنع فيديو مجاناً <Sparkles className="w-4 h-4 text-amber-400" /></h3>
                      <p className="text-[12px] text-white/60 fb-font">دعوة فرح • تهنئة • تخرج • 15 ثانية</p>
                    </div>
                  </div>
                  <div className="bg-amber-400 text-black px-4 py-2 rounded-full font-black text-[13px] fb-font">جرب الآن</div>
                </div>
              </div>
            </Link>
          </div>
          <div className="bg-[#122025] lg:rounded-2xl m-4 mt-3 border border-[#1A2E35]"><CreatePost currentUser={currentUser} /></div>
          <div className="space-y-2 px-0 lg:px-4">{posts.filter(p=>!hiddenPosts.includes(p.id)).map(post=>(<div key={post.id} className="bg-[#122025] lg:rounded-2xl border-y lg:border border-[#1A2E35] overflow-hidden"><PostCard post={post} currentUser={currentUser} onHide={()=>setHiddenPosts([...hiddenPosts, post.id])} onStartEdit={(p:any)=>{ setEditingPost(p); setEditingContent(p.content); }} isEditing={editingPost?.id===post.id} editingContent={editingContent} setEditingContent={setEditingContent} onSaveEdit={async()=>{ await updateDoc(doc(db,'posts',editingPost.id),{content:editingContent}); setEditingPost(null); }} onCancelEdit={()=>setEditingPost(null)} commentText={commentText} setCommentText={setCommentText} openComments={openComments} setOpenComments={setOpenComments} /></div>))}</div>
        </main>
        <div className="hidden lg:block w-[20px]"></div>
      </div>
    </div>
  )
}