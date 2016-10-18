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

function findInObjects(fieldName, type) {
  const fieldDescriptor = type.objects[fieldName];

  if (fieldDescriptor) {
    return Object.assign({
      schema: schemaForType(fieldDescriptor.type),
      fieldName,
      onType: type.name,
      isConnection: false
    }, fieldDescriptor);
  }

  return null;
}

function findInConnections(fieldName, type) {
  const fieldDescriptor = type.connections[fieldName];

  if (fieldDescriptor) {
    return Object.assign({
      schema: schemaForType(fieldDescriptor.type),
      fieldName,
      onType: type.name,
      isConnection: true
    }, fieldDescriptor);
  }

  return null;
}

function find(fieldName, type) {
  return (
    findInScalars(fieldName, type) ||
    findInObjects(fieldName, type) ||
    findInConnections(fieldName, type)
  );
}

export default function descriptorForField(fieldName, typeModuleName) {
  const containerType = schemaForType(typeModuleName);

  if (!containerType) {
    throw new Error(`Unknown parent GraphQL type ${typeModuleName}`);
  }

  return find(fieldName, containerType);
}
