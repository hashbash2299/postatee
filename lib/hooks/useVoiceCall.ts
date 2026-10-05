"use client"
import { useEffect, useRef, useState } from "react";
import { db } from "@/lib/firebase";
import { doc, setDoc, onSnapshot, deleteDoc, serverTimestamp, collection, addDoc } from "firebase/firestore";

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "turn:openrelay.metered.ca:80", username: "openrelayproject", credential: "openrelayproject" },
    { urls: "turn:openrelay.metered.ca:443", username: "openrelayproject", credential: "openrelayproject" },
    { urls: "turn:openrelay.metered.ca:443?transport=tcp", username: "openrelayproject", credential: "openrelayproject" }
  ],
};

export function useVoiceCall(myUid: string, myData: any) {
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const candUnsub = useRef<(() => void) | null>(null);

  const [incoming, setIncoming] = useState<any>(null);
  const [incomingCallId, setIncomingCallId] = useState("");
  const [status, setStatus] = useState<'idle'|'calling'|'ringing'|'inCall'>('idle');
  const [callId, setCallId] = useState("");
  const [micError, setMicError] = useState("");

  const getCallId = (otherId: string) => [myUid, otherId].sort().join('_');

  const endCallLocal = () => {
    if(candUnsub.current){ candUnsub.current(); candUnsub.current=null; }
    try{ pcRef.current?.close(); }catch{}
    pcRef.current=null;
    localStreamRef.current?.getTracks().forEach(t=>t.stop());
    localStreamRef.current=null;
    if(remoteAudioRef.current) remoteAudioRef.current.srcObject=null;
    setStatus('idle'); setIncoming(null); setIncomingCallId(""); setCallId("");
  };

  // مستمع واحد فقط لكل شي
  useEffect(()=>{
    if(!myUid) return;
    const unsub = onSnapshot(collection(db, "voiceCalls"), async (snap)=>{
      for(const ch of snap.docChanges()){
        const data = ch.doc.data() as any;
        const id = ch.doc.id;

        if((ch.type==='added' || ch.type==='modified') && data.to===myUid && data.from!==myUid && data.type==='offer' && status==='idle'){
          setIncoming(data); setIncomingCallId(id); setCallId(id); setStatus('ringing');
        }
        if((ch.type==='modified') && id===callId && data.type==='answer' && pcRef.current && pcRef.current.signalingState!=='stable'){
          try{ await pcRef.current.setRemoteDescription(new RTCSessionDescription({type:'answer', sdp:data.sdp})); setStatus('inCall'); }catch(e){ console.log(e) }
        }
        if((ch.type==='modified' || ch.type==='removed') && id===callId && (data.type==='ended' || ch.type==='removed')){
          endCallLocal();
        }
      }
    });
    return ()=> unsub();
  },[myUid, callId, status]);

  const getMic = async ()=>{
    setMicError("");
    try{
      return await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true, noiseSuppression:true, autoGainControl:true}, video:false});
    }catch(err:any){
      setMicError(err.name==='NotAllowedError'? "افتح المايك من القفل فوق" : "فشل المايك");
      return null;
    }
  };

  const startCall = async (otherId: string) => {
    console.log("startCall clicked", otherId, myUid, status);
    if(!otherId ||!myUid) return;
    if(status!=='idle'){ console.log("busy", status); return; }

    const stream = await getMic();
    if(!stream) return;

    const cId = getCallId(otherId);
    setCallId(cId); setStatus('calling');

    const pc = new RTCPeerConnection(RTC_CONFIG);
    pcRef.current = pc;
    localStreamRef.current = stream;
    stream.getTracks().forEach(t=> pc.addTrack(t, stream));

    pc.onicecandidate = e=>{ if(e.candidate) addDoc(collection(db,"voiceCalls",cId,"candidates"), {candidate:e.candidate.toJSON(), from:myUid}); };
    pc.ontrack = e=>{ if(remoteAudioRef.current){ remoteAudioRef.current.srcObject=e.streams[0]; remoteAudioRef.current.play().catch(()=>{}); } };
    pc.onconnectionstatechange = ()=>{ if(pc.connectionState==='connected') setStatus('inCall'); };

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    await setDoc(doc(db,"voiceCalls",cId), {type:'offer', from:myUid, to:otherId, fromName:myData?.displayName||'مستخدم', fromAvatar:myData?.avatar||'', sdp:offer.sdp, createdAt:serverTimestamp()});

    if(candUnsub.current) candUnsub.current();
    candUnsub.current = onSnapshot(collection(db,"voiceCalls",cId,"candidates"), s=>{
      s.docChanges().forEach(async c=>{ if(c.type==='added' && c.doc.data().from!==myUid){ try{ await pc.addIceCandidate(new RTCIceCandidate(c.doc.data().candidate)); }catch{} } });
    });
  };

  const answerCall = async ()=>{
    console.log("answer clicked");
    if(!incoming ||!incomingCallId) return;
    try{ if(remoteAudioRef.current){ remoteAudioRef.current.muted=false; await remoteAudioRef.current.play().catch(()=>{}); } }catch{}

    const stream = await getMic();
    if(!stream) return;

    const pc = new RTCPeerConnection(RTC_CONFIG);
    pcRef.current = pc;
    localStreamRef.current = stream;
    stream.getTracks().forEach(t=> pc.addTrack(t, stream));

    pc.onicecandidate = e=>{ if(e.candidate) addDoc(collection(db,"voiceCalls",incomingCallId,"candidates"), {candidate:e.candidate.toJSON(), from:myUid}); };
    pc.ontrack = e=>{ if(remoteAudioRef.current){ remoteAudioRef.current.srcObject=e.streams[0]; remoteAudioRef.current.play().catch(()=>{}); } };

    await pc.setRemoteDescription(new RTCSessionDescription({type:'offer', sdp:incoming.sdp}));
    const ans = await pc.createAnswer();
    await pc.setLocalDescription(ans);
    await setDoc(doc(db,"voiceCalls",incomingCallId), {type:'answer', from:myUid, to:incoming.from, sdp:ans.sdp}, {merge:true});
    setStatus('inCall');

    if(candUnsub.current) candUnsub.current();
    candUnsub.current = onSnapshot(collection(db,"voiceCalls",incomingCallId,"candidates"), s=>{
      s.docChanges().forEach(async c=>{ if(c.type==='added' && c.doc.data().from!==myUid){ try{ await pc.addIceCandidate(new RTCIceCandidate(c.doc.data().candidate)); }catch{} } });
    });
  };

  const endCall = async (otherId?: string)=>{
    const cId = otherId? getCallId(otherId) : callId;
    endCallLocal();
    if(cId){ try{ await setDoc(doc(db,"voiceCalls",cId), {type:'ended'}, {merge:true}); setTimeout(()=>deleteDoc(doc(db,"voiceCalls",cId)).catch(()=>{}), 1000); }catch{} }
  };

  return { incoming, status, micError, startCall, answerCall, endCall, remoteAudioRef };
}