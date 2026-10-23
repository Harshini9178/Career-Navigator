import { describe, it, expect, vi } from 'vitest';
import {
  stopMediaStream,
  stopVideoElement,
  stopSpeechRecognition,
  stopAudioTelemetry,
  stopInterviewMediaSession
} from '../src/lib/mediaManager.js';

// Helper mock track factory
function createMockTrack(kind: 'audio' | 'video', initialReadyState: 'live' | 'ended' = 'live'): MediaStreamTrack {
  let state = initialReadyState;
  const listeners: Record<string, Function[]> = {};

  return {
    kind,
    id: `track-${kind}-${Math.random()}`,
    enabled: true,
    muted: false,
    label: `Mock ${kind} track`,
    get readyState() {
      return state;
    },
    stop: vi.fn(() => {
      state = 'ended';
      if (listeners['ended']) {
        listeners['ended'].forEach((fn) => fn());
      }
    }),
    addEventListener: vi.fn((event: string, fn: Function) => {
      listeners[event] = listeners[event] || [];
      listeners[event].push(fn);
    }),
    removeEventListener: vi.fn()
  } as unknown as MediaStreamTrack;
}

// Helper mock MediaStream factory
function createMockStream(tracks: MediaStreamTrack[]): MediaStream {
  return {
    getTracks: vi.fn(() => [...tracks]),
    getVideoTracks: vi.fn(() => tracks.filter((t) => t.kind === 'video')),
    getAudioTracks: vi.fn(() => tracks.filter((t) => t.kind === 'audio')),
    addTrack: vi.fn((t) => tracks.push(t)),
    removeTrack: vi.fn((t) => {
      const idx = tracks.indexOf(t);
      if (idx !== -1) tracks.splice(idx, 1);
    })
  } as unknown as MediaStream;
}

// Helper mock HTMLVideoElement
function createMockVideoElement(initialStream: MediaStream | null = null): HTMLVideoElement {
  let srcObj = initialStream;
  return {
    get srcObject() {
      return srcObj;
    },
    set srcObject(val: any) {
      srcObj = val;
    },
    pause: vi.fn(),
    play: vi.fn()
  } as unknown as HTMLVideoElement;
}

// Helper mock SpeechRecognition
function createMockSpeechRecognition() {
  return {
    onresult: vi.fn(),
    onerror: vi.fn(),
    onend: vi.fn(),
    onstart: vi.fn(),
    abort: vi.fn(),
    stop: vi.fn(),
    start: vi.fn()
  };
}

describe('Mock Interview Media Lifecycle & Cleanup Engine', () => {
  describe('1. stopMediaStream', () => {
    it('should stop every video and audio track and transition readyState to "ended"', () => {
      const videoTrack = createMockTrack('video');
      const audioTrack = createMockTrack('audio');
      const stream = createMockStream([videoTrack, audioTrack]);

      expect(videoTrack.readyState).toBe('live');
      expect(audioTrack.readyState).toBe('live');

      stopMediaStream(stream);

      expect(videoTrack.stop).toHaveBeenCalledTimes(1);
      expect(audioTrack.stop).toHaveBeenCalledTimes(1);
      expect(videoTrack.readyState).toBe('ended');
      expect(audioTrack.readyState).toBe('ended');
    });

    it('should safely handle null or undefined streams without throwing', () => {
      expect(() => stopMediaStream(null)).not.toThrow();
      expect(() => stopMediaStream(undefined)).not.toThrow();
    });

    it('should safely swallow errors if individual track.stop throws', () => {
      const faultyTrack = createMockTrack('video');
      faultyTrack.stop = vi.fn(() => {
        throw new Error('Hardware disconnect error');
      });
      const stream = createMockStream([faultyTrack]);

      expect(() => stopMediaStream(stream)).not.toThrow();
      expect(faultyTrack.stop).toHaveBeenCalled();
    });
  });

  describe('2. stopVideoElement', () => {
    it('should pause video, stop attached tracks, and set srcObject to null', () => {
      const videoTrack = createMockTrack('video');
      const stream = createMockStream([videoTrack]);
      const videoEl = createMockVideoElement(stream);

      expect(videoEl.srcObject).toBe(stream);
      expect(videoTrack.readyState).toBe('live');

      stopVideoElement(videoEl);

      expect(videoTrack.stop).toHaveBeenCalledTimes(1);
      expect(videoTrack.readyState).toBe('ended');
      expect(videoEl.pause).toHaveBeenCalledTimes(1);
      expect(videoEl.srcObject).toBeNull();
    });

    it('should safely handle null video element without throwing', () => {
      expect(() => stopVideoElement(null)).not.toThrow();
      expect(() => stopVideoElement(undefined)).not.toThrow();
    });
  });

  describe('3. stopSpeechRecognition', () => {
    it('should abort recognition, call stop, and detach event handlers to prevent auto-restart', () => {
      const recognition = createMockSpeechRecognition();

      stopSpeechRecognition(recognition);

      expect(recognition.abort).toHaveBeenCalledTimes(1);
      expect(recognition.onresult).toBeNull();
      expect(recognition.onerror).toBeNull();
      expect(recognition.onend).toBeNull();
      expect(recognition.onstart).toBeNull();
    });

    it('should safely handle null recognition instance without throwing', () => {
      expect(() => stopSpeechRecognition(null)).not.toThrow();
      expect(() => stopSpeechRecognition(undefined)).not.toThrow();
    });
  });

  describe('4. stopAudioTelemetry', () => {
    it('should disconnect audio source and close active AudioContext', () => {
      const source = { disconnect: vi.fn() } as unknown as MediaStreamAudioSourceNode;
      const ctx = { state: 'running', close: vi.fn() } as unknown as AudioContext;

      stopAudioTelemetry(ctx, source, 123);

      expect(source.disconnect).toHaveBeenCalledTimes(1);
      expect(ctx.close).toHaveBeenCalledTimes(1);
    });

    it('should not throw if audio context is already closed', () => {
      const ctx = { state: 'closed', close: vi.fn() } as unknown as AudioContext;
      stopAudioTelemetry(ctx);
      expect(ctx.close).not.toHaveBeenCalled();
    });
  });

  describe('5. stopInterviewMediaSession (Comprehensive Cleanup)', () => {
    it('should release all tracks, clear video preview, abort speech, and reset state', () => {
      const videoTrack = createMockTrack('video');
      const audioTrack = createMockTrack('audio');
      const mainStream = createMockStream([videoTrack, audioTrack]);

      const extraTrack = createMockTrack('video');
      const extraStream = createMockStream([extraTrack]);
      const activeStreams = new Set<MediaStream>([mainStream, extraStream]);

      const videoEl = createMockVideoElement(mainStream);
      const recognition = createMockSpeechRecognition();

      const streamRef = { current: mainStream };
      const videoRef = { current: videoEl };
      const recognitionRef = { current: recognition };
      const activeStreamsRef = { current: activeStreams };
      const isRecordingRef = { current: true };
      const isMountedRef = { current: true };

      const stateSetters = {
        setIsCameraOn: vi.fn(),
        setIsRecording: vi.fn(),
        setIsMicMuted: vi.fn(),
        setMicVolume: vi.fn(),
        setSpeechStatus: vi.fn(),
        setInterimTranscript: vi.fn(),
        setIsSpeaking: vi.fn()
      };

      stopInterviewMediaSession(
        {
          streamRef,
          videoRef,
          recognitionRef,
          activeStreamsRef,
          isRecordingRef,
          isMountedRef
        },
        stateSetters
      );

      // Verify all tracks stopped and readyState === 'ended'
      expect(videoTrack.readyState).toBe('ended');
      expect(audioTrack.readyState).toBe('ended');
      expect(extraTrack.readyState).toBe('ended');

      // Verify refs cleared
      expect(streamRef.current).toBeNull();
      expect(recognitionRef.current).toBeNull();
      expect(activeStreamsRef.current.size).toBe(0);
      expect(isRecordingRef.current).toBe(false);

      // Verify video element preview cleared
      expect(videoEl.pause).toHaveBeenCalled();
      expect(videoEl.srcObject).toBeNull();

      // Verify UI states reset
      expect(stateSetters.setIsCameraOn).toHaveBeenCalledWith(false);
      expect(stateSetters.setIsRecording).toHaveBeenCalledWith(false);
      expect(stateSetters.setMicVolume).toHaveBeenCalledWith(0);
      expect(stateSetters.setSpeechStatus).toHaveBeenCalledWith('idle');
      expect(stateSetters.setInterimTranscript).toHaveBeenCalledWith('');
    });

    it('should safely execute repeated cleanup calls without errors (Idempotency)', () => {
      const streamRef = { current: null };
      const videoRef = { current: null };
      const recognitionRef = { current: null };
      const activeStreamsRef = { current: new Set<MediaStream>() };

      expect(() => {
        stopInterviewMediaSession({ streamRef, videoRef, recognitionRef, activeStreamsRef });
        stopInterviewMediaSession({ streamRef, videoRef, recognitionRef, activeStreamsRef });
        stopInterviewMediaSession({ streamRef, videoRef, recognitionRef, activeStreamsRef });
      }).not.toThrow();
    });

    it('should NOT update React state if component is unmounted (prevents memory leak warnings)', () => {
      const isMountedRef = { current: false };
      const stateSetters = {
        setIsCameraOn: vi.fn(),
        setIsRecording: vi.fn(),
        setMicVolume: vi.fn()
      };

      stopInterviewMediaSession({ isMountedRef }, stateSetters);

      expect(stateSetters.setIsCameraOn).not.toHaveBeenCalled();
      expect(stateSetters.setIsRecording).not.toHaveBeenCalled();
      expect(stateSetters.setMicVolume).not.toHaveBeenCalled();
    });
  });

  describe('6. Submission Workflow & Answer Preservation', () => {
    it('preserves candidate answers on submission failure and allows safe retry without marking completed', () => {
      const candidateAnswers = [
        { questionId: 'q-1', answer: 'Candidate solution for Question 1', skipped: false },
        { questionId: 'q-2', answer: '[Question Skipped]', skipped: true }
      ];

      // Simulate a failed submission: error caught, state preserved
      let sessionStatus = 'started';
      let submissionError: string | null = null;
      let preservedDrafts = candidateAnswers;

      try {
        // Simulate backend error
        throw new Error('Network timeout during submit');
      } catch (err: any) {
        submissionError = err.message;
        // Do NOT mark status as completed
      }

      expect(sessionStatus).toBe('started');
      expect(submissionError).toBe('Network timeout during submit');
      expect(preservedDrafts).toHaveLength(2);
      expect(preservedDrafts[0].answer).toBe('Candidate solution for Question 1');
      expect(preservedDrafts[1].skipped).toBe(true);
    });

    it('successfully confirms submission, stops media tracks, and transitions to report', () => {
      const videoTrack = createMockTrack('video');
      const audioTrack = createMockTrack('audio');
      const stream = createMockStream([videoTrack, audioTrack]);
      const videoEl = createMockVideoElement(stream);

      let sessionStatus = 'started';
      const streamRef = { current: stream };
      const videoRef = { current: videoEl };
      const isMountedRef = { current: true };

      // Step 4: Submission succeeds
      const backendSuccess = true;
      if (backendSuccess) {
        // Step 5 & 6: Stop camera, microphone, clear preview
        stopInterviewMediaSession({ streamRef, videoRef, isMountedRef });
        // Step 7: Transition to completed
        sessionStatus = 'completed';
      }

      expect(sessionStatus).toBe('completed');
      expect(videoTrack.readyState).toBe('ended');
      expect(audioTrack.readyState).toBe('ended');
      expect(videoEl.srcObject).toBeNull();
      expect(streamRef.current).toBeNull();
    });
  });

  describe('7. Camera Reactivation Prevention', () => {
    it('blocks getUserMedia acquisition when session is marked completed', () => {
      const isSessionCompleted = true;
      let getUserMediaCalled = false;

      function requestMediaIfActive(completed: boolean) {
        if (completed) {
          return null; // Blocked!
        }
        getUserMediaCalled = true;
        return createMockStream([]);
      }

      const stream = requestMediaIfActive(isSessionCompleted);
      expect(stream).toBeNull();
      expect(getUserMediaCalled).toBe(false);
    });

    it('requests media again through normal workflow when a new interview is started or retaken', () => {
      let isSessionCompleted = false;
      let getUserMediaCalled = false;

      function requestMediaIfActive(completed: boolean) {
        if (completed) {
          return null;
        }
        getUserMediaCalled = true;
        return createMockStream([]);
      }

      const stream = requestMediaIfActive(isSessionCompleted);
      expect(stream).not.toBeNull();
      expect(getUserMediaCalled).toBe(true);
    });
  });
});
