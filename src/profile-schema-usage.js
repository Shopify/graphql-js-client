let profile = {};
let profiling = false;

function trackTypeDependency(typeName) {
  if (!profiling) {
    return;
  }

  profile[typeName] = profile[typeName] || {};
}

function trackFieldDependency(typeName, fieldName) {
  if (!profiling) {
    return;
  }

  profile[typeName][fieldName] = true;
}

export function resetProfiler() {
  profile = {};
  profiling = false;
}

export function startProfiling() {
  profiling = true;
}

export function pauseProfiling() {
  profiling = false;
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

const Profiler = {trackTypeDependency, trackFieldDependency};

export default Profiler;
