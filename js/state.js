// Minimal observable app state — no framework needed for this.
const state = {
  user: null, // Firebase auth user object
  profile: null, // { uid, name, email, role }
  ready: false, // becomes true once the first auth check resolves
};

const listeners = new Set();

export function getState() {
  return state;
}

export function setState(patch) {
  Object.assign(state, patch);
  listeners.forEach((fn) => fn(state));
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
