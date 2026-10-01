"use client"
import { useState } from "react";
import { db, auth } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export default function PublisherPage() {
  const [topic, setTopic] = useState("تحفيز");
  const [loading, setLoading] = useState(false);
  const [lastPost, setLastPost] = useState("");

  const generateAndPublish = async () => {
    setLoading(true);
    try {
      // 1. توليد النص بالذكاء الاصطناعي المجاني
      const prompt = `اكتب بوست قصير وجذاب لمنصة تواصل سودانية اسمها Postatee عن موضوع: ${topic}. خليه بالعامية السودانية خفيفة ومحفزة، اقل من 40 كلمة، بدون هاشتاقات كتير.`;
      
      const res = await fetch(`https://text.pollinations.ai/${encodeURIComponent(prompt)}`);
      const aiText = await res.text();

      setLastPost(aiText);

      // 2. نشره في Postatee مباشرة
      const user = auth.currentUser;
      await addDoc(collection(db, "posts"), {
        content: aiText, // لو عندك اسمو text غيرها لـ text
        text: aiText, // بنكتب الاتنين عشان نضمن
        topic: topic,
        authorId: user ? user.uid : "ai_publisher",
        authorName: "ناشر Postatee 🤖",
        createdAt: serverTimestamp(),
        likes: 0,
        isAI: true
      });

      alert("✅ تم النشر في Postatee!");
    } catch (e: any) {
      alert("خطأ: " + e.message);
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: 20, maxWidth: 600, margin: "auto" }}>
      <h1 style={{ fontSize: 24, fontWeight: "bold" }}>ناشر Postatee بالذكاء الاصطناعي 🤖</h1>
      <p style={{ color: "#666", marginTop: 5 }}>بدون مفتاح - مجاني 100%</p>

      <input 
        value={topic} 
        onChange={e=>setTopic(e.target.value)} 
        placeholder="اكتب الموضوع: رياضة، ضحك، حب..."
        style={{ width: "100%", padding: 12, marginTop: 20, border: "1px solid #ccc", borderRadius: 8 }} 
      />

      <button 
        onClick={generateAndPublish} 
        disabled={loading}
        style={{ width: "100%", marginTop: 15, padding: 12, background: "black", color: "white", borderRadius: 8, opacity: loading ? 0.5 : 1 }}
      >
        {loading ? "جاري التوليد والنشر..." : "ولّد وانشر هسي 🚀"}
      </button>

      {lastPost && (
        <div style={{ marginTop: 20, padding: 15, background: "#f5f5f5", borderRadius: 8 }}>
          <b>آخر بوست اتنشر:</b>
          <p style={{ marginTop: 10 }}>{lastPost}</p>
        </div>
      )}
    </div>
  );
}