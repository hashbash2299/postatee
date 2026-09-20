"use client";
import { useState, useEffect } from "react";
import { db } from "./lib/firebase";
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from "firebase/firestore";

export default function Home() {
  const [text, setText] = useState("");
  const [posts, setPosts] = useState<any[]>([]);

  useEffect(() => {
    const q = query(collection(db, "posts"), orderBy("created_at", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setPosts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  const handlePost = async () => {
    if (!text.trim()) return;
    await addDoc(collection(db, "posts"), {
      content: text,
      created_at: serverTimestamp(),
    });
    setText("");
  };

  return (
    <main style={{ maxWidth: 600, margin: "20px auto", padding: 20, fontFamily: "sans-serif" }}>
      <h1>postatee - شغال 🔥</h1>
      <textarea value={text} onChange={e=>setText(e.target.value)} placeholder="بماذا تفكر؟" style={{width:"100%", height:100, padding:10}} />
      <button onClick={handlePost} style={{marginTop:10, padding:"10px 20px", background:"black", color:"white", borderRadius:8}}>نشر</button>
      <hr style={{margin:"20px 0"}}/>
      {posts.map(p=> <div key={p.id} style={{border:"1px solid #ddd", padding:12, marginBottom:10, borderRadius:8}}>{p.content}</div>)}
    </main>
  );
}