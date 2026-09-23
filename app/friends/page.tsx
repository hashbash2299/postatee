"use client"
import { useState, useEffect } from "react";
import { db, auth } from "../lib/firebase";
import { collection, query, where, onSnapshot, doc, getDoc, setDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { ArrowLeft, Users, UserPlus, Clock, Check, X, MessageCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function FriendsPage() {
  const [myUid, setMyUid] = useState<string|null>(null);
  const [tab, setTab] = useState<'friends'|'requests'|'sent'>('requests');
  const [requests, setRequests] = useState<any[]>([]);
  const [sent, setSent] = useState<any[]>([]);
  const [friends, setFriends] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u)=>{
      if(!u) { router.push('/login'); return; }
      setMyUid(u.uid);
    });
    return ()=>unsub();
  }, []);

  useEffect(() => {
    if(!myUid) return;

    // طلبات جاية لي
    const qReq = query(collection(db,'friendRequests'), where('to','==',myUid), where('status','==','pending'));
    const unsubReq = onSnapshot(qReq, async (snap)=>{
      const list = await Promise.all(snap.docs.map(async d=>{
        const data = d.data();
        const userSnap = await getDoc(doc(db,'users', data.from));
        return { id:d.id,...data, user: userSnap.data() };
      }));
      setRequests(list);
    });

    // طلبات انا مرسلها
    const qSent = query(collection(db,'friendRequests'), where('from','==',myUid), where('status','==','pending'));
    const unsubSent = onSnapshot(qSent, async (snap)=>{
      const list = await Promise.all(snap.docs.map(async d=>{
        const data = d.data();
        const userSnap = await getDoc(doc(db,'users', data.to));
        return { id:d.id,...data, user: userSnap.data() };
      }));
      setSent(list);
    });

    // اصدقائي
    const qFriends = query(collection(db,'friends'), where('users','array-contains', myUid));
    const unsubFriends = onSnapshot(qFriends, async (snap)=>{
      const list = await Promise.all(snap.docs.map(async d=>{
        const data = d.data();
        const otherId = data.users.find((id:string)=> id!==myUid);
        const userSnap = await getDoc(doc(db,'users', otherId));
        return { id:d.id,...data, user: userSnap.data(), friendId: otherId };
      }));
      setFriends(list);
    });

    return ()=>{ unsubReq(); unsubSent(); unsubFriends(); };
  }, [myUid]);

  const accept = async (reqId:string, fromId:string)=>{
    const friendDocId = [myUid, fromId].sort().join('_');
    await setDoc(doc(db,'friends', friendDocId), { users:[myUid, fromId], created_at: serverTimestamp() });
    await deleteDoc(doc(db,'friendRequests', reqId));
  };
  const reject = async (reqId:string)=>{ await deleteDoc(doc(db,'friendRequests', reqId)); };
  const cancel = async (reqId:string)=>{ await deleteDoc(doc(db,'friendRequests', reqId)); };
  const unfriend = async (friendDocId:string)=>{ await deleteDoc(doc(db,'friends', friendDocId)); };

  const UserCard = ({u, children}:any)=>(
    <div className="bg-white/[0.04] border border-white/10 rounded-[20px] p-4 flex items-center gap-3">
      <Link href={`/profile/${u.userId || u.uid || u.friendId}`}><img src={u.avatar} className="w-12 h-12 rounded-full object-cover border border-white/10"/></Link>
      <div className="flex-1">
        <Link href={`/profile/${u.userId || u.uid || u.friendId}`} className="font-bold text-white text-sm">{u.displayName}</Link>
        <p className="text-white/40 text-xs">@{u.username}</p>
      </div>
      <div className="flex gap-2">{children}</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#050a0a]" dir="rtl">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@800;700;900&display=swap'); *{font-family:'Tajawal',sans-serif!important;}`}</style>

      <header className="sticky top-0 z-50 h-[56px] bg-[#050a0a]/80 backdrop-blur-xl border-b border-white/10 flex items-center justify-between px-4">
        <button onClick={()=>router.push('/')} className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center"><ArrowLeft className="w-5 h-5 text-white"/></button>
        <span className="font-black text-white flex items-center gap-2"><Users className="w-5 h-5 text-cyan-400"/> الأصدقاء</span>
        <div className="w-9"/>
      </header>

      <div className="max-w-[600px] mx-auto p-3">
        <div className="flex bg-white/[0.05] rounded-full p-1.5 gap-1.5 mb-5 border border-white/10">
          <button onClick={()=>setTab('requests')} className={`flex-1 py-2.5 rounded-full text-sm font-bold transition-all ${tab==='requests'?'bg-white text-black':'text-white/50'}`}>الطلبات {requests.length>0 && `(${requests.length})`}</button>
          <button onClick={()=>setTab('friends')} className={`flex-1 py-2.5 rounded-full text-sm font-bold transition-all ${tab==='friends'?'bg-white text-black':'text-white/50'}`}>أصدقائي ({friends.length})</button>
          <button onClick={()=>setTab('sent')} className={`flex-1 py-2.5 rounded-full text-sm font-bold transition-all ${tab==='sent'?'bg-white text-black':'text-white/50'}`}>مرسلة</button>
        </div>

        {tab==='requests' && (
          <div className="space-y-3">
            {requests.length===0 && <div className="text-center text-white/30 py-16 border border-dashed border-white/10 rounded-[24px]">ما في طلبات حاليا</div>}
            {requests.map(r=> <UserCard key={r.id} u={r.user}>
              <button onClick={()=>accept(r.id, r.from)} className="bg-green-500 text-white px-4 py-2 rounded-full text-sm font-black flex items-center gap-1"><Check className="w-4 h-4"/>قبول</button>
              <button onClick={()=>reject(r.id)} className="bg-white/10 text-white px-3 py-2 rounded-full"><X className="w-4 h-4"/></button>
            </UserCard>)}
          </div>
        )}

        {tab==='friends' && (
          <div className="space-y-3">
            {friends.length===0 && <div className="text-center text-white/30 py-16 border border-dashed border-white/10 rounded-[24px]">لسه ما عندك أصدقاء - ابدأ تضيف من الـ 6 حسابات</div>}
            {friends.map(f=> <UserCard key={f.id} u={f.user}>
              <Link href={`/profile/${f.friendId}`} className="bg-white text-black px-4 py-2 rounded-full text-sm font-bold flex items-center gap-1"><MessageCircle className="w-4 h-4"/> بروفايل</Link>
              <button onClick={()=>unfriend(f.id)} className="bg-white/5 border border-white/10 text-white/50 px-3 py-2 rounded-full text-xs">إلغاء</button>
            </UserCard>)}
          </div>
        )}

        {tab==='sent' && (
          <div className="space-y-3">
            {sent.length===0 && <div className="text-center text-white/30 py-16 border border-dashed border-white/10 rounded-[24px]">ما رسلت طلبات</div>}
            {sent.map(s=> <UserCard key={s.id} u={s.user}>
              <button onClick={()=>cancel(s.id)} className="bg-white/10 text-white px-4 py-2 rounded-full text-sm flex items-center gap-1"><Clock className="w-4 h-4"/> إلغاء الطلب</button>
            </UserCard>)}
          </div>
        )}
      </div>
    </div>
  );
}