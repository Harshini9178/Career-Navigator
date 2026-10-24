/**
 * Media Management & Cleanup Service for Career Navigator Mock Interview
 * Ensures real browser camera, microphone, and speech recognition tracks are cleanly terminated.
 */

export interface MediaCleanupRefs {
  streamRef?: { current: MediaStream | null };
  videoRef?: { current: HTMLVideoElement | null };
  recognitionRef?: { current: any };
  activeStreamsRef?: { current: Set<MediaStream> };
  audioContextRef?: { current: AudioContext | null };
  audioSourceRef?: { current: MediaStreamAudioSourceNode | null };
  animFrameRef?: { current: number | null };
  isRecordingRef?: { current: boolean };
  isMountedRef?: { current: boolean };
}

export interface MediaStateSetters {
  setIsCameraOn?: (active: boolean) => void;
  setIsRecording?: (recording: boolean) => void;
  setIsMicMuted?: (muted: boolean) => void;
  setMicVolume?: (volume: number) => void;
  setSpeechStatus?: (status: 'idle' | 'listening' | 'processing' | 'unavailable' | 'error') => void;
  setInterimTranscript?: (text: string) => void;
  setIsSpeaking?: (speaking: boolean) => void;
}

/**
 * Safely stops all tracks in a MediaStream reference.
 * Guarantees every audio and video track reaches readyState === 'ended'.
 */
export function stopMediaStream(stream: MediaStream | null | undefined): void {
  if (!stream) return;
  try {
    const tracks = stream.getTracks ? stream.getTracks() : [];
    tracks.forEach((track) => {
      try {
        track.enabled = false;
        if (track.readyState !== 'ended' && typeof track.stop === 'function') {
          track.stop();
        }
      } catch (_trackErr) {
        // Safe track stop ignore
      }
    });
  } catch (_streamErr) {
    // Safe stream inspection ignore
  }
}

/**
 * Safely stops an active MediaRecorder instance and removes event listeners.
 */
export function stopMediaRecorder(recorder: any): void {
  if (!recorder) return;
  try {
    if (recorder.state && recorder.state !== 'inactive') {
      recorder.stop();
    }
  } catch (_e) {
    // Ignore recorder stop error
  }
}

/**
 * Pauses a video element, terminates any tracks attached to its srcObject,
 * and releases srcObject by setting it to null.
 */
export function stopVideoElement(videoEl: HTMLVideoElement | null | undefined): void {
  if (!videoEl) return;
  try {
    const currentSrc = videoEl.srcObject as MediaStream | null;
    if (currentSrc) {
      stopMediaStream(currentSrc);
    }
  } catch (_srcErr) {
    // Ignore error reading srcObject
  }

  try {
    if (typeof videoEl.pause === 'function') {
      videoEl.pause();
    }
  } catch (_pauseErr) {
    // Ignore video pause error
  }

  try {
    videoEl.srcObject = null;
  } catch (_clearErr) {
    // Ignore
  }
}

/**
 * Stops and aborts an active Web Speech API SpeechRecognition instance,
 * detaching all event handlers to prevent auto-restart.
 */
export function stopSpeechRecognition(recognition: any): void {
  if (!recognition) return;
  try {
    recognition.onresult = null;
    recognition.onerror = null;
    recognition.onend = null;
    recognition.onstart = null;

    if (typeof recognition.abort === 'function') {
      recognition.abort();
    } else if (typeof recognition.stop === 'function') {
      recognition.stop();
    }
  } catch (_speechErr) {
    // Recognition may already be stopped
  }
}

/**
 * Disconnects and terminates Web Audio API nodes and contexts.
 */
export function stopAudioTelemetry(
  audioContext: AudioContext | null | undefined,
  audioSource?: MediaStreamAudioSourceNode | null | undefined,
  animFrameId?: number | null | undefined
): void {
  if (animFrameId && typeof cancelAnimationFrame === 'function') {
    try {
      cancelAnimationFrame(animFrameId);
    } catch (_e) {}
  }

  if (audioSource) {
    try {
      audioSource.disconnect();
    } catch (_e) {}
  }

  if (audioContext && audioContext.state !== 'closed') {
    try {
      audioContext.close();
    } catch (_e) {}
  }
}

/**
 * Comprehensive, reusable media cleanup for Mock Interview sessions.
 * Stops all media stream tracks, clears video element, stops speech recognition,
 * cancels audio telemetry, and safely resets UI state.
 */
export function stopInterviewMediaSession(
  refs: MediaCleanupRefs,
  setters?: MediaStateSetters
): void {
  // 1. Stop Speech Recognition
  if (refs.recognitionRef?.current) {
    stopSpeechRecognition(refs.recognitionRef.current);
    refs.recognitionRef.current = null;
  }
  if (refs.isRecordingRef) {
    refs.isRecordingRef.current = false;
  }

  // 2. Stop Main MediaStream Tracks
  if (refs.streamRef?.current) {
    stopMediaStream(refs.streamRef.current);
    refs.streamRef.current = null;
  }

  // 3. Stop All Additional Active MediaStreams (if any were acquired or in flight)
  if (refs.activeStreamsRef?.current) {
    refs.activeStreamsRef.current.forEach((s) => {
      stopMediaStream(s);
    });
    refs.activeStreamsRef.current.clear();
  }

  // 4. Clear Video Element Preview & Attached MediaStreams
  if (refs.videoRef?.current) {
    stopVideoElement(refs.videoRef.current);
  }

  // 5. Cancel Audio Analyser, Source, and Animation Frame
  const animId = refs.animFrameRef?.current;
  if (refs.animFrameRef) {
    refs.animFrameRef.current = null;
  }
  const sourceNode = refs.audioSourceRef?.current;
  if (refs.audioSourceRef) {
    refs.audioSourceRef.current = null;
  }
  const audioCtx = refs.audioContextRef?.current;
  if (refs.audioContextRef) {
    refs.audioContextRef.current = null;
  }
  stopAudioTelemetry(audioCtx, sourceNode, animId);

  // 6. Cancel Speech Synthesis TTS
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch (_e) {}
  }

  // 7. Reset UI Indicators safely if still mounted
  const isMounted = refs.isMountedRef ? refs.isMountedRef.current : true;
  if (isMounted && setters) {
    setters.setIsCameraOn?.(false);
    setters.setIsRecording?.(false);
    setters.setIsMicMuted?.(false);
    setters.setMicVolume?.(0);
    setters.setSpeechStatus?.('idle');
    setters.setInterimTranscript?.('');
    setters.setIsSpeaking?.(false);
  }
}
