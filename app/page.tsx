"use client";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

type Post = {
  id: string;
  title: string;
  content: string;
  created_at: string;
};

export default function Home() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchPosts = async () => {
    const { data, error } = await supabase
      .from("posts")
      .select("*")
      .order("created_at", { ascending: false }); // الجديد أول
    
    if (!error && data) {
      setPosts(data as Post[]);
    } else {
      console.log("Fetch error:", error);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handlePost = async () => {
    if (!title.trim() || !content.trim()) {
      alert("اكتب العنوان والمحتوى");
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("posts")
      .insert([{ title, content }])
      .select();

    if (error) {
      alert("خطأ في النشر: " + error.message);
      console.log(error);
    } else {
      console.log("نجح النشر:", data);
      setTitle("");
      setContent("");
      await fetchPosts(); // جيب الجديد طوالي
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("posts").delete().eq("id", id);
    if (!error) fetchPosts();
  };

  return (
    <main className="min-h-screen bg-gray-100 p-6" dir="rtl">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-6">بوستاتي - Postatee</h1>

        <div className="bg-white p-5 rounded-xl shadow mb-6">
          <input
            className="w-full border p-3 rounded mb-3"
            placeholder="العنوان - مثلا: بسم الله"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <textarea
            className="w-full border p-3 rounded mb-3"
            rows={4}
            placeholder="المحتوى..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          <button
            onClick={handlePost}
            disabled={loading}
            className="w-full bg-black text-white p-3 rounded font-bold hover:bg-gray-800 disabled:bg-gray-400"
          >
            {loading ? "جاري النشر..." : "انشر"}
          </button>
        </div>

        <div className="space-y-4">
          {posts.length === 0 && <p className="text-center text-gray-500">لا يوجد بوستات بعد</p>}
          {posts.map((post) => (
            <div key={post.id} className="bg-white p-5 rounded-xl shadow">
              <div className="flex justify-between items-start">
                <h2 className="font-bold text-lg">{post.title}</h2>
                <button onClick={() => handleDelete(post.id)} className="text-red-500 text-sm">حذف</button>
              </div>
              <p className="mt-2 text-gray-700 whitespace-pre-wrap">{post.content}</p>
              <p className="mt-2 text-xs text-gray-400">{new Date(post.created_at).toLocaleString('ar-SD')}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}