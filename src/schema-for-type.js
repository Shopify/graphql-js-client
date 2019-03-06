export default function schemaForType(typeBundle, typeName, typeSchema = null) {
  const type = typeBundle.types[typeName];

  if (type) {
    return type;
  } else if (typeSchema && typeSchema.kind === 'INTERFACE') {
    return typeSchema;
  }

  throw new Error(`No type of ${typeName} found in schema`);
}
