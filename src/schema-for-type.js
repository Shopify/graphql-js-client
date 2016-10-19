export default function schemaForType(typeBundle, typeName) {
  const type = typeBundle[typeName];

  if (type) {
    return type;
  }

  throw new Error(`No type of ${typeName} found in schema`);
}

