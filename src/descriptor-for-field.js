import schemaForType from './schema-for-type';

function findInScalars(fieldName, type) {
  const fieldDescriptor = type.scalars[fieldName];

  if (fieldDescriptor) {
    return Object.assign({
      schema: {
        kind: 'SCALAR',
        name: fieldDescriptor.type
      },
      fieldName,
      onType: type.name,
      isConnection: false
    }, fieldDescriptor);
  }

  return null;
}

function findInObjects(typeBundle, fieldName, type) {
  const fieldDescriptor = type.objects[fieldName];

  if (fieldDescriptor) {
    return Object.assign({
      schema: schemaForType(typeBundle, fieldDescriptor.type),
      fieldName,
      onType: type.name,
      isConnection: false
    }, fieldDescriptor);
  }

  return null;
}

function findInConnections(typeBundle, fieldName, type) {
  const fieldDescriptor = type.connections[fieldName];

  if (fieldDescriptor) {
    return Object.assign({
      schema: schemaForType(typeBundle, fieldDescriptor.type),
      fieldName,
      onType: type.name,
      isConnection: true
    }, fieldDescriptor);
  }

  return null;
}

function find(typeBundle, fieldName, type) {
  return (
    findInScalars(fieldName, type) ||
    findInObjects(typeBundle, fieldName, type) ||
    findInConnections(typeBundle, fieldName, type)
  );
}

export default function descriptorForField(typeBundle, fieldName, typeModuleName) {
  const containerType = schemaForType(typeBundle, typeModuleName);

  if (!containerType) {
    throw new Error(`Unknown parent GraphQL type ${typeModuleName}`);
  }

  return find(typeBundle, fieldName, containerType);
}
