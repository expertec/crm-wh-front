// src/hooks/useAudioRecorder.js
import { useState, useEffect, useRef } from 'react';

export default function useAudioRecorder() {
  const [recording, setRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  useEffect(() => {
    // solo una vez, al montar
    async function init() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mr = new MediaRecorder(stream);
        mr.ondataavailable = e => {
          chunksRef.current.push(e.data);
        };
        mr.onstop = () => {
          const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
          setAudioUrl(URL.createObjectURL(blob));
          chunksRef.current = [];
        };
        mediaRecorderRef.current = mr;
      } catch (err) {
        console.error('No se pudo acceder al micrófono:', err);
      }
    }
    init();
    // limpiar al desmontar
    return () => {
      mediaRecorderRef.current?.stream.getTracks().forEach(t => t.stop());
    };
  }, []);

  const startRecording = () => {
    if (!mediaRecorderRef.current) return;
    chunksRef.current = [];
    setAudioUrl(null);
    mediaRecorderRef.current.start();
    setRecording(true);
  };

  const stopRecording = () => {
    if (!mediaRecorderRef.current) return;
    mediaRecorderRef.current.stop();
    setRecording(false);
  };

  return { recording, startRecording, stopRecording, audioUrl };
}
