/**
 * Zero-dependency Procedural Web Audio API Sound Synthesizer
 * Generates tactile micro-sounds (clicks, subtle chimes) using native oscillators.
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private muted: boolean = true;

  constructor() {
    // UI click sounds are disabled across Career Navigator
    this.muted = true;
  }

  private getContext(): AudioContext | null {
    return null;
  }

  public isMuted(): boolean {
    return true;
  }

  public toggleMute(): boolean {
    return true;
  }

  /**
   * Linear-style tactile micro-click for buttons, tabs, templates, icons
   * DISABLED: UI click sounds removed per specification
   */
  public playClick(_pitch = 1200) {
    // No-op: UI interaction sound disabled
  }

  /**
   * Two-tone harmonic chime
   * DISABLED: UI click sounds removed per specification
   */
  public playChime() {
    // No-op: UI interaction sound disabled
  }


  /**
   * Subtle alert chime when speech input begins
   * Preserved for speech accessibility
   */
  public playMicStart() {
    // Kept minimal or silent per requirement
  }

  /**
   * Warning audio alert for proctoring violations or urgent timers
   * Preserved for proctoring accessibility
   */
  public playWarning(_freq = 300) {
    // Kept minimal or silent per requirement
  }

  /**
   * Success notification chime
   * DISABLED: UI interaction sound disabled
   */
  public playSuccess() {
    // No-op: UI interaction sound disabled
  }

  /**
   * Error notification tone
   * DISABLED: UI interaction sound disabled
   */
  public playError() {
    // No-op: UI interaction sound disabled
  }
}

export const sound = new SoundEngine();
