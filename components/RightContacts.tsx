"use client"
import { useEffect, useState } from "react";
import { collection, onSnapshot, query, limit } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

export default function RightContacts(){
  const [users, setUsers] = useState<any[]>([]);
  const router = useRouter();

  useEffect(()=>{
    // مؤقتا نجيب كل اليوزرات لحد ما تظبط الـ isOnline
    const q = query(collection(db, 'users'), limit(30));
    return onSnapshot(q, (snap)=>{
      const list = snap.docs.map(d=>({uid:d.id,...d.data()}))
       .filter((u:any)=> u.uid!== auth.currentUser?.uid);
      setUsers(list);
    });
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
    <div className="hidden lg:flex w-[300px] h-screen sticky top-0 flex-col bg-[#0B1418] border-r border-white/10 p-3 shrink-0">
      <div className="flex items-center justify-between px-2 py-3">
        <h3 className="font-black text-white text-[14px]">جهات الاتصال</h3>
        <span className="bg-green-500/20 text-green-400 text-[11px] font-bold px-2.5 py-1 rounded-full border border-green-500/20">{users.length}</span>
      </div>
      <div className="flex-1 overflow-y-auto space-y-1">
        {users.map((u:any)=>(
          <div key={u.uid} onClick={()=>openChat(u)} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/[0.06] cursor-pointer group">
            <div className="relative">
              <img src={u.avatar || `https://i.pravatar.cc/100?u=${u.uid}`} className="w-9 h-9 rounded-full object-cover bg-white/10" />
              <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#0B1418] ${u.isOnline? 'bg-green-400' : 'bg-white/20'}`}></span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-[13px] font-bold truncate group-hover:text-cyan-400">{u.displayName || u.username}</p>
              <p className="text-white/40 text-[11px] truncate">{u.isOnline? 'متصل الآن' : 'غير متصل'}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}