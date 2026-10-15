interface Window {
  /** Deep-link / video-render hook: seek the active lesson scene to `t` seconds. */
  __setLessonTime?: (t: number) => void;
}
