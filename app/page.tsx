"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Home() {
  const [posts, setPosts] = useState<any[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const fetchPosts = async () => {
    const { data } = await supabase.from("posts").select("*").order("created_at", { ascending: false });
    if (data) setPosts(data);
  };

  useEffect(() => { fetchPosts(); }, []);

  const handlePost = async () => {
    if (!title || !content) return;
    const { data, error } = await supabase.from("posts").insert([{ title, content }]).select();
    console.log("نجح النشر:", data, error);
    if (!error) {
      setTitle(""); setContent("");
      fetchPosts();
    }
  };

  return (
    <main style={{ padding: 20 }}>
      <h1>Postatee</h1>
      <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="العنوان" style={{display:'block', margin:10, padding:10, width:'90%'}}/>
      <textarea value={content} onChange={e=>setContent(e.target.value)} placeholder="المحتوى" style={{display:'block', margin:10, padding:10, width:'90%'}}/>
      <button onClick={handlePost} style={{padding:10}}>انشر</button>
      <hr/>
      {posts.map(p=>(
        <div key={p.id} style={{border:'1px solid #ccc', margin:10, padding:10}}>
          <h3>{p.title}</h3><p>{p.content}</p>
        </div>
      ))}
    </main>
  );
}