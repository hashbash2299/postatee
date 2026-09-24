"use client"
export default function Page(){
  return (
    <div dir="rtl" style={{background:'#000', minHeight:'100vh', padding:20, display:'flex', justifyContent:'center', alignItems:'center'}}>
      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, width:'100%', maxWidth:380}}>
        
        <button 
          onClick={()=>alert('تمت الاضافة')}
          style={{height:52, borderRadius:999, background:'white', color:'black', fontWeight:900, fontSize:16, border:'none'}}>
          إضافة صديق
        </button>

        <button 
          onClick={()=>alert('طلب مراسلة')}
          style={{height:52, borderRadius:999, background:'transparent', color:'#00E5FF', fontWeight:900, fontSize:16, border:'2px solid #00E5FF'}}>
          طلب مراسلة
        </button>

      </div>
    </div>
  )
}