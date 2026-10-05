"use client"
import { useEffect, useRef, useState } from "react";
import { db } from "@/lib/firebase";
import { doc, setDoc, onSnapshot, deleteDoc, serverTimestamp, collection, addDoc } from "firebase/firestore";
import { RTC_CONFIG, AUDIO_CONS } from "@/lib/webrtc/config";

export function useVoiceCall(myUid: string, myData: any) {
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const [incoming, setIncoming] = useState<any>(null);
  const [status, setStatus] = useState<'idle'|'calling'|'ringing'|'inCall'>('idle');
  const [remoteAudio, setRemoteAudio] = useState<HTMLAudioElement | null>(null);

  useEffect(() => {
    const el = new Audio(); el.autoplay = true; setRemoteAudio(el);
    if(!myUid) return;
    // اسمع اي مكالمة جاية لي
    const unsub = onSnapshot(doc(db, "voiceCalls", myUid), snap => {
      if(snap.exists() && snap.data().type === 'offer'){
        setIncoming(snap.data());
        setStatus('ringing');
      }
    });
    return () => unsub();
  }, [myUid]);

  const createPC = async (otherId: string, isCaller: boolean) => {
    const pc = new RTCPeerConnection(RTC_CONFIG);
    pcRef.current = pc;

    // ICE
    pc.onicecandidate = async e => {
      if(e.candidate){
        await addDoc(collection(db, "voiceCalls", `${[myUid, otherId].sort().join('_')}`, "candidates"), {
          candidate: e.candidate.toJSON(), from: myUid
        });
      }
    };

    pc.ontrack = e => {
      if(remoteAudio){ remoteAudio.srcObject = e.streams[0]; remoteAudio.play().catch(()=>{}); }
    };

    const stream = await navigator.mediaDevices.getUserMedia(AUDIO_CONS);
    localStreamRef.current = stream;
    stream.getTracks().forEach(t => pc.addTrack(t, stream));

    // اسمع الـ ICE التاني
    const otherCandidatesUnsub = onSnapshot(collection(db, "voiceCalls", `${[myUid, otherId].sort().join('_')}`, "candidates"), snap => {
      snap.docChanges().forEach(ch => {
        if(ch.type==='added' && ch.doc.data().from!==myUid){
          pc.addIceCandidate(new RTCIceCandidate(ch.doc.data().candidate)).catch(()=>{});
        }
      });
    });

    return { pc, unsub: otherCandidatesUnsub };
  };

  const startCall = async (otherId: string) => {
    setStatus('calling');
    const { pc } = await createPC(otherId, true);
    const offer = await pc.createOffer({ offerToReceiveAudio: true });
    // تصغير الصوت لـ 12kbps زي ايمو
    offer.sdp = offer.sdp?.replace(/a=fmtp:111.*\r\n/, "a=fmtp:111 minptime=10;useinbandfec=1;maxaveragebitrate=12000\r\n");
    await pc.setLocalDescription(offer);

    await setDoc(doc(db, "voiceCalls", otherId), {
      type: 'offer', from: myUid, fromName: myData?.displayName, fromAvatar: myData?.avatar, sdp: offer.sdp, createdAt: serverTimestamp()
    });

    // انتظر الرد
    const unsubAns = onSnapshot(doc(db, "voiceCalls", myUid), async snap => {
      if(snap.exists() && snap.data().type==='answer'){
        await pc.setRemoteDescription({ type: 'answer', sdp: snap.data().sdp });
        setStatus('inCall'); unsubAns();
      }
    });
  };

  const answerCall = async () => {
    if(!incoming) return;
    const { pc } = await createPC(incoming.from, false);
    await pc.setRemoteDescription({ type: 'offer', sdp: incoming.sdp });
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    await setDoc(doc(db, "voiceCalls", incoming.from), {
      type: 'answer', from: myUid, sdp: answer.sdp, createdAt: serverTimestamp()
    });
    setStatus('inCall'); setIncoming(null);
  };

  const endCall = async (otherId?: string) => {
    pcRef.current?.close();
    localStreamRef.current?.getTracks().forEach(t=> t.stop());
    const target = otherId || incoming?.from;
    if(myUid) await deleteDoc(doc(db, "voiceCalls", myUid)).catch(()=>{});
    if(target) await deleteDoc(doc(db, "voiceCalls", target)).catch(()=>{});
    setStatus('idle'); setIncoming(null);
  };

  return { incoming, status, startCall, answerCall, endCall };
}