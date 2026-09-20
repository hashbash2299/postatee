const handlePost = async () => {
    if (!title || !content) return;
    const { data, error } = await supabase.from("posts").insert([{ title, content }]).select();
    alert("Data: " + JSON.stringify(data) + " Error: " + JSON.stringify(error));
    if (!error) {
      setTitle(""); setContent("");
      fetchPosts();
    }
  };