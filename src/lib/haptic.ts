export function haptic() {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate(15);
}
