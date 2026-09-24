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
  const [friendStatus, setFriendStatus] = useState<'none'|'pending_sent'|'pending_received'|'friends'|'loading'>('loading');
  const [requestId, setRequestId] = useState<string|null>(null);
  const [friendsCount, setFriendsCount] = useState(0);
  const [tab, setTab] = useState<'all'|'media'|'text'>('all');
  const [chatExists, setChatExists] = useState(false);
  const [msgRequestStatus, setMsgRequestStatus] = useState<'none'|'pending'|'loading'>('none');
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
      } else {
        setIsMine(false);
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

    const unsubFriend = onSnapshot(doc(db, 'friends', friendDocId), (snap)=>{
      if(snap.exists()){
        setFriendStatus('friends');
      }
    }, (err)=>{ console.log("friends error", err); setFriendStatus('none'); });

    const qSent = query(collection(db,'friendRequests'), where('from','==',myUid), where('to','==',targetUid), where('status','==','pending'));
    const qReceived = query(collection(db,'friendRequests'), where('from','==',targetUid), where('to','==',myUid), where('status','==','pending'));

    const unsubSent = onSnapshot(qSent, (snap)=>{
      if(!snap.empty){ setFriendStatus('pending_sent'); setRequestId(snap.docs[0].id); }
      else { setFriendStatus(prev => prev === 'pending_received' || prev === 'friends'? prev : 'none'); }
    }, ()=> setFriendStatus('none'));

    const unsubReceived = onSnapshot(qReceived, (snap)=>{
      if(!snap.empty){ setFriendStatus('pending_received'); setRequestId(snap.docs[0].id); }
      else { setFriendStatus(prev => prev === 'pending_sent' || prev === 'friends'? prev : 'none'); }
    }, ()=> setFriendStatus('none'));

    const unsubCount = onSnapshot(query(collection(db,'friends'), where('users','array-contains', targetUid)), (snap)=>{ setFriendsCount(snap.size); });
    const unsubChat = onSnapshot(doc(db,'chats',friendDocId), (snap)=> setChatExists(snap.exists()));
    const unsubMsgReq = onSnapshot(query(collection(db,'messageRequests'), where('from','==', myUid), where('to','==', targetUid), where('status','==','pending')), (snap)=>{
      setMsgRequestStatus(snap.empty? 'none' : 'pending');
    });

    return ()=>{ unsubFriend(); unsubSent(); unsubReceived(); unsubCount(); unsubChat(); unsubMsgReq(); };
  }, [myUid, targetUid]);

  const handleSend = async ()=>{
    if(!myUid ||!targetUid) return;
    setFriendStatus('loading');
    await addDoc(collection(db,'friendRequests'), { from: myUid, to: targetUid, status:'pending', created_at: serverTimestamp() });
    await addDoc(collection(db,'notifications'), { toUid: targetUid, to: targetUid, fromUid: myUid, fromName: currentUserData?.displayName, fromPhoto: currentUserData?.avatar, type: 'friend_request', text: 'ارسل لك طلب صداقة', read: false, created_at: serverTimestamp(), createdAt: serverTimestamp() });
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
    const friendDocId = [myUid, targetUid].sort().join('_');
    await deleteDoc(doc(db,'friends', friendDocId));
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
      setShowMsgInput(!showMsgInput);
    }
  };
  const sendMessageRequest = async()=>{
    if(!firstMessage.trim() ||!myUid ||!targetUid) return;
    setMsgRequestStatus('loading');
    await addDoc(collection(db,'messageRequests'),{ from: myUid, to: targetUid, fromName: currentUserData?.displayName || "مستخدم", fromAvatar: currentUserData?.avatar || "", toName: user?.displayName, firstMessage: firstMessage, status: 'pending', created_at: serverTimestamp() });
    await addDoc(collection(db,'notifications'),{ toUid: targetUid, to: targetUid, fromUid: myUid, fromName: currentUserData?.displayName, fromPhoto: currentUserData?.avatar, type: 'message_request', text: `أرسل لك طلب مراسلة: ${firstMessage.slice(0,20)}`, read: false, created_at: serverTimestamp(), createdAt: serverTimestamp() });
    setFirstMessage(""); setShowMsgInput(false); setMsgRequestStatus('pending');
  };
  const handleUpload = async (e:any, type:'avatar'|'cover') => {
    const file = e.target.files[0]; if(!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => { const base64 = ev.target?.result as string; await updateDoc(doc(db, 'users', targetUid), { [type]: base64 }); };
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

      <div className="relative h-[200px] w-full group bg-white/5">
        {user.cover? <img src={user.cover} className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center text-white/20"><ImageIcon className="w-12 h-12"/></div>}
        <div className="absolute inset-0 bg-black/20"/>
        {isMine && (<><button onClick={()=>coverInput.current?.click()} className="absolute bottom-4 left-4 bg-black/60 backdrop-blur p-2.5 rounded-full border border-white/20"><Camera className="w-5 h-5 text-white"/></button><input ref={coverInput} type="file" accept="image/*" hidden onChange={(e)=>handleUpload(e,'cover')}/></>)}
        <div className="absolute -bottom-14 right-6 flex items-end gap-4 w-[calc(100%-48px)]">
          <div className="relative">
            <div className="w-24 h-24 rounded-full border-4 border-[#050a0a] bg-[#111] overflow-hidden flex items-center justify-center">{user.avatar? <img src={user.avatar} className="w-full h-full object-cover"/> : <User className="w-10 h-10 text-white/30"/>}</div>
            <span className={`absolute bottom-1 right-1 w-3.5 h-3.5 rounded-full border-2 border-[#050a0a] ${user.isOnline?'bg-green-400':'bg-gray-500'}`}></span>
            {isMine && (<><button onClick={()=>avatarInput.current?.click()} className="absolute -bottom-1 -left-1 bg-white p-1.5 rounded-full shadow-lg"><Camera className="w-4 h-4 text-black"/></button><input ref={avatarInput} type="file" accept="image/*" hidden onChange={(e)=>handleUpload(e,'avatar')}/></>)}
          </div>
          <div className="pb-2 flex-1">
            <div className="flex items-center gap-2 flex-wrap"><h1 className={`text-xl font-black ${getNameColor(user.role)}`}>{user.displayName}</h1><RoleBadge role={user.role}/></div>
            <p className="text-white/50 text-xs mt-1">@{user.username} • {friendsCount} صديق • {user.isOnline?'متصل الآن':'غير متصل'}</p>
          </div>
          {!isMine && myUid && (
            <div className="pb-2 flex gap-2 flex-wrap">
              {(friendStatus==='none' || friendStatus==='loading') && <button onClick={handleSend} className="bg-gradient-to-r from-cyan-400 to-teal-400 text-black font-black text-sm px-5 py-2 rounded-full flex items-center gap-1.5"><UserPlus className="w-4 h-4"/> إضافة</button>}
              {friendStatus==='pending_sent' && <button onClick={handleCancel} className="bg-white/10 border border-white/20 text-white font-bold text-sm px-5 py-2 rounded-full flex items-center gap-1.5"><Clock className="w-4 h-4"/> تم الإرسال</button>}
              {friendStatus==='pending_received' && <div className="flex gap-2"><button onClick={handleAccept} className="bg-green-500 text-white font-black text-sm px-4 py-2 rounded-full flex items-center gap-1"><Check className="w-4 h-4"/> قبول</button><button onClick={handleCancel} className="bg-white/10 text-white px-3 py-2 rounded-full"><X className="w-4 h-4"/></button></div>}
              {friendStatus==='friends' && <button onClick={handleUnfriend} className="bg-white/[0.06] border border-white/10 text-white font-bold text-sm px-4 py-2 rounded-full flex items-center gap-1.5"><UserMinus className="w-4 h-4"/> صديق</button>}

              {(friendStatus==='none' || friendStatus==='loading') && (
                <>
                  {msgRequestStatus==='none' && <button onClick={handleMessageClick} className="bg-white/10 border border-white/20 text-white font-bold text-sm px-4 py-2 rounded-full flex items-center gap-1.5"><Send className="w-4 h-4"/> طلب مراسلة</button>}
                  {msgRequestStatus==='pending' && <span className="bg-white/10 border border-white/10 text-white/50 font-bold text-sm px-4 py-2 rounded-full">تم ارسال الطلب</span>}
                  {msgRequestStatus==='loading' && <span className="bg-white/10 text-white/50 text-sm px-4 py-2 rounded-full">...</span>}
                </>
              )}
              {(friendStatus==='friends' || chatExists) && <button onClick={handleMessageClick} className="bg-[#00E5FF] text-black font-black text-sm px-5 py-2 rounded-full flex items-center gap-1.5"><MessageCircle className="w-4 h-4"/> مراسلة</button>}
            </div>
          )}
        </div>
      </div>

      {showMsgInput && (
        <div className="max-w-[600px] mx-auto mt-20 px-3"><div className="bg-[#122025] border border-cyan-400/30 rounded-2xl p-4 flex gap-2"><input value={firstMessage} onChange={e=>setFirstMessage(e.target.value)} placeholder={`اكتب رسالة لـ ${user.displayName}...`} className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-sm outline-none text-white"/><button onClick={sendMessageRequest} className="bg-cyan-400 text-black px-5 py-2 rounded-full font-black text-sm">إرسال</button><button onClick={()=>setShowMsgInput(false)} className="bg-white/10 px-3 py-2 rounded-full"><X className="w-4 h-4 text-white"/></button></div></div>
      )}

      <div className="max-w-[600px] mx-auto mt-4 px-3 pb-20">
        <div className="flex gap-6 border-b border-white/10 pb-2 text-sm"><span className="font-bold text-white border-b-2 border-cyan-400 pb-2">البروفايل</span><span className="text-white/40">{posts.length} منشور • {friendsCount} صديق</span>{user.role && <span className="mr-auto"><RoleBadge role={user.role}/></span>}</div>
        <div className="flex bg-white/[0.05] rounded-2xl p-1.5 gap-1.5 mt-4 border border-white/10 sticky top-[60px] z-40 backdrop-blur-xl">
          <button onClick={()=>setTab('all')} className={`flex-1 py-2.5 rounded-xl font-black text-[13px] flex items-center justify-center gap-1.5 ${tab==='all'?'bg-[#00E5FF] text-black':'text-white/50'}`}><LayoutGrid className="w-4 h-4"/> الكل ({posts.length})</button>
          <button onClick={()=>setTab('media')} className={`flex-1 py-2.5 rounded-xl font-black text-[13px] flex items-center justify-center gap-1.5 ${tab==='media'?'bg-[#00E5FF] text-black':'text-white/50'}`}><Images className="w-4 h-4"/> وسائط</button>
          <button onClick={()=>setTab('text')} className={`flex-1 py-2.5 rounded-xl font-black text-[13px] flex items-center justify-center gap-1.5 ${tab==='text'?'bg-[#00E5FF] text-black':'text-white/50'}`}><FileText className="w-4 h-4"/> كتابة</button>
        </div>
        <div className="space-y-3 mt-4">{filteredPosts.map((p:any)=><div key={p.id} className="bg-white/[0.04] border border-white/10 rounded-2xl p-4"><div className="flex gap-2 items-center mb-2"><img src={user.avatar} className="w-8 h-8 rounded-full"/><span className={`text-sm font-bold ${getNameColor(user.role)}`}>{user.displayName}</span><RoleBadge role={user.role}/></div><p className="text-[15px] whitespace-pre-wrap text-white/90">{p.content}</p>{p.image && <img src={p.image} className="mt-3 rounded-xl w-full"/>}{p.video && <video src={p.video} controls className="mt-3 rounded-xl w-full"/>}</div>)}</div>
      </div>
    </div>
  );
}