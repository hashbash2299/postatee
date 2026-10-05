"use client"
import { useEffect, useRef, useState } from "react";
import { db } from "@/lib/firebase";
import { doc, setDoc, onSnapshot, deleteDoc, serverTimestamp, collection, addDoc, getDocs } from "firebase/firestore";
import { RTC_CONFIG, AUDIO_CONS } from "@/lib/webrtc/config";

export function useVoiceCall(myUid: string, myData: any) {
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const ringtoneRef = useRef<HTMLAudioElement | null>(null);
  const [incoming, setIncoming] = useState<any>(null);
  const [incomingCallId, setIncomingCallId] = useState<string>("");
  const [status, setStatus] = useState<'idle'|'calling'|'ringing'|'inCall'>('idle');
  const [callId, setCallId] = useState<string>("");

  const setRemoteAudioEl = (el: HTMLAudioElement | null) => {
    remoteAudioRef.current = el;
    if(el){ el.autoplay = true; (el as any).playsInline = true; }
  }
  const setRingtoneEl = (el: HTMLAudioElement | null) => {
    ringtoneRef.current = el;
    if(el){ el.loop = true; el.volume = 0.7; }
  }

  const getCallId = (otherId: string) => [myUid, otherId].sort().join('_');

  useEffect(()=>{
    if(status==='calling' && ringtoneRef.current){
      ringtoneRef.current.src = "https://cdn.pixabay.com/audio/2022/03/10/audio_c8c8a73467.mp3";
      ringtoneRef.current.play().catch(()=>{});
    }
    if(status==='ringing' && ringtoneRef.current){
      ringtoneRef.current.src = "https://cdn.pixabay.com/audio/2021/08/04/audio_0625c6d0b2.mp3";
      ringtoneRef.current.play().catch(()=>{});
    }
    if(status==='idle' || status==='inCall'){
      if(ringtoneRef.current){ ringtoneRef.current.pause(); ringtoneRef.current.currentTime = 0; }
    }
  },[status]);

  useEffect(()=>{
    if(!myUid) return;
    const unsub = onSnapshot(collection(db, "voiceCalls"), snap=>{
      snap.docChanges().forEach(ch=>{
        const data = ch.doc.data();
        const id = ch.doc.id;
        if(id.includes(myUid) && data.from!==myUid && data.type==='offer'){
          setIncoming(data);
          setIncomingCallId(id);
          setCallId(id);
          setStatus('ringing');
        }
        if(id===callId && data.type==='answer' && data.from!==myUid){
          if(pcRef.current && data.sdp){
            pcRef.current.setRemoteDescription({ type:'answer', sdp:data.sdp }).then(()=>{
              setStatus('inCall');
            });
          }
        }
        if(ch.type==='removed' && id===callId){
          endCallInternal();
        }
      });
    });
    return ()=> unsub();
  },[myUid, callId]);

  const setupPC = async (otherId: string, cId: string) => {
    const pc = new RTCPeerConnection(RTC_CONFIG);
    pcRef.current = pc;

    pc.onicecandidate = async e=>{
      if(e.candidate){
        await addDoc(collection(db, "voiceCalls", cId, "candidates"), {
          candidate: e.candidate.toJSON(), from: myUid, createdAt: Date.now()
        });
      }
    };

    pc.ontrack = e=>{
      if(remoteAudioRef.current){
        remoteAudioRef.current.srcObject = e.streams[0];
        remoteAudioRef.current.play().catch(()=>{});
      }
    };

    const stream = await navigator.mediaDevices.getUserMedia(AUDIO_CONS);
    localStreamRef.current = stream;
    stream.getTracks().forEach(t=> pc.addTrack(t, stream));

    onSnapshot(collection(db, "voiceCalls", cId, "candidates"), snap=>{
      snap.docChanges().forEach(async ch=>{
        if(ch.type==='added' && ch.doc.data().from!==myUid){
          try{ await pc.addIceCandidate(new RTCIceCandidate(ch.doc.data().candidate)); }catch{}
        }
      });
    });

    return pc;
  };

  const startCall = async (otherId: string) => {
    const cId = getCallId(otherId);
    setCallId(cId);
    setStatus('calling');
    const pc = await setupPC(otherId, cId);
    const offer = await pc.createOffer({ offerToReceiveAudio: true } as any);
    await pc.setLocalDescription(offer);
    await setDoc(doc(db, "voiceCalls", cId), {
      type:'offer', from:myUid, to:otherId, fromName:myData?.displayName, fromAvatar:myData?.avatar, sdp: offer.sdp, createdAt: serverTimestamp()
    });
  };

  const answerCall = async () => {
    if(!incoming ||!incomingCallId) return;
    const pc = await setupPC(incoming.from, incomingCallId);
    await pc.setRemoteDescription({ type:'offer', sdp: incoming.sdp });
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    await setDoc(doc(db, "voiceCalls", incomingCallId), {
      type:'answer', from:myUid, to:incoming.from, sdp: answer.sdp, createdAt: serverTimestamp()
    }, { merge:true });
    setStatus('inCall');
  };

  const endCallInternal = ()=>{
    pcRef.current?.close(); pcRef.current=null;
    localStreamRef.current?.getTracks().forEach(t=>t.stop());
    setStatus('idle'); setIncoming(null); setIncomingCallId("");
  };

  const endCall = async (otherId?: string) => {
    const cId = otherId? getCallId(otherId) : callId;
    endCallInternal();
    if(cId){
      try{ await deleteDoc(doc(db,"voiceCalls",cId)); }catch{}
    }
    setCallId("");
  };

  return { incoming, status, startCall, answerCall, endCall, setRemoteAudioEl, setRingtoneEl };
}