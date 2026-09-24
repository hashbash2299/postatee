"use client"
export const dynamic = 'force-dynamic'
export const revalidate = 0
import { useState, useEffect, useRef } from "react";
import { db, auth } from "../lib/firebase";
import { collection, query, where, onSnapshot, doc, addDoc, serverTimestamp, orderBy, updateDoc, setDoc, getDoc, deleteDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { ArrowLeft, Send, Check, X, MessageCircle } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

export default function MessagesPage(){
  const [user, setUser] = useState<any>(null);
  const [chats, setChats] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'chats'|'requests'>('chats');
  const [selectedChat, setSelectedChat] = useState<any>(null);
  const [otherUser, setOtherUser] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialChatId = searchParams.get('chatId');

  useEffect(()=>{
    const unsub = onAuthStateChanged(auth, async u=>{
      if(!u) return;
      setUser(u);
      // الدردشات
      onSnapshot(query(collection(db,"chats"), where("members","array-contains", u.uid)), async s=>{
        const list = s.docs.map(d=>({id:d.id,...d.data() as any}));
        // جيب بيانات الطرف التاني
        const enriched = await Promise.all(list.map(async c=>{
          const otherId = c.members.find((m:string)=>m!==u.uid);
          let otherData = c.membersInfo?.[otherId];
          if(!otherData){
            const snap = await getDoc(doc(db,'users',otherId));
            if(snap.exists()) otherData = snap.data();
          }
          return {...c, otherId, otherData};
        }));
        enriched.sort((a:any,b:any)=> (b.updated_at?.seconds||0) - (a.updated_at?.seconds||0));
        setChats(enriched);
        if(initialChatId){
          const found = enriched.find(c=>c.id===initialChatId);
          if(found) setSelectedChat(found);
          else {
            const snap = await getDoc(doc(db,'chats',initialChatId));
            if(snap.exists()) setSelectedChat({id:snap.id,...snap.data()});
          }
        }
      });

      // طلبات المراسلة
      onSnapshot(query(collection(db,"messageRequests"), where("to","==", u.uid), where("status","==","pending")), s=>{
        setRequests(s.docs.map(d=>({id:d.id,...d.data() as any})));
      });
    });
    return ()=> unsub();
  },[initialChatId]);

  useEffect(()=>{
    if(!selectedChat) return;
    const otherId = selectedChat.members?.find((m:string)=>m!==user?.uid) || selectedChat.otherId;
    if(otherId){
      getDoc(doc(db,'users',otherId)).then(s=>{
        if(s.exists()) setOtherUser(s.data());
        else setOtherUser(selectedChat.otherData || selectedChat.membersInfo?.[otherId]);
      });
    }
    const q = query(collection(db,"chats",selectedChat.id,"messages"), orderBy("created_at","asc"));
    const unsub = onSnapshot(q, s=>{
      setMessages(s.docs.map(d=>({id:d.id,...d.data() as any})));
      setTimeout(()=> bottomRef.current?.scrollIntoView({behavior:'smooth'}), 100);
    });
    return ()=> unsub();
  },[selectedChat, user]);

  const sendMessage = async()=>{
    if(!text.trim() ||!selectedChat ||!user) return;
    await addDoc(collection(db,"chats",selectedChat.id,"messages"),{
      text, senderId: user.uid, created_at: serverTimestamp()
    });
    await updateDoc(doc(db,"chats",selectedChat.id),{ lastMessage: text, updated_at: serverTimestamp() });
    setText("");
  };

  const acceptRequest = async(req:any)=>{
    const chatId = [req.from, req.to].sort().join("_");
    await setDoc(doc(db,"chats",chatId),{
      members: [req.from, req.to],
      membersInfo: {
        [req.from]: { name: req.fromName, avatar: req.fromAvatar },
        [req.to]: { name: user.displayName, avatar: user.photoURL }
      },
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
      lastMessage: req.firstMessage
    });
    await addDoc(collection(db,"chats",chatId,"messages"),{
      text: req.firstMessage, senderId: req.from, created_at: serverTimestamp()
    });
    await updateDoc(doc(db,"messageRequests",req.id),{status:"accepted"});
    setActiveTab('chats');
    const snap = await getDoc(doc(db,'chats',chatId));
    if(snap.exists()) setSelectedChat({id:snap.id,...snap.data()});
  };

  return (
    <div className="min-h-screen bg-[#050a0a] text-white flex flex-col md:flex-row" dir="rtl">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700;800;900&display=swap'); *{font-family:'Tajawal',sans-serif!important;}`}</style>

      {/* قائمة جانبية */}
      <div className={`w-full md:w-[360px] bg-[#0B1418] border-l border-white/10 flex flex-col ${selectedChat?'hidden md:flex':''} h-screen`}>
        <div className="h-[56px] flex items-center justify-between px-4 border-b border-white/10">
          <button onClick={()=>router.push('/')} className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center"><ArrowLeft className="w-5 h-5"/></button>
          <span className="font-black text-lg">الرسائل</span>
          <div className="w-9"/>
        </div>

        <div className="flex bg-white/[0.05] rounded-2xl p-1.5 gap-1.5 m-3 border border-white/10">
          <button onClick={()=>setActiveTab('chats')} className={`flex-1 py-2.5 rounded-xl font-black text-[13px] ${activeTab==='chats'?'bg-[#00E5FF] text-black shadow-lg':'text-white/50'}`}>الدردشات ({chats.length})</button>
          <button onClick={()=>setActiveTab('requests')} className={`flex-1 py-2.5 rounded-xl font-black text-[13px] relative ${activeTab==='requests'?'bg-[#00E5FF] text-black shadow-lg':'text-white/50'}`}>الطلبات {requests.length>0 && <span className="absolute -top-1 -right-1 bg-red-500 w-5 h-5 rounded-full text-[11px] flex items-center justify-center text-white">{requests.length}</span>}</button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 space-y-2 pb-4">
          {activeTab==='chats'? (
            chats.length===0? <div className="text-center text-white/30 mt-20"><MessageCircle className="w-10 h-10 mx-auto mb-2 opacity-20"/>لا توجد دردشات بعد</div> :
            chats.map(c=>(
              <div key={c.id} onClick={()=>setSelectedChat(c)} className={`p-3 rounded-2xl cursor-pointer border flex gap-3 items-center ${selectedChat?.id===c.id?'bg-white/[0.08] border-cyan-400/30':'bg-white/[0.03] border-white/5 hover:bg-white/[0.06]'}`}>
                <img src={c.otherData?.avatar || c.otherData?.photo || `https://i.pravatar.cc/100?u=${c.otherId}`} className="w-11 h-11 rounded-full object-cover"/>
                <div className="flex-1 overflow-hidden">
                  <p className="text-sm font-black truncate">{c.otherData?.displayName || c.otherData?.name || "مستخدم"}</p>
                  <p className="text-xs text-white/50 truncate">{c.lastMessage || "ابدأ المحادثة"}</p>
                </div>
              </div>
            ))
          ) : (
            requests.length===0? <div className="text-center text-white/30 mt-20">لا توجد طلبات مراسلة</div> :
            requests.map(r=>(
              <div key={r.id} className="p-3 rounded-2xl bg-white/[0.04] border border-white/10">
                <div className="flex gap-3 items-center">
                  <img src={r.fromAvatar || `https://i.pravatar.cc/100?u=${r.from}`} className="w-10 h-10 rounded-full"/>
                  <div className="flex-1">
                    <p className="text-sm font-bold">{r.fromName}</p>
                    <p className="text-xs text-white/70 mt-1 bg-white/5 p-2 rounded-xl">{r.firstMessage}</p>
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <button onClick={()=>acceptRequest(r)} className="flex-1 bg-[#00E5FF] text-black py-2 rounded-full font-black text-xs flex items-center justify-center gap-1"><Check className="w-4 h-4"/> قبول وبدء الدردشة</button>
                  <button onClick={()=>updateDoc(doc(db,"messageRequests",r.id),{status:"declined"})} className="bg-white/10 px-4 py-2 rounded-full text-xs"><X className="w-4 h-4"/></button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* نافذة الدردشة */}
      <div className={`flex-1 flex flex-col h-screen bg-[#050a0a] ${!selectedChat?'hidden md:flex':''}`}>
        {selectedChat? <>
          <div className="h-[56px] border-b border-white/10 flex items-center justify-between px-4 bg-[#0B1418]">
            <div className="flex items-center gap-3">
              <button onClick={()=>setSelectedChat(null)} className="md:hidden w-9 h-9 rounded-full bg-white/10 flex items-center justify-center"><ArrowLeft className="w-5 h-5"/></button>
              <img src={otherUser?.avatar || otherUser?.photo || selectedChat.otherData?.avatar || `https://i.pravatar.cc/100?u=${selectedChat.otherId}`} className="w-9 h-9 rounded-full"/>
              <span className="font-bold text-sm">{otherUser?.displayName || selectedChat.otherData?.displayName || "مستخدم"}</span>
              <span className="text-[11px] text-green-400">• متصل</span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map(m=>(
              <div key={m.id} className={`flex ${m.senderId===user?.uid?'justify-end':'justify-start'}`}>
                <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-[14px] ${m.senderId===user?.uid?'bg-[#00E5FF] text-black rounded-br-sm font-medium':'bg-[#122025] border border-[#1A2E35] text-white rounded-bl-sm'}`}>{m.text}</div>
              </div>
            ))}
            <div ref={bottomRef}/>
          </div>

          <div className="p-3 border-t border-white/10 bg-[#0B1418] flex gap-2 items-center">
            <input value={text} onChange={e=>setText(e.target.value)} onKeyDown={e=> e.key==='Enter' && sendMessage()} placeholder="اكتب رسالة..." className="flex-1 bg-white/5 border border-white/10 rounded-full px-5 py-3 text-sm outline-none focus:border-cyan-400/50"/>
            <button onClick={sendMessage} className="bg-[#00E5FF] text-black w-11 h-11 rounded-full flex items-center justify-center shadow-lg"><Send className="w-5 h-5"/></button>
          </div>
        </> : (
          <div className="flex-1 flex flex-col items-center justify-center text-white/20">
            <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-4"><MessageCircle className="w-10 h-10"/></div>
            <p>اختر دردشة لبدء المراسلة</p>
          </div>
        )}
      </div>
    </div>
  )
}