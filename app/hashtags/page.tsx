import Link from "next/link";
const tags = ["حكاية_سودانية","قلم_سوداني","ثقافة_سودانية","أدب_سوداني","دارفور","النيل","أم_درمان","شعر_سوداني","الخرطوم"];
export default function HashtagsPage(){
  return (<div dir="rtl" className="min-h-screen bg-[#0B1418] text-white p-6 max-w-[900px] mx-auto"><h1 className="text-2xl font-black mb-6"># هاشتاقات سودانية</h1><div className="grid grid-cols-2 md:grid-cols-3 gap-3">{tags.map(t=><Link key={t} href={`/hashtag/${t}`} className="bg-[#122025] border border-[#1A2E35] p-4 rounded-2xl hover:border-[#00E5FF]"><span className="text-[#00E5FF] font-bold">#{t}</span></Link>)}</div></div>)
}