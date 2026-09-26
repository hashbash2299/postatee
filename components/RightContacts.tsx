"use client"
import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot, orderBy, limit } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

export default function RightContacts(){
  const [onlineUsers, setOnlineUsers] = useState<any[]>([]);
  const router = useRouter();

  useEffect(()=>{
    // نجيب كل الناس المتصلة حاليا - لحد 50
    const q = query(
      collection(db, 'users'),
      where('isOnline','==', true),
      limit(50)
    );
    const unsub = onSnapshot(q, (snap)=>{
      const users = snap.docs.map(d=> ({uid: d.id,...d.data()}))
        // استبعد نفسك
       .filter((u:any)=> u.uid!== auth.currentUser?.uid)
        // رتب: مؤسس، مالك، بعدين الباقي
       .sort((a:any,b:any)=>{
          const rank = (r:string)=> r==="مالك"?0 : r==="مؤسس"?1 : r==="شخصية هامة"?2 : 3;
          return rank(a.role) - rank(b.role);
        });
      setOnlineUsers(users);
    });
    return ()=> unsub();
  },[]);

  const openChat = async (target:any)=>{
    const me = auth.currentUser;
    if(!me) return;
    const chatId = [me.uid, target.uid].sort().join('_');
    const chatRef = doc(db, 'chats', chatId);
    const snap = await getDoc(chatRef);
    if(!snap.exists()){
      const mySnap = await getDoc(doc(db,'users', me.uid));
      const myData = mySnap.data();
      await setDoc(chatRef, {
        members: [me.uid, target.uid],
        membersInfo: {
          [me.uid]: { name: myData?.displayName, avatar: myData?.avatar },
          [target.uid]: { name: target.displayName, avatar: target.avatar }
        },
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
        lastMessage: ""
      });
    }
    router.push(`/messages/${chatId}`);
  };

  return (
    <div className="hidden lg:flex w-[300px] h-[calc(100vh-0px)] sticky top-0 flex-col bg-[#0B1418] border-r border-white/10 p-3">
      <div className="flex items-center justify-between px-2 py-3">
        <h3 className="font-black text-white text-[14px]">جهات الاتصال</h3>
        <span className="bg-green-500/20 text-green-400 text-[11px] font-bold px-2.5 py-1 rounded-full border border-green-500/20">
          {onlineUsers.length} متصل
        </span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-1 custom-scroll">
        {onlineUsers.length===0 && (
          <p className="text-white/30 text-xs text-center mt-10">لا يوجد أحد متصل حاليا</p>
        )}
        {onlineUsers.map((u:any)=>(
          <div key={u.uid} onClick={()=>openChat(u)} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/[0.06] cursor-pointer group transition">
            <div className="relative">
              <img src={u.avatar} className="w-9 h-9 rounded-full object-cover bg-white/10" />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-[#0B1418]"></span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-[13px] font-bold truncate group-hover:text-cyan-400">{u.displayName}</p>
              <p className="text-white/40 text-[11px] truncate">@{u.username}</p>
            </div>
            <div className={`w-2 h-2 rounded-full ${u.isOnline?'bg-green-400 shadow-[0_0_6px_#22c55e]':'bg-white/20'}`}></div>
          </div>
        ))}
      </div>

      <div className="pt-3 mt-3 border-t border-white/10 text-[11px] text-white/20 text-center">
        Postatee • منصة سودانية
      </div>
    </div>
  )
}