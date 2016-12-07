import assert from 'assert';
import isObject from '../src/is-object';

function findFirstUnfrozenSubstructure(arr) {
  for (let i = 0; i < arr.length; i++) {
    const unfrozenPart = findUnfrozenSubstructureIn(arr[i]);

    if (unfrozenPart !== null) {
      return unfrozenPart;
    }
  }

  return null;
}

function findUnfrozenSubstructureIn(structure) {
  if (!Object.isFrozen(structure)) {
    return structure;
  } else if (isObject(structure)) {
    const values = Object.keys(structure).map((key) => structure[key]);

    return findFirstUnfrozenSubstructure(values);
  } else if (Array.isArray(structure)) {
    return findFirstUnfrozenSubstructure(structure);
  }

  return null;
}

export default function assertDeeplyFrozen(structure) {
  const unfrozenPart = findUnfrozenSubstructureIn(structure);

  assert.ok(unfrozenPart === null, `Expected deeply frozen data structure, but found this ${unfrozenPart && unfrozenPart.constructor.name} that was unfrozen: \n${JSON.stringify(unfrozenPart, null, 2)}`);
}
