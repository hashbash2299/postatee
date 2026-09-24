export default function Page(){
  return (
    <div dir="rtl" style={{background:'black', minHeight:'100vh', padding:20, color:'white'}}>
      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, maxWidth:400}}>
        <button style={{height:56, borderRadius:999, background:'white', color:'black', fontWeight:900, fontSize:18}}>إضافة صديق</button>
        <button style={{height:56, borderRadius:999, background:'transparent', border:'2px solid #00E5FF', color:'#00E5FF', fontWeight:900, fontSize:18}}>طلب مراسلة</button>
      </div>
    </div>
  )
}