export default function join(...fields) {
  const joinString = ', ';

  if (fields.length > 1) {
    return fields.join(joinString);
  } else if (Array.isArray(fields[0])) {
    return fields[0].join(joinString);
  }

  return fields[0];
}
