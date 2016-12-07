let types = [];
let profiling = false;

export default function typeProfiler(typeName) {
  if (types.includes(typeName) || !profiling) {
    return;
  }

  types.push(typeName);
}

export function resetProfiler() {
  types = [];
  profiling = false;
}

export function startProfiling() {
  profiling = true;
}

export function pauseProfiling() {
  profiling = false;
}

export function profiledTypes() {
  return types.sort();
}

export function printTypes() {
  // eslint-disable-next-line
  console.log(profiledTypes().join());
}
