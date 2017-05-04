let types = {};
let fields = {};
let tracking = false;

function trackTypeDependency(typeName) {
  if (!tracking) {
    return;
  }

  types[typeName] = true;
}

function trackFieldDependency(typeName, fieldName) {
  if (!tracking) {
    return;
  }

  if (!fields[typeName]) {
    fields[typeName] = {};
  }

  fields[typeName][fieldName] = true;
}

export function resetTracker() {
  types = {};
  fields = {};
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

export function trackedFields() {
  return Object.getOwnPropertyNames(fields).reduce((acc, key) => {
    acc[key] = Object.getOwnPropertyNames(fields[key]);

    return acc;
  }, {});
}

const Tracker = {trackTypeDependency, trackFieldDependency};

export default Tracker;
