"use client"
import { useState, useEffect, useRef } from "react";
import { db, auth } from "../../lib/firebase";
import { doc, collection, getDocs, query, where, updateDoc, onSnapshot, addDoc, setDoc, deleteDoc, serverTimestamp, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { Camera, ArrowLeft, User, Image as ImageIcon, Crown, Gem, Star, Verified, UserPlus, Check, Clock, X, UserMinus, MessageCircle, Send } from "lucide-react";
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
  const [friendStatus, setFriendStatus] = useState<'none'|'pending_sent'|'pending_received'|'friends'>('none');
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
    const unsubFriend = onSnapshot(doc(db, 'friends', friendDocId), (snap)=>{ if(snap.exists()) setFriendStatus('friends'); });
    const qSent = query(collection(db,'friendRequests'), where('from','==',myUid), where('to','==',targetUid), where('status','==','pending'));
    const qReceived = query(collection(db,'friendRequests'), where('from','==',targetUid), where('to','==',myUid), where('status','==','pending'));
    const unsubSent = onSnapshot(qSent, (snap)=>{ if(!snap.empty){ setFriendStatus('pending_sent'); setRequestId(snap.docs[0].id); } else if(friendStatus!=='friends' && friendStatus!=='pending_received') setFriendStatus('none'); });
    const unsubReceived = onSnapshot(qReceived, (snap)=>{ if(!snap.empty){ setFriendStatus('pending_received'); setRequestId(snap.docs[0].id); } });
    const unsubCount = onSnapshot(query(collection(db,'friends'), where('users','array-contains', targetUid)), (snap)=> setFriendsCount(snap.size));
    const unsubChat = onSnapshot(doc(db,'chats',friendDocId), (snap)=> setChatExists(snap.exists()));
    const unsubMsgReq = onSnapshot(query(collection(db,'messageRequests'), where('from','==', myUid), where('to','==', targetUid), where('status','==','pending')), (snap)=> setMsgRequestStatus(snap.empty? 'none' : 'pending'));
    return ()=>{ unsubFriend(); unsubSent(); unsubReceived(); unsubCount(); unsubChat(); unsubMsgReq(); };
  }, [myUid, targetUid]);

  const handleSend = async ()=>{ if(!myUid) return; await addDoc(collection(db,'friendRequests'), { from: myUid, to: targetUid, status:'pending', created_at: serverTimestamp() }); setFriendStatus('pending_sent'); };
  const handleAccept = async ()=>{ if(!myUid||!requestId) return; await setDoc(doc(db,'friends', [myUid, targetUid].sort().join('_')), { users:[myUid, targetUid], created_at: serverTimestamp() }); await deleteDoc(doc(db,'friendRequests', requestId)); setFriendStatus('friends'); };
  const handleCancel = async ()=>{ if(!requestId) return; await deleteDoc(doc(db,'friendRequests', requestId)); setFriendStatus('none'); };
  const handleUnfriend = async ()=>{ if(!myUid) return; await deleteDoc(doc(db,'friends', [myUid, targetUid].sort().join('_'))); setFriendStatus('none'); };
  const handleMessageClick = async()=>{
    const chatId = [myUid, targetUid].sort().join('_');
    if(friendStatus==='friends' || chatExists){
      const snap = await getDoc(doc(db,'chats',chatId));
      if(!snap.exists()) await setDoc(doc(db,'chats',chatId),{ members:[myUid, targetUid], created_at: serverTimestamp(), updated_at: serverTimestamp() });
      router.push(`/messages?chatId=${chatId}`);
    } else setShowMsgInput(true);
  };
  const sendMessageRequest = async()=>{
    if(!firstMessage.trim()) return;
    await addDoc(collection(db,'messageRequests'),{ from: myUid, to: targetUid, fromName: currentUserData?.displayName, firstMessage, status: 'pending', created_at: serverTimestamp() });
    setFirstMessage(""); setShowMsgInput(false); setMsgRequestStatus('pending');
  };
  const handleUpload = async (e:any, type:'avatar'|'cover') => { const file=e.target.files[0]; if(!file) return; const reader=new FileReader(); reader.onload=async(ev)=>{ await updateDoc(doc(db,'users',targetUid),{[type]:ev.target?.result}); }; reader.readAsDataURL(file); };

  if (!user) return <div className="min-h-screen bg-[#050a0a] flex items-center justify-center text-white">تحميل...</div>;

  return (
    <div className="min-h-screen bg-[#050a0a]" dir="rtl">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@700;900&display=swap'); *{font-family:'Tajawal',sans-serif!important;}`}</style>
      <header className="sticky top-0 z-50 h-[56px] bg-[#050a0a] border-b border-white/10 flex items-center justify-between px-4">
        <button onClick={()=>router.push('/')} className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center"><ArrowLeft className="w-5 h-5 text-white"/></button>
        <span className={`font-black ${getNameColor(user.role)}`}>{user.displayName}</span>
        <div className="w-9"/>
      </header>

      {/* كفر */}
      <div className="relative h-[220px] w-full bg-[#111]">
        {user.cover? <img src={user.cover} className="w-full h-full object-cover"/> : null}
        <div className="absolute inset-0 bg-gradient-to-t from-[#050a0a] via-transparent to-transparent"/>
        {isMine && <><button onClick={()=>coverInput.current?.click()} className="absolute bottom-4 left-4 bg-black/60 p-2.5 rounded-full border border-white/20"><Camera className="w-5 h-5 text-white"/></button><input ref={coverInput} type="file" hidden onChange={(e)=>handleUpload(e,'cover')}/></>}
      </div>

      {/* معلومات + ازرار - تصميم جديد واضح */}
      <div className="max-w-[700px] mx-auto px-4 -mt-12 relative z-10">
        <div className="flex items-end gap-4">
          <div className="relative w-24 h-24 rounded-full border-4 border-[#050a0a] bg-[#222] overflow-hidden shrink-0">
            {user.avatar? <img src={user.avatar} className="w-full h-full object-cover"/> : <User className="w-10 h-10 text-white/20 m-6"/>}
            <span className={`absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 border-[#050a0a] ${user.isOnline?'bg-green-400':'bg-gray-500'}`}/>
            {isMine && <><button onClick={()=>avatarInput.current?.click()} className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100"><Camera className="w-6 h-6 text-white"/></button><input ref={avatarInput} type="file" hidden onChange={(e)=>handleUpload(e,'avatar')}/></>}
          </div>
          <div className="pb-2 flex-1">
            <div className="flex items-center gap-2 flex-wrap"><h1 className={`text-[22px] font-black ${getNameColor(user.role)}`}>{user.displayName}</h1><RoleBadge role={user.role}/></div>
            <p className="text-white/60 text-[13px] mt-1">@{user.username} • {friendsCount} صديق • {user.isOnline?'متصل الآن':'غير متصل'}</p>
          </div>
        </div>

        {/* هنا الزرين - سطر منفصل وواضح جدا */}
        {!isMine && myUid && (
          <div className="mt-5 grid grid-cols-2 gap-3">
            {friendStatus==='friends'? (
              <>
                <button onClick={handleUnfriend} className="h-[48px] rounded-full bg-white/10 border border-white/20 text-white font-black flex items-center justify-center gap-2"><UserMinus className="w-5 h-5"/> صديق</button>
                <button onClick={handleMessageClick} className="h-[48px] rounded-full bg-[#00E5FF] text-black font-black flex items-center justify-center gap-2"><MessageCircle className="w-5 h-5"/> مراسلة</button>
              </>
            ) : friendStatus==='pending_sent'? (
              <>
                <button onClick={handleCancel} className="h-[48px] rounded-full bg-white text-black font-black flex items-center justify-center gap-2"><Clock className="w-5 h-5"/> تم الارسال</button>
                <button onClick={handleMessageClick} className="h-[48px] rounded-full bg-transparent border-2 border-white text-white font-black flex items-center justify-center gap-2"><Send className="w-5 h-5"/> {msgRequestStatus==='pending'?'تم ارسال طلب':'طلب مراسلة'}</button>
              </>
            ) : (
              <>
                <button onClick={handleSend} className="h-[48px] rounded-full bg-white text-black font-black text-[15px] flex items-center justify-center gap-2 shadow-xl"><UserPlus className="w-5 h-5"/> إضافة صديق</button>
                <button onClick={handleMessageClick} className="h-[48px] rounded-full bg-transparent border-2 border-[#00E5FF] text-[#00E5FF] font-black text-[15px] flex items-center justify-center gap-2"><Send className="w-5 h-5"/> طلب مراسلة</button>
              </>
            )}
          </div>
        )}

        {showMsgInput && (
          <div className="mt-4 bg-[#15292F] border border-cyan-400/30 rounded-2xl p-3 flex gap-2">
            <input autoFocus value={firstMessage} onChange={e=>setFirstMessage(e.target.value)} placeholder="اكتب رسالتك الاولى..." className="flex-1 bg-black/40 border border-white/10 rounded-full px-4 py-2.5 text-sm text-white outline-none"/>
            <button onClick={sendMessageRequest} className="bg-[#00E5FF] text-black px-6 rounded-full font-black">ارسال</button>
            <button onClick={()=>setShowMsgInput(false)} className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center"><X className="w-4 h-4 text-white"/></button>
          </div>
        )}

        <div className="mt-6 border-b border-white/10 flex gap-6 text-sm">
          <span className="pb-3 border-b-2 border-cyan-400 font-black text-white">البروفايل</span>
          <span className="pb-3 text-white/40">{posts.length} منشور • {friendsCount} صديق</span>
        </div>

        <div className="mt-4 space-y-3 pb-20">
          {posts.map((p:any)=><div key={p.id} className="bg-white/[0.05] border border-white/10 rounded-2xl p-4"><p className="text-white/90 whitespace-pre-wrap">{p.content}</p>{p.image && <img src={p.image} className="mt-3 rounded-xl w-full"/>}</div>)}
        </div>
      </div>
    </div>
  );
}