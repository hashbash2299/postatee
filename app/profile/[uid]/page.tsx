"use client"
import { useState, useEffect, useRef } from "react";
import { db, auth } from "../../lib/firebase";
import { doc, collection, getDocs, query, where, updateDoc, onSnapshot, addDoc, setDoc, deleteDoc, serverTimestamp, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { Camera, ArrowLeft, User, Image as ImageIcon, Crown, Gem, Star, Verified, UserPlus, Check, Clock, X, UserMinus, FileText, Images, LayoutGrid, MessageCircle, Send } from "lucide-react";
import { useParams, useRouter } from "next/navigation";

const getNameColor = (role:string) => {
  if(role === "مؤسس") return "text-cyan-400";
  if(role === "شخصية هامة") return "text-red-400";
  if(role === "شارة خضراء") return "text-green-400";
  if(role === "مالك") return "text-cyan-300";
  return "text-white";
};
const RoleBadge = ({ role }: { role: string }) => {
  if (role === "مالك") return <span className="inline-flex items-center gap-1 bg-gradient-to-r from-cyan-400 to-teal-400 text-black text-[11px] font-black px-2.5 py-0.5 rounded-full"><Crown className="w-3 h-3"/> مالك</span>;
  if (role === "مؤسس") return <span className="inline-flex items-center gap-1 bg-cyan-500/20 border border-cyan-400/50 text-cyan-400 text-[11px] font-bold px-2.5 py-0.5 rounded-full"><Gem className="w-3 h-3"/> مؤسس</span>;
  if (role === "شخصية هامة") return <span className="inline-flex items-center gap-1 bg-red-500/20 border border-red-500/50 text-red-400 text-[11px] font-black px-2.5 py-0.5 rounded-full"><Star className="w-3 h-3 fill-red-400"/> هامة</span>;
  if (role === "شارة خضراء") return <span className="inline-flex items-center gap-1 bg-green-500/20 border border-green-500/40 text-green-400 text-[11px] font-bold px-2.5 py-0.5 rounded-full"><Verified className="w-3 h-3"/> موثق</span>;
  return null;
};

export default function ProfileWall() {
  const { uid } = useParams();
  const targetUid = uid as string;
  const [user, setUser] = useState<any>(null);
  const [currentUserData, setCurrentUserData] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [isMine, setIsMine] = useState(false);
  const [myUid, setMyUid] = useState<string|null>(null);
  const [friendStatus, setFriendStatus] = useState<'none'|'pending_sent'|'pending_received'|'friends'|'loading'>('none');
  const [requestId, setRequestId] = useState<string|null>(null);
  const [friendsCount, setFriendsCount] = useState(0);
  const [tab, setTab] = useState<'all'|'media'|'text'>('all');
  const [chatExists, setChatExists] = useState(false);
  const [msgRequestStatus, setMsgRequestStatus] = useState<'none'|'pending'>('none');
  const [showMsgInput, setShowMsgInput] = useState(false);
  const [firstMessage, setFirstMessage] = useState("");
  const avatarInput = useRef<HTMLInputElement>(null);
  const coverInput = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if(!targetUid) return;
    const unsubUser = onSnapshot(doc(db, 'users', targetUid), (snap) => { if (snap.exists()) setUser(snap.data()); });
    const unsubAuth = onAuthStateChanged(auth, async (me) => {
      if (me) {
        setMyUid(me.uid);
        const mySnap = await getDoc(doc(db,'users',me.uid));
        if(mySnap.exists()) setCurrentUserData(mySnap.data());
        setIsMine(me.uid === targetUid);
      }
      const postsRef = collection(db, 'posts');
      const q1 = await getDocs(query(postsRef, where('uid','==', targetUid)));
      const q2 = await getDocs(query(postsRef, where('authorId','==', targetUid)));
      const all = [...q1.docs,...q2.docs];
      const unique = Array.from(new Map(all.map(d=>[d.id, {id:d.id,...d.data()}])).values());
      unique.sort((a:any,b:any)=> (b.created_at?.seconds||0) - (a.created_at?.seconds||0));
      setPosts(unique as any[]);
    });
    return () => { unsubUser(); unsubAuth(); };
  }, [targetUid]);

  useEffect(() => {
    if(!myUid ||!targetUid || myUid === targetUid) return;
    const friendDocId = [myUid, targetUid].sort().join('_');
    const unsubFriend = onSnapshot(doc(db, 'friends', friendDocId), (snap)=>{ setFriendStatus(snap.exists()? 'friends' : 'none'); });
    const qSent = query(collection(db,'friendRequests'), where('from','==',myUid), where('to','==',targetUid), where('status','==','pending'));
    const qReceived = query(collection(db,'friendRequests'), where('from','==',targetUid), where('to','==',myUid), where('status','==','pending'));
    const unsubSent = onSnapshot(qSent, (snap)=>{ if(!snap.empty){ setFriendStatus('pending_sent'); setRequestId(snap.docs[0].id); } });
    const unsubReceived = onSnapshot(qReceived, (snap)=>{ if(!snap.empty){ setFriendStatus('pending_received'); setRequestId(snap.docs[0].id); } });
    const unsubCount = onSnapshot(query(collection(db,'friends'), where('users','array-contains', targetUid)), (snap)=> setFriendsCount(snap.size));
    const unsubChat = onSnapshot(doc(db,'chats',friendDocId), (snap)=> setChatExists(snap.exists()));
    const unsubMsgReq = onSnapshot(query(collection(db,'messageRequests'), where('from','==', myUid), where('to','==', targetUid), where('status','==','pending')), (snap)=> setMsgRequestStatus(snap.empty? 'none' : 'pending'));
    return ()=>{ unsubFriend(); unsubSent(); unsubReceived(); unsubCount(); unsubChat(); unsubMsgReq(); };
  }, [myUid, targetUid]);

  const handleSend = async ()=>{
    if(!myUid ||!targetUid) return;
    await addDoc(collection(db,'friendRequests'), { from: myUid, to: targetUid, status:'pending', created_at: serverTimestamp() });
    setFriendStatus('pending_sent');
  };
  const handleAccept = async ()=>{
    if(!myUid ||!targetUid ||!requestId) return;
    const friendDocId = [myUid, targetUid].sort().join('_');
    await setDoc(doc(db,'friends', friendDocId), { users:[myUid, targetUid], created_at: serverTimestamp() });
    await deleteDoc(doc(db,'friendRequests', requestId));
    setFriendStatus('friends');
  };
  const handleCancel = async ()=>{
    if(!requestId) return;
    await deleteDoc(doc(db,'friendRequests', requestId));
    setFriendStatus('none'); setRequestId(null);
  };
  const handleUnfriend = async ()=>{
    if(!myUid ||!targetUid) return;
    await deleteDoc(doc(db,'friends', [myUid, targetUid].sort().join('_')));
    setFriendStatus('none');
  };
  const handleMessageClick = async()=>{
    if(!myUid ||!targetUid) return;
    const chatId = [myUid, targetUid].sort().join('_');
    if(friendStatus==='friends' || chatExists){
      const chatSnap = await getDoc(doc(db,'chats',chatId));
      if(!chatSnap.exists()){
        await setDoc(doc(db,'chats',chatId),{ members:[myUid, targetUid], membersInfo: { [myUid]: { name: currentUserData?.displayName, avatar: currentUserData?.avatar }, [targetUid]: { name: user?.displayName, avatar: user?.avatar } }, created_at: serverTimestamp(), updated_at: serverTimestamp(), lastMessage: "" });
      }
      router.push(`/messages?chatId=${chatId}`);
    } else {
      setShowMsgInput(true);
    }
  };
  const sendMessageRequest = async()=>{
    if(!firstMessage.trim() ||!myUid ||!targetUid) return;
    await addDoc(collection(db,'messageRequests'),{ from: myUid, to: targetUid, fromName: currentUserData?.displayName, fromAvatar: currentUserData?.avatar, toName: user?.displayName, firstMessage, status: 'pending', created_at: serverTimestamp() });
    setFirstMessage(""); setShowMsgInput(false); setMsgRequestStatus('pending');
  };
  const handleUpload = async (e:any, type:'avatar'|'cover') => {
    const file = e.target.files[0]; if(!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => { await updateDoc(doc(db, 'users', targetUid), { [type]: ev.target?.result as string }); };
    reader.readAsDataURL(file);
  };

  if (!user) return <div className="min-h-screen bg-[#050a0a] flex items-center justify-center text-white">جاري تحميل الحائط...</div>;
  const filteredPosts = posts.filter((p:any)=>{ if(tab==='all') return true; if(tab==='media') return p.image || p.video || p.media; if(tab==='text') return!p.image &&!p.video &&!p.media; return true; });

  return (
    <div className="min-h-screen bg-[#050a0a]" dir="rtl">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700;800;900&display=swap'); *{font-family:'Tajawal',sans-serif!important;}`}</style>
      <header className="sticky top-0 z-50 h-[56px] bg-[#050a0a]/80 backdrop-blur-xl border-b border-white/10 flex items-center justify-between px-4">
        <button onClick={()=>router.push('/')} className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center"><ArrowLeft className="w-5 h-5 text-white"/></button>
        <span className={`font-black ${getNameColor(user.role)}`}>{user.displayName}</span>
        <div className="w-9"/>
      </header>

      <div className="relative h-[200px] w-full bg-white/5">
        {user.cover? <img src={user.cover} className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center text-white/20"><ImageIcon className="w-12 h-12"/></div>}
        {isMine && (<><button onClick={()=>coverInput.current?.click()} className="absolute bottom-4 left-4 bg-black/60 p-2.5 rounded-full border border-white/20"><Camera className="w-5 h-5 text-white"/></button><input ref={coverInput} type="file" accept="image/*" hidden onChange={(e)=>handleUpload(e,'cover')}/></>)}
        <div className="absolute -bottom-14 right-6 left-6 flex items-end justify-between">
          <div className="flex items-end gap-4">
            <div className="relative"><div className="w-24 h-24 rounded-full border-4 border-[#050a0a] bg-[#111] overflow-hidden">{user.avatar? <img src={user.avatar} className="w-full h-full object-cover"/> : <User className="w-10 h-10 text-white/30 m-6"/>}</div>{isMine && (<><button onClick={()=>avatarInput.current?.click()} className="absolute -bottom-1 -left-1 bg-white p-1.5 rounded-full"><Camera className="w-4 h-4 text-black"/></button><input ref={avatarInput} type="file" accept="image/*" hidden onChange={(e)=>handleUpload(e,'avatar')}/></>)}</div>
            <div className="pb-2"><div className="flex items-center gap-2"><h1 className={`text-xl font-black ${getNameColor(user.role)}`}>{user.displayName}</h1><RoleBadge role={user.role}/></div><p className="text-white/50 text-xs mt-1">@{user.username} • {friendsCount} صديق</p></div>
          </div>

          {/* هنا الزرين - مضمون يظهرو */}
          {!isMine && myUid && (
            <div className="pb-2 flex gap-2 items-center">
              {friendStatus==='friends'? (
                <>
                  <button onClick={handleUnfriend} className="bg-white/[0.06] border border-white/10 text-white font-bold text-sm px-4 py-2.5 rounded-full flex items-center gap-1.5"><UserMinus className="w-4 h-4"/> صديق</button>
                  <button onClick={handleMessageClick} className="bg-[#00E5FF] text-black font-black text-sm px-6 py-2.5 rounded-full flex items-center gap-1.5"><MessageCircle className="w-4 h-4"/> مراسلة</button>
                </>
              ) : friendStatus==='pending_sent'? (
                <>
                  <button onClick={handleCancel} className="bg-white/10 border border-white/20 text-white font-bold text-sm px-5 py-2.5 rounded-full flex items-center gap-1.5"><Clock className="w-4 h-4"/> تم الإرسال</button>
                  <button onClick={handleMessageClick} className="bg-white/10 border border-white/20 text-white font-bold text-sm px-5 py-2.5 rounded-full flex items-center gap-1.5"><Send className="w-4 h-4"/> {msgRequestStatus==='pending'?'تم ارسال طلب المراسلة':'طلب مراسلة'}</button>
                </>
              ) : friendStatus==='pending_received'? (
                <div className="flex gap-2"><button onClick={handleAccept} className="bg-green-500 text-white font-black text-sm px-5 py-2.5 rounded-full"><Check className="w-4 h-4"/></button><button onClick={handleCancel} className="bg-white/10 px-3 py-2.5 rounded-full"><X className="w-4 h-4 text-white"/></button></div>
              ) : (
                <>
                  <button onClick={handleSend} className="bg-gradient-to-r from-cyan-400 to-teal-400 text-black font-black text-sm px-6 py-2.5 rounded-full flex items-center gap-1.5 shadow-lg"><UserPlus className="w-4 h-4"/> إضافة صديق</button>
                  <button onClick={handleMessageClick} className="bg-[#1A2E35] border border-cyan-400/30 text-cyan-400 font-black text-sm px-6 py-2.5 rounded-full flex items-center gap-1.5"><Send className="w-4 h-4"/> طلب مراسلة</button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {showMsgInput && (
        <div className="max-w-[600px] mx-auto mt-20 px-3"><div className="bg-[#122025] border border-cyan-400/30 rounded-2xl p-4 flex gap-2"><input value={firstMessage} onChange={e=>setFirstMessage(e.target.value)} placeholder={`اكتب رسالة لـ ${user.displayName}...`} className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-sm outline-none text-white"/><button onClick={sendMessageRequest} className="bg-cyan-400 text-black px-5 py-2 rounded-full font-black text-sm">إرسال</button><button onClick={()=>setShowMsgInput(false)} className="bg-white/10 px-3 py-2 rounded-full"><X className="w-4 h-4 text-white"/></button></div></div>
      )}

      <div className="max-w-[600px] mx-auto mt-20 px-3 pb-20">
        <div className="flex bg-white/[0.05] rounded-2xl p-1.5 gap-1.5 border border-white/10">
          <button onClick={()=>setTab('all')} className={`flex-1 py-2.5 rounded-xl font-black text-[13px] ${tab==='all'?'bg-[#00E5FF] text-black':'text-white/50'}`}>الكل</button>
          <button onClick={()=>setTab('media')} className={`flex-1 py-2.5 rounded-xl font-black text-[13px] ${tab==='media'?'bg-[#00E5FF] text-black':'text-white/50'}`}>وسائط</button>
          <button onClick={()=>setTab('text')} className={`flex-1 py-2.5 rounded-xl font-black text-[13px] ${tab==='text'?'bg-[#00E5FF] text-black':'text-white/50'}`}>كتابة</button>
        </div>
        <div className="space-y-3 mt-4">{filteredPosts.map((p:any)=><div key={p.id} className="bg-white/[0.04] border border-white/10 rounded-2xl p-4"><p className="text-[15px] text-white/90">{p.content}</p>{p.image && <img src={p.image} className="mt-3 rounded-xl w-full"/>}</div>)}</div>
      </div>
    </div>
  );
}