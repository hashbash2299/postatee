"use client"
import { useState } from "react";
import { db } from "../../lib/firebase";
import { collection, getDocs, doc, getDoc, updateDoc } from "firebase/firestore";

export default function FixOld() {
  const [log, setLog] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const runFix = async () => {
    setLoading(true);
    setLog(["بدأ الإصلاح..."]);

    // 1. جيب كل اليوزرز
    const usersSnap = await getDocs(collection(db, 'users'));
    const usersMap: any = {};
    usersSnap.forEach(d => usersMap[d.id] = d.data());
    setLog(p=>[...p, `لقيت ${usersSnap.size} يوزر`]);

    // 2. صلح كل البوستات
    const postsSnap = await getDocs(collection(db, 'posts'));
    for(const postDoc of postsSnap.docs){
      const post = postDoc.data();
      const uid = post.uid || post.authorId;
      const u = usersMap[uid];
      if(u){
        await updateDoc(doc(db, 'posts', postDoc.id), {
          authorName: u.displayName,
          authorUsername: u.username,
          authorAvatar: u.avatar,
          authorRole: u.role || "",
        });
      }
    }
    setLog(p=>[...p, `صلحت ${postsSnap.size} بوست`]);

    // 3. صلح كل التعليقات
    let commentCount = 0;
    for(const postDoc of postsSnap.docs){
      const commentsSnap = await getDocs(collection(db, 'posts', postDoc.id, 'comments'));
      for(const c of commentsSnap.docs){
        const cd = c.data();
        const uid = cd.uid || cd.authorId;
        const u = usersMap[uid];
        if(u){
          await updateDoc(doc(db, 'posts', postDoc.id, 'comments', c.id), {
            authorName: u.displayName,
            authorUsername: u.username,
            authorAvatar: u.avatar,
            authorRole: u.role || "",
          });
          commentCount++;
        }
      }
    }
    setLog(p=>[...p, `صلحت ${commentCount} تعليق - تم ✅`]);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-black text-white p-8" dir="rtl">
      <h1 className="text-2xl font-black mb-4">إصلاح الحسابات القديمة</h1>
      <p className="text-white/60 mb-4">اضغط مرة واحدة فقط، حتاخد 10-20 ثانية</p>
      <button onClick={runFix} disabled={loading} className="bg-cyan-400 text-black font-black px-8 py-3 rounded-full">
        {loading? "جاري الإصلاح..." : "ابدأ الإصلاح الآن"}
      </button>
      <div className="mt-6 bg-white/5 p-4 rounded-xl space-y-2">
        {log.map((l,i)=><p key={i} className="text-sm">{l}</p>)}
      </div>
    </div>
  );
}