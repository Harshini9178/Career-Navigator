import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  stopMediaStream,
  stopVideoElement,
  stopMediaRecorder,
  stopSpeechRecognition,
  stopAudioTelemetry,
  stopInterviewMediaSession
} from '../src/lib/mediaManager.js';

describe('Media Cleanup & Track Termination Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('stops all tracks and sets enabled = false on MediaStream', () => {
    const track1 = {
      kind: 'video',
      readyState: 'live',
      enabled: true,
      stop: vi.fn(function (this: any) {
        this.readyState = 'ended';
      })
    };
    const track2 = {
      kind: 'audio',
      readyState: 'live',
      enabled: true,
      stop: vi.fn(function (this: any) {
        this.readyState = 'ended';
      })
    };

    const mockStream: any = {
      getTracks: () => [track1, track2]
    };

    stopMediaStream(mockStream);

    expect(track1.enabled).toBe(false);
    expect(track1.stop).toHaveBeenCalledTimes(1);
    expect(track1.readyState).toBe('ended');

    expect(track2.enabled).toBe(false);
    expect(track2.stop).toHaveBeenCalledTimes(1);
    expect(track2.readyState).toBe('ended');
  });

  it('does not re-stop tracks that are already in ended readyState', () => {
    const alreadyEndedTrack = {
      kind: 'video',
      readyState: 'ended',
      enabled: false,
      stop: vi.fn()
    };

    const mockStream: any = {
      getTracks: () => [alreadyEndedTrack]
    };

    stopMediaStream(mockStream);

    expect(alreadyEndedTrack.stop).not.toHaveBeenCalled();
  });

  it('safely handles null and undefined streams without throwing', () => {
    expect(() => stopMediaStream(null)).not.toThrow();
    expect(() => stopMediaStream(undefined)).not.toThrow();
  });

  it('stops video element, releases srcObject, and pauses playback', () => {
    const track = {
      kind: 'video',
      readyState: 'live',
      enabled: true,
      stop: vi.fn(function (this: any) {
        this.readyState = 'ended';
      })
    };

    const mockStream: any = {
      getTracks: () => [track]
    };

    const mockVideoEl: any = {
      srcObject: mockStream,
      pause: vi.fn()
    };

    stopVideoElement(mockVideoEl);

    expect(track.enabled).toBe(false);
    expect(track.stop).toHaveBeenCalledTimes(1);
    expect(mockVideoEl.pause).toHaveBeenCalledTimes(1);
    expect(mockVideoEl.srcObject).toBeNull();
  });

  it('safely stops MediaRecorder if state is recording or paused', () => {
    const activeRecorder: any = {
      state: 'recording',
      stop: vi.fn(function (this: any) {
        this.state = 'inactive';
      })
    };

    stopMediaRecorder(activeRecorder);
    expect(activeRecorder.stop).toHaveBeenCalledTimes(1);

    const inactiveRecorder: any = {
      state: 'inactive',
      stop: vi.fn()
    };

    stopMediaRecorder(inactiveRecorder);
    expect(inactiveRecorder.stop).not.toHaveBeenCalled();
  });

  it('aborts speech recognition and nullifies event listeners to prevent auto-restart', () => {
    const mockRecognition: any = {
      onresult: () => {},
      onerror: () => {},
      onend: () => {},
      onstart: () => {},
      abort: vi.fn()
    };

    stopSpeechRecognition(mockRecognition);

    expect(mockRecognition.abort).toHaveBeenCalledTimes(1);
    expect(mockRecognition.onresult).toBeNull();
    expect(mockRecognition.onerror).toBeNull();
    expect(mockRecognition.onend).toBeNull();
    expect(mockRecognition.onstart).toBeNull();
  });

  it('closes AudioContext and disconnects source node', () => {
    const mockAudioSource: any = {
      disconnect: vi.fn()
    };
    const mockAudioContext: any = {
      state: 'running',
      close: vi.fn()
    };

    stopAudioTelemetry(mockAudioContext, mockAudioSource, 123);

    expect(mockAudioSource.disconnect).toHaveBeenCalledTimes(1);
    expect(mockAudioContext.close).toHaveBeenCalledTimes(1);
  });

  it('executes comprehensive session media cleanup across all refs and updates UI state', () => {
    const videoTrack = {
      kind: 'video',
      readyState: 'live',
      enabled: true,
      stop: vi.fn()
    };
    const audioTrack = {
      kind: 'audio',
      readyState: 'live',
      enabled: true,
      stop: vi.fn()
    };

    const stream1: any = { getTracks: () => [videoTrack] };
    const stream2: any = { getTracks: () => [audioTrack] };

    const streamRef = { current: stream1 };
    const activeStreamsRef = { current: new Set<any>([stream2]) };
    const videoRef = {
      current: {
        srcObject: stream1,
        pause: vi.fn()
      } as any
    };

    const setters = {
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
        activeStreamsRef,
        videoRef,
        isMountedRef: { current: true }
      },
      setters
    );

    expect(videoTrack.stop).toHaveBeenCalled();
    expect(audioTrack.stop).toHaveBeenCalled();
    expect(streamRef.current).toBeNull();
    expect(activeStreamsRef.current.size).toBe(0);
    expect(videoRef.current.srcObject).toBeNull();
    expect(setters.setIsCameraOn).toHaveBeenCalledWith(false);
    expect(setters.setIsRecording).toHaveBeenCalledWith(false);
    expect(setters.setMicVolume).toHaveBeenCalledWith(0);
  });
});
