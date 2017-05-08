let profile = {};
let tracking = false;

function trackTypeDependency(typeName) {
  if (!tracking) {
    return;
  }

  profile[typeName] = profile[typeName] || {};
}

function trackFieldDependency(typeName, fieldName) {
  if (!tracking) {
    return;
  }

  profile[typeName][fieldName] = true;
}

export function resetTracker() {
  profile = {};
  tracking = false;
}

export function startTracking() {
  tracking = true;
}

export function pauseTracking() {
  tracking = false;
}

export function captureTypeProfile() {
  return Object.keys(profile).sort();
}

export function captureProfile() {
  return Object.getOwnPropertyNames(profile).reduce((acc, typeName) => {
    acc[typeName] = Object.getOwnPropertyNames(profile[typeName]);

    return acc;
  }, {});
}

const Tracker = {trackTypeDependency, trackFieldDependency};

export default Tracker;
