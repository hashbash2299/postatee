"use client"
import { useEffect, useRef, useState } from "react";
import { db } from "@/lib/firebase";
import { doc, setDoc, onSnapshot, deleteDoc, serverTimestamp, collection, addDoc } from "firebase/firestore";

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "turn:openrelay.metered.ca:80", username: "openrelayproject", credential: "openrelayproject" }
  ]
};

export function useVoiceCall(myUid: string, myData: any) {
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const [incoming, setIncoming] = useState<any>(null);
  const [incomingCallId, setIncomingCallId] = useState<string>("");
  const [status, setStatus] = useState<'idle'|'calling'|'ringing'|'inCall'>('idle');
  const [callId, setCallId] = useState<string>("");

  const getCallId = (otherId: string) => [myUid, otherId].sort().join('_');

  useEffect(()=>{
    if(!myUid) return;
    const unsub = onSnapshot(collection(db, "voiceCalls"), snap=>{
      snap.forEach(d=>{
        const data = d.data(); const id = d.id;
        if(id.includes(myUid) && data.from!==myUid && data.type==='offer' && status==='idle'){
          setIncoming(data); setIncomingCallId(id); setCallId(id); setStatus('ringing');
          try{ const a = new Audio("https://actions.google.com/sounds/v1/ringtones/phone_ringing.ogg"); a.loop=true; a.play(); (window as any)._ring=a; }catch{}
        }
        if(id===callId && data.type==='answer' && data.from!==myUid && status==='calling'){
          pcRef.current?.setRemoteDescription(new RTCSessionDescription({ type:'answer', sdp:data.sdp })).then(()=> {
            setStatus('inCall');
            try{ (window as any)._ring?.pause(); }catch{}
          });
        }
      });
    });
    return ()=> unsub();
  },[myUid, callId, status]);

  const setupPC = async (cId: string) => {
    const pc = new RTCPeerConnection(RTC_CONFIG);
    pcRef.current = pc;
    pc.onicecandidate = e=>{
      if(e.candidate) addDoc(collection(db, "voiceCalls", cId, "candidates"), { candidate: e.candidate.toJSON(), from: myUid });
    };
    pc.ontrack = e=>{
      if(remoteAudioRef.current){
        remoteAudioRef.current.srcObject = e.streams[0];
        remoteAudioRef.current.play().catch(()=>{});
      }
    };
    const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation:true, noiseSuppression:true, autoGainControl:true }, video:false });
    localStreamRef.current = stream;
    stream.getTracks().forEach(t=> pc.addTrack(t, stream));
    onSnapshot(collection(db, "voiceCalls", cId, "candidates"), s=>{
      s.docChanges().forEach(async c=>{
        if(c.type==='added' && c.doc.data().from!==myUid){
          try{ await pc.addIceCandidate(new RTCIceCandidate(c.doc.data().candidate)); }catch{}
        }
      });
    });
    return pc;
  };

  const startCall = async (otherId: string) => {
    const cId = getCallId(otherId); setCallId(cId); setStatus('calling');
    const pc = await setupPC(cId);
    const offer = await pc.createOffer({ offerToReceiveAudio:true } as any);
    await pc.setLocalDescription(offer);
    await setDoc(doc(db, "voiceCalls", cId), { type:'offer', from:myUid, to:otherId, fromName:myData?.displayName, fromAvatar:myData?.avatar, sdp:offer.sdp, createdAt:serverTimestamp() });
  };

  const answerCall = async () => {
    if(!incoming ||!incomingCallId) return;
    try{ (window as any)._ring?.pause(); }catch{}
    const pc = await setupPC(incomingCallId);
    await pc.setRemoteDescription(new RTCSessionDescription({ type:'offer', sdp:incoming.sdp }));
    const answer = await pc.createAnswer(); await pc.setLocalDescription(answer);
    await setDoc(doc(db, "voiceCalls", incomingCallId), { type:'answer', from:myUid, to:incoming.from, sdp:answer.sdp, createdAt:serverTimestamp() }, { merge:true });
    setStatus('inCall');
  };

  const endCall = async (otherId?: string) => {
    const cId = otherId? getCallId(otherId) : callId;
    try{ (window as any)._ring?.pause(); }catch{}
    pcRef.current?.close(); pcRef.current=null;
    localStreamRef.current?.getTracks().forEach(t=>t.stop());
    setStatus('idle'); setIncoming(null); setIncomingCallId(""); setCallId("");
    if(cId) try{ await deleteDoc(doc(db,"voiceCalls",cId)); }catch{}
  };

  return { incoming, status, startCall, answerCall, endCall, remoteAudioRef };
}