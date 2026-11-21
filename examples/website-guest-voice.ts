// Call from a user gesture. Capture a draft; uploading/sending is a separate action.
export async function startVoiceRecording() {
  if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
    throw new Error('CHAT_RECORDING_UNSUPPORTED');
  }
  const format = [
    { mimeType: 'audio/webm;codecs=opus', extension: 'webm' },
    { mimeType: 'audio/mp4', extension: 'mp4' },
    { mimeType: 'audio/ogg;codecs=opus', extension: 'ogg' },
  ].find(value => MediaRecorder.isTypeSupported(value.mimeType));
  if (!format) throw new Error('CHAT_RECORDING_UNSUPPORTED');
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const release = () => stream.getTracks().forEach(track => track.stop());
  let recorder: MediaRecorder;
  try { recorder = new MediaRecorder(stream, { mimeType: format.mimeType }); }
  catch (error) { release(); throw error; }
  const chunks: Blob[] = [];
  let failure: unknown;
  let canceled = false;
  let finish: Promise<File> | undefined;
  recorder.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
  recorder.onerror = event => { failure = event; release(); };
  // Always release microphone tracks, including an unexpected browser-side stop.
  recorder.addEventListener('stop', release, { once: true });
  try { recorder.start(); }
  catch (error) { release(); throw error; }
  return {
    stop(): Promise<File> {
      if (finish) return finish;
      if (failure || canceled || recorder.state === 'inactive') {
        release(); return Promise.reject(failure ?? new Error('CHAT_RECORDING_STOPPED'));
      }
      finish = new Promise((resolve, reject) => {
        recorder.addEventListener('stop', () => {
          if (failure || canceled) { reject(failure ?? new Error('CHAT_RECORDING_CANCELED')); return; }
          const blob = new Blob(chunks, { type: recorder.mimeType.split(';')[0] });
          if (!blob.size) { reject(new Error('CHAT_RECORDING_EMPTY')); return; }
          resolve(new File([blob], `recording.${format.extension}`, { type: blob.type }));
        }, { once: true });
        recorder.stop();
      });
      return finish;
    },
    cancel() {
      canceled = true;
      if (recorder.state !== 'inactive') recorder.stop();
      release();
    },
  };
}
