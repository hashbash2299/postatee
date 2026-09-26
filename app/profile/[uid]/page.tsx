"use client"
import { useState, useEffect, useRef } from "react";
import { db, auth } from "../../lib/firebase";
import { doc, collection, getDocs, query, where, updateDoc, onSnapshot, addDoc, setDoc, deleteDoc, serverTimestamp, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { Camera, ArrowLeft, User, Image as ImageIcon, Crown, Gem, Star, Verified, UserPlus, Check, Clock, X, UserMinus, FileText, Images, LayoutGrid, MessageCircle, Send, Loader2 } from "lucide-react";
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
  const [uploading, setUploading] = useState<'avatar'|'cover'|null>(null);
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
        await setDoc(doc(db,'chats',chatId),{
          members:[myUid, targetUid],
          membersInfo: { [myUid]: { name: currentUserData?.displayName, avatar: currentUserData?.avatar }, [targetUid]: { name: user?.displayName, avatar: user?.avatar } },
          created_at: serverTimestamp(),
          updated_at: serverTimestamp(),
          lastMessage: ""
        });
      }
      router.push(`/messages/${chatId}`);
    } else {
      setShowMsgInput(true);
    }
  };

  const sendMessageRequest = async()=>{
    if(!firstMessage.trim() ||!myUid ||!targetUid) return;
    await addDoc(collection(db,'messageRequests'),{ from: myUid, to: targetUid, fromName: currentUserData?.displayName, fromAvatar: currentUserData?.avatar, toName: user?.displayName, firstMessage, status: 'pending', created_at: serverTimestamp() });
    setFirstMessage(""); setShowMsgInput(false); setMsgRequestStatus('pending');
  };

  // ✅ دالة معالجة موحدة وسريعة
  const handleUpload = async (e:any, type:'avatar'|'cover') => {
    const file = e.target.files[0];
    if(!file) return;
    try {
      setUploading(type);
      const compressedBase64 = await new Promise<string>((resolve, reject) => {
        const img = new Image();
        img.src = URL.createObjectURL(file);
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d')!;
          let w = img.width, h = img.height;

          if(type === 'avatar'){
            // قص مربع من النص
            const s = Math.min(w,h);
            const sx = (w-s)/2, sy = (h-s)/2;
            canvas.width = 300; canvas.height = 300;
            ctx.drawImage(img, sx, sy, s, s, 0, 0, 300, 300);
          } else {
            // كفر عريض
            const maxW = 900;
            if(w > maxW){ h = (maxW/w)*h; w = maxW; }
            canvas.width = w; canvas.height = h;
            ctx.drawImage(img, 0, 0, w, h);
          }
          const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
          URL.revokeObjectURL(img.src);
          resolve(dataUrl);
        };
        img.onerror = () => reject(new Error('فشل تحميل الصورة'));
      });

      if(compressedBase64.length > 900000){
        alert("الصورة كبيرة، جرب صورة تانية");
        return;
      }
      await updateDoc(doc(db, 'users', targetUid), { [type]: compressedBase64 });
    } catch(err:any){
      alert("فشل: " + err.message);
    } finally {
      setUploading(null);
      if(e.target) e.target.value = "";
    }
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
        {uploading==='cover' && <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10"><Loader2 className="w-8 h-8 text-white animate-spin"/></div>}

        {isMine && (
          <label className="absolute bottom-4 left-4 z-20 bg-black/60 p-2.5 rounded-full border border-white/20 cursor-pointer hover:bg-black/80 active:scale-90 transition">
            {uploading==='cover'? <Loader2 className="w-5 h-5 text-white animate-spin"/> : <Camera className="w-5 h-5 text-white"/>}
            <input ref={coverInput} type="file" accept="image/*" hidden onChange={(e)=>handleUpload(e,'cover')}/>
          </label>
        )}

        <div className="absolute -bottom-12 right-6 flex items-end gap-4">
          <div className="relative">
            <div className="w-24 h-24 rounded-full border-4 border-[#050a0a] bg-[#111] overflow-hidden">
              {user.avatar? <img src={user.avatar} className="w-full h-full object-cover"/> : <User className="w-10 h-10 text-white/30 m-6"/>}
              {uploading==='avatar' && <div className="absolute inset-0 bg-black/60 flex items-center justify-center"><Loader2 className="w-6 h-6 text-white animate-spin"/></div>}
            </div>
            {isMine && (
              <label className="absolute -bottom-1 -left-1 z-20 bg-white p-1.5 rounded-full cursor-pointer hover:bg-zinc-200 active:scale-90 transition shadow-lg">
                <Camera className="w-4 h-4 text-black"/>
                <input ref={avatarInput} type="file" accept="image/*" hidden onChange={(e)=>handleUpload(e,'avatar')}/>
              </label>
            )}
          </div>
          <div className="pb-2">
            <div className="flex items-center gap-2">
              <h1 className={`text-xl font-black ${getNameColor(user.role)}`}>{user.displayName}</h1>
              <RoleBadge role={user.role}/>
            </div>
            <p className="text-white/50 text-xs mt-1">@{user.username} • {friendsCount} صديق</p>
          </div>
        </div>
      </div>

      {!isMine && myUid && (
        <div className="max-w-[600px] mx-auto px-6 mt-[68px]">
          <div className="flex gap-2.5 flex-wrap">
            {friendStatus==='friends'? (
              <>
                <button onClick={handleUnfriend} className="h-9 px-5 rounded-full bg-white/[0.06] border border-white/10 text-white font-bold text-[12px] flex items-center gap-1.5"><UserMinus className="w-3.5 h-3.5"/> صديق</button>
                <button onClick={handleMessageClick} className="h-9 px-5 rounded-full bg-[#00E5FF] text-black font-black text-[12px] flex items-center gap-1.5"><MessageCircle className="w-3.5 h-3.5"/> مراسلة</button>
              </>
            ) : friendStatus==='pending_sent'? (
              <>
                <button onClick={handleCancel} className="h-9 px-5 rounded-full bg-white/10 border border-white/15 text-white font-bold text-[12px] flex items-center gap-1.5"><Clock className="w-3.5 h-3.5"/> تم الإرسال</button>
                <button onClick={handleMessageClick} className="h-9 px-5 rounded-full bg-transparent border border-cyan-400/50 text-cyan-400 font-bold text-[12px] flex items-center gap-1.5"><Send className="w-3.5 h-3.5"/> {msgRequestStatus==='pending'?'تم الطلب':'طلب مراسلة'}</button>
              </>
            ) : friendStatus==='pending_received'? (
              <>
                <button onClick={handleAccept} className="h-9 px-5 rounded-full bg-green-500 text-white font-black text-[12px] flex items-center gap-1.5"><Check className="w-3.5 h-3.5"/> قبول</button>
                <button onClick={handleCancel} className="h-9 w-9 rounded-full bg-white/10 flex items-center justify-center"><X className="w-3.5 h-3.5 text-white"/></button>
                <button onClick={handleMessageClick} className="h-9 px-5 rounded-full bg-transparent border border-cyan-400/50 text-cyan-400 font-bold text-[12px] flex items-center gap-1.5"><Send className="w-3.5 h-3.5"/> طلب مراسلة</button>
              </>
            ) : (
              <>
                <button onClick={handleSend} className="h-9 px-5 rounded-full bg-white text-black font-black text-[12px] flex items-center gap-1.5 hover:bg-zinc-100 transition"><UserPlus className="w-3.5 h-3.5"/> إضافة صديق</button>
                <button onClick={handleMessageClick} className="h-9 px-5 rounded-full bg-transparent border border-cyan-400 text-cyan-400 font-bold text-[12px] flex items-center gap-1.5 hover:bg-cyan-400/10 transition"><Send className="w-3.5 h-3.5"/> طلب مراسلة</button>
              </>
            )}
          </div>
        </div>
      )}

      {showMsgInput && (
        <div className="max-w-[600px] mx-auto mt-6 px-3"><div className="bg-[#122025] border border-cyan-400/30 rounded-2xl p-4 flex gap-2"><input value={firstMessage} onChange={e=>setFirstMessage(e.target.value)} placeholder={`اكتب رسالة لـ ${user.displayName}...`} className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-sm outline-none text-white"/><button onClick={sendMessageRequest} className="bg-cyan-400 text-black px-5 py-2 rounded-full font-black text-sm">إرسال</button><button onClick={()=>setShowMsgInput(false)} className="bg-white/10 px-3 py-2 rounded-full"><X className="w-4 h-4 text-white"/></button></div></div>
      )}

      <div className="max-w-[600px] mx-auto mt-8 px-3 pb-20">
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