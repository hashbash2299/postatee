async function fetchPosts() {
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .order("created_at", { ascending: false })
  
  if (error) {
    console.log("Fetch error:", error.message)
    alert("خطأ في جلب البيانات: " + error.message)
    return
  }
  if (data) setPosts(data)
}

async function addPost() {
  if (!title.trim()) {
    alert("اكتب عنوان البوست")
    return
  }
  console.log("بنحاول ننشر...", { title, content })
  
  const { data, error } = await supabase
    .from("posts")
    .insert([{ title, content }])
    .select()
    
  if (error) {
    alert("الخطأ هو: " + error.message)
    console.log("Insert error full:", error)
  } else {
    console.log("نجح النشر:", data)
    setTitle("")
    setContent("")
    fetchPosts()
  }
}