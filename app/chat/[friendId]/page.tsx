"use client"
import { useState, useEffect, useRef } from "react";
import { db, auth } from "../../lib/firebase";
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, where, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { ArrowLeft, Send, Check, CheckCheck, Image as ImageIcon } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

export default function ChatPage(){
  const { friendId } = useParams();
  const [myUid, setMyUid] = useState<string|null>(null);
  const [friend, setFriend] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(()=>{
    onAuthStateChanged(auth, async u=>{
      if(!u) return router.push('/login');
      setMyUid(u.uid);
      const snap = await getDoc(doc(db,'users', friendId as string));
      if(snap.exists()) setFriend(snap.data());
    });
  },[]);

  useEffect(()=>{
    if(!myUid ||!friendId) return;
    const chatId = [myUid, friendId as string].sort().join('_');
    const q = query(collection(db,'chats', chatId, 'messages'), orderBy('created_at','asc'));
    const unsub = onSnapshot(q, async snap=>{
      const msgs = snap.docs.map(d=>({id:d.id,...d.data()}));
      setMessages(msgs as any[]);

      // اول ما افتح المحادثة -> اعمل كل الرسائل الجاية لي مقروءة ✓✓ أزرق
      snap.docs.forEach(async d=>{
        const m = d.data();
        if(m.to===myUid && m.status!=='read'){
          await updateDoc(d.ref, {status:'read', read_at: serverTimestamp()});
        } else if(m.to===myUid && m.status==='sent'){
          await updateDoc(d.ref, {status:'delivered'});
        }
      });
      bottomRef.current?.scrollIntoView({behavior:'smooth'});
    });
    return ()=>unsub();
  },[myUid, friendId]);

  const send = async ()=>{
    if(!text.trim() ||!myUid) return;
    const chatId = [myUid, friendId as string].sort().join('_');
    await addDoc(collection(db,'chats', chatId, 'messages'), {
      from: myUid,
      to: friendId,
      text,
      status:'sent', // sent -> delivered -> read
      created_at: serverTimestamp()
    });
    // تحديث اخر رسالة في قائمة المحادثات
    await updateDoc(doc(db,'chats', chatId), {
      lastMessage: text,
      lastAt: serverTimestamp(),
      users: [myUid, friendId]
    }).catch(async()=>{
      // لو ما موجود انشئو
      const { setDoc } = await import('firebase/firestore');
      await setDoc(doc(db,'chats', chatId), {
        lastMessage: text,
        lastAt: serverTimestamp(),
        users: [myUid, friendId]
      });
    });
    setText("");
  };

  const StatusIcon = ({status}:any)=>{
    if(status==='sent') return <Check className="w-4 h-4 text-gray-400"/>;
    if(status==='delivered') return <CheckCheck className="w-4 h-4 text-gray-400"/>;
    if(status==='read') return <CheckCheck className="w-4 h-4 text-[#00E5FF]"/>;
    return null;
  };

  if(!friend) return <div className="min-h-screen bg-[#0B1418] flex items-center justify-center text-white">جاري التحميل...</div>;

  return (
    <div className="min-h-screen bg-[#0B1418] flex flex-col" dir="rtl">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@700&display=swap'); *{font-family:'Tajawal',sans-serif!important;}`}</style>

      <header className="h-[56px] bg-[#122025] border-b border-[#1A2E35] flex items-center gap-3 px-3 sticky top-0 z-50">
        <button onClick={()=>router.back()} className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center"><ArrowLeft className="w-5 h-5 text-white"/></button>
        <Link href={`/profile/${friendId}`} className="flex items-center gap-2">
          <img src={friend.avatar} className="w-9 h-9 rounded-full"/>
          <div><p className="font-bold text-white text-sm">{friend.displayName}</p><p className="text-[11px] text-green-400">{friend.isOnline?'متصل الآن':'آخر ظهور منذ قليل'}</p></div>
        </Link>
        {/* هنا حنضيف ايقونة الاتصال لاحقا */}
        <div className="mr-auto flex gap-2 opacity-50">
          <span className="text-xl">📞</span>
          <span className="text-xl">📹</span>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-[#0B1418]">
        {messages.map(m=>{
          const isMe = m.from===myUid;
          return (
            <div key={m.id} className={`flex ${isMe?'justify-end':'justify-start'}`}>
              <div className={`max-w-[75%] rounded-[18px] px-3 py-2 ${isMe?'bg-[#00E5FF] text-black rounded-br-[4px]':'bg-[#1A2E35] text-white rounded-bl-[4px]'}`}>
                <p className="text-[14px] whitespace-pre-wrap">{m.text}</p>
                <div className={`flex items-center gap-1 justify-end mt-1 text-[10px] ${isMe?'text-black/60':'text-white/40'}`}>
                  <span>{m.created_at?.toDate? new Date(m.created_at.toDate()).toLocaleTimeString('ar-EG',{hour:'2-digit',minute:'2-digit'}) : '...'}</span>
                  {isMe && <StatusIcon status={m.status}/>}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef}/>
      </div>

      <div className="bg-[#122025] border-t border-[#1A2E35] p-3 flex items-center gap-2">
        <button className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center"><ImageIcon className="w-5 h-5 text-white/70"/></button>
        <input value={text} onChange={e=>setText(e.target.value)} onKeyDown={e=>e.key==='Enter' && send()} placeholder="اكتب رسالة..." className="flex-1 bg-[#0B1418] border border-[#1A2E35] rounded-full px-4 py-2.5 text-sm text-white outline-none"/>
        <button onClick={send} className="w-10 h-10 rounded-full bg-[#00E5FF] flex items-center justify-center text-black"><Send className="w-5 h-5"/></button>
      </div>
    </div>
  );
}