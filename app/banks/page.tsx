"use client"
import { useState, useEffect } from "react";
import { db, auth } from "@/lib/firebase";
import { collection, addDoc, onSnapshot, query, where, serverTimestamp } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

export default function BanksPage() {
  const [banks, setBanks] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) {
        const q = query(collection(db, "banks"), where("ownerId", "==", u.uid));
        const unsub = onSnapshot(q, (snap) => {
          setBanks(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });
        return () => unsub();
      }
    });
    return () => unsubAuth();
  }, []);

  const createBank = async () => {
    if (!user) return alert("سجل دخول اول");
    if (!name || !amount) return alert("اكتب الاسم والمبلغ");
    
    await addDoc(collection(db, "banks"), {
      ownerId: user.uid,
      name,
      amount: Number(amount),
      remaining: Number(amount),
      createdAt: serverTimestamp()
    });
    setName(""); setAmount("");
    alert("تم انشاء البنك ✅");
  };

  return (
    <div style={{ padding: 20, maxWidth: 600, margin: "auto" }}>
      <h1 style={{ fontSize: 24, fontWeight: "bold" }}>بنوكي - Postatee</h1>
      
      <div style={{ marginTop: 20, display: "flex", gap: 10 }}>
        <input value={name} onChange={e=>setName(e.target.value)} placeholder="اسم البنك" style={{ flex:1, padding: 10, border: "1px solid #ccc" }} />
        <input value={amount} onChange={e=>setAmount(e.target.value)} type="number" placeholder="المبلغ" style={{ flex:1, padding: 10, border: "1px solid #ccc" }} />
        <button onClick={createBank} style={{ padding: "10px 20px", background: "black", color: "white" }}>انشاء</button>
      </div>

      <div style={{ marginTop: 30 }}>
        {banks.map(b => (
          <div key={b.id} style={{ border: "1px solid #eee", padding: 15, marginBottom: 10 }}>
            <b>{b.name}</b> - الكلي: {b.amount} - المتبقي: {b.remaining}
          </div>
        ))}
        {banks.length === 0 && <p>لا يوجد بنوك بعد</p>}
      </div>
    </div>
  );
}