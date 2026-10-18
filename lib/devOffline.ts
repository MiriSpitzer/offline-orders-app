// Dev-only manual offline override.
// navigator.onLine reflects the OS network interface, not real internet
// reachability, so it often stays "online" when there's no actual connection.
// This lets the StatusBar toggle force the app into offline mode for testing.

let forced = false;

export function isForcedOffline() {
  return forced;
}

export function setForcedOffline(value: boolean) {
  forced = value;
}
