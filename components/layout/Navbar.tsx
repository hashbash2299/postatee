"use client"
import { useState, useEffect, useRef } from "react";
import { db, auth } from "@/app/lib/firebase";
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { Bell, Home, MessageSquare, LogOut, X } from "lucide-react";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";

const timeAgo = (ts:any) => {
  if(!ts?.seconds) return "الآن";
  const s = Math.floor((Date.now() - ts.seconds*1000)/1000);
  if(s < 60) return "الآن";
  if(s < 3600) return `${Math.floor(s/60)} د`;
  if(s < 86400) return `${Math.floor(s/3600)} س`;
  return `${Math.floor(s/86400)} ي`;
};

export default function Navbar({ currentUser, setOpenComments }: any){
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [showNotif, setShowNotif] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(()=>{
    if(!currentUser?.uid) return;
    const q = query(collection(db, "notifications"), where("toUid","==",currentUser.uid), orderBy("created_at","desc"));
    const unsub = onSnapshot(q, (snap)=>{ setNotifications(snap.docs.map(d=>({id:d.id,...d.data()}))); });
    return () => unsub();
  }, [currentUser]);

  // ✅ عداد الرسائل الحقيقي - بيحسب عدد الرسائل ما عدد الشاتات
  useEffect(()=>{
    if(!currentUser?.uid) return;
    const qChats = query(collection(db, "chats"), where("members", "array-contains", currentUser.uid));
    let unsubMessages: (()=>void)[] = [];
    let counts: Record<string, number> = {};

    const unsubChats = onSnapshot(qChats, (snap)=>{
      // امسح المستمعين القدام
      unsubMessages.forEach(u=>u());
      unsubMessages = [];
      counts = {};
      if(snap.empty){
        setUnreadMessages(0);
        return;
      }
      snap.docs.forEach(chatDoc=>{
        const mq = query(collection(db, "chats", chatDoc.id, "messages"), where("to","==",currentUser.uid), where("read","==",false));
        const unsub = onSnapshot(mq, (msnap)=>{
          counts[chatDoc.id] = msnap.size;
          const total = Object.values(counts).reduce((a,b)=>a+b,0);
          setUnreadMessages(total);
        });
        unsubMessages.push(unsub);
      });
    });

    return ()=>{ unsubChats(); unsubMessages.forEach(u=>u()); };
  }, [currentUser]);

  useEffect(()=>{
    const handleClick = (e:any)=>{ if(notifRef.current &&!notifRef.current.contains(e.target)) setShowNotif(false); };
    document.addEventListener('mousedown', handleClick);
    return ()=> document.removeEventListener('mousedown', handleClick);
  },[]);

  const unreadNotif = notifications.filter(n=>!n.read).length;

  useEffect(()=>{
    if(showNotif && unreadNotif>0){
      const t = setTimeout(async ()=>{
        for(const n of notifications.filter(n=>!n.read)){
          await updateDoc(doc(db,"notifications",n.id),{read:true});
        }
      }, 800);
      return ()=> clearTimeout(t);
    }
  }, [showNotif]);

  const handleNotifClick = async (n:any) => {
    await updateDoc(doc(db, "notifications", n.id), { read: true });
    setShowNotif(false);
    const el = document.getElementById(`post-${n.postId}`);
    if(el){
      el.scrollIntoView({behavior:"smooth", block:"center"});
      el.classList.add("ring-2","ring-violet-500");
      setTimeout(()=>el.classList.remove("ring-2","ring-violet-500"),2000);
      setOpenComments((prev:any)=>({...prev,[n.postId]:true}));
    }
  };

  const markAllRead = async () => { for(const n of notifications.filter(n=>!n.read)) await updateDoc(doc(db,"notifications",n.id),{read:true}); };

  return (
    <>
      <div className="h-[56px] md:h-[60px]" />
      <header className="fixed top-0 left-0 right-0 z-[100] bg-black/90 backdrop-blur-xl border-b border-white/10 px-3 md:px-4 py-2.5 flex items-center justify-between">
        <span className="font-black text-lg md:text-xl tracking-tight shrink-0">Postatee</span>
        <div className="flex items-center gap-1.5 md:gap-3 shrink-0">
          <button onClick={()=>router.push('/')} className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-white/5 flex items-center justify-center"><Home className="w-4 h-4 md:w-5 md:h-5 text-violet-400"/></button>

          <div className="relative" ref={notifRef}>
            <button onClick={()=>setShowNotif(!showNotif)} className="relative w-8 h-8 md:w-9 md:h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
              <Bell className="w-4 h-4 md:w-5 md:h-5 text-white/70"/>
              {unreadNotif>0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center animate-pulse">{unreadNotif>9?'9+':unreadNotif}</span>}
            </button>
            {showNotif && (
              <div className="absolute left-0 md:left-auto md:right-0 mt-2 w-[92vw] md:w-[340px] max-h-[420px] overflow-y-auto bg-[#0a1212] border border-white/10 rounded-2xl shadow-2xl z-50">
                <div className="flex justify-between items-center p-3 border-b border-white/5 sticky top-0 bg-[#0a1212]">
                  <span className="font-bold text-sm">الإشعارات</span>
                  <div className="flex gap-2 items-center">
                    {unreadNotif>0 && <button onClick={markAllRead} className="text-[11px] text-violet-400">تعليم كمقروءة</button>}
                    <button onClick={()=>setShowNotif(false)}><X className="w-4 h-4 text-white/40"/></button>
                  </div>
                </div>
                {notifications.length===0 && <div className="p-8 text-center text-white/30 text-sm">لا توجد إشعارات</div>}
                {notifications.map(n=>(
                  <div key={n.id} onClick={()=>handleNotifClick(n)} className={`flex gap-3 p-3 hover:bg-white/[0.04] cursor-pointer border-b border-white/[0.03] ${!n.read?'bg-violet-500/[0.05]':''}`}>
                    <img src={n.fromAvatar} className="w-9 h-9 rounded-full"/>
                    <div className="flex-1">
                      <p className="text-[13px] leading-4"><span className="font-bold">{n.fromName}</span> {n.type==='like'? 'أعجب بمنشورك':'علق على منشورك'}</p>
                      <p className="text-[11px] text-white/30 mt-1">{timeAgo(n.created_at)}</p>
                    </div>
                    {!n.read && <div className="w-2 h-2 bg-violet-500 rounded-full mt-2"/>}
                  </div>
                ))}
              </div>
            )}
          </div>

          <button onClick={()=>{ setUnreadMessages(0); router.push('/messages'); }} className="relative w-8 h-8 md:w-9 md:h-9 rounded-full bg-white/5 flex items-center justify-center">
            <MessageSquare className="w-4 h-4 md:w-5 md:h-5 text-white/60"/>
            {unreadMessages>0 && <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center animate-pulse">{unreadMessages>9?'9+':unreadMessages}</span>}
          </button>

          <img src={currentUser?.avatar} onClick={()=>router.push(`/profile/${currentUser?.uid}`)} className="w-8 h-8 rounded-full border border-violet-500/30 cursor-pointer"/>
          <button onClick={async()=>{ if(confirm('متأكد تبي تطلع؟')) { await signOut(auth); router.push('/login'); } }} className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center"><LogOut className="w-4 h-4 text-red-400"/></button>
        </div>
      </header>
    </>
  )
}