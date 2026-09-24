export default function Page(){
  return (
    <div dir="rtl" style={{background:'#050a0a', minHeight:'100vh', padding:16, color:'white', fontFamily:'Tajawal'}}>
      <h1 style={{fontSize:22, fontWeight:900, marginBottom:20}}>Hashem Abbas - مؤسس</h1>
      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, maxWidth:400}}>
        <button style={{height:48, borderRadius:999, background:'white', color:'black', fontWeight:900}}>إضافة صديق</button>
        <button style={{height:48, borderRadius:999, background:'transparent', border:'2px solid #00E5FF', color:'#00E5FF', fontWeight:900}}>طلب مراسلة</button>
      </div>
      <p style={{marginTop:20, opacity:0.5, fontSize:12}}>لو شفت الزرين ديل - الرفع نجح</p>
    </div>
  )
}