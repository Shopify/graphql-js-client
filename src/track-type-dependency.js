let types = {};
let tracking = false;

export default function trackTypeDependency(typeName) {
  if (!tracking) {
    return;
  }

  types[typeName] = true;
}

export function resetTracker() {
  types = {};
  tracking = false;
}

export function startTracking() {
  tracking = true;
}

export function pauseTracking() {
  tracking = false;
}

export function trackedTypes() {
  return Object.keys(types).sort();
}

export function printTypes() {
  // eslint-disable-next-line
  console.log(trackedTypes().join());
}
