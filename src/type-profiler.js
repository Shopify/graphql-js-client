let types = {};
let profiling = false;

export default function typeProfiler(typeName) {
  if (!profiling) {
    return;
  }

  types[typeName] = true;
}

export function resetProfiler() {
  types = {};
  profiling = false;
}

export function startProfiling() {
  profiling = true;
}

export function pauseProfiling() {
  profiling = false;
}

export function profiledTypes() {
  return Object.keys(types).sort();
}

export function printTypes() {
  // eslint-disable-next-line
  console.log(profiledTypes().join());
}
