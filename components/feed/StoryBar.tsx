"use client"
export default function StoryBar(){
  const stories = [
    {id:1,name:"حالتك",isMe:true},
    {id:2,name:"احمد",img:"https://i.pravatar.cc/100?u=1"},
    {id:3,name:"منى",img:"https://i.pravatar.cc/100?u=2"},
    {id:4,name:"خالد",img:"https://i.pravatar.cc/100?u=3"},
  ];
  return (
    <div className="flex gap-3 p-4 overflow-x-auto bg-[#0B1418] lg:bg-transparent border-b lg:border-0 border-white/5 scrollbar-hide">
      {stories.map(s=>(
        <div key={s.id} className="flex flex-col items-center gap-1.5 min-w-[64px] cursor-pointer">
          <div className={`w-[60px] h-[60px] rounded-full p-[3px] ${s.isMe? 'bg-white/20 border-dashed border-2' : 'bg-gradient-to-tr from-yellow-400 to-fuchsia-600'}`}>
            <div className="w-full h-full rounded-full bg-[#0B1418] flex items-center justify-center overflow-hidden">
              {s.isMe? <span className="text-xl text-white">+</span> : <img src={s.img} className="w-full h-full object-cover" />}
            </div>
          </div>
          <span className="text-[11px] text-white/70">{s.name}</span>
        </div>
      ))}
    </div>
  )
}