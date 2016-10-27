import ClassRegistry from './class-registry';
import schemaForType from './schema-for-type';

function serializedAsObject(type) {
  return type.kind === 'OBJECT' || type.kind === 'INTERFACE' || type.kind === 'UNION';
}

function isConnection(type) {
  return type.name.endsWith('Connection');
}

function deserializeConnection(typeBundle, value, baseTypeName, registry) {
  const connectionType = schemaForType(typeBundle, baseTypeName);
  const edgeType = schemaForType(typeBundle, connectionType.fieldBaseTypes.edges);
  const nodeType = schemaForType(typeBundle, edgeType.fieldBaseTypes.node);

  return value.edges.map((edge) => deserializeValue(typeBundle, edge.node, nodeType.name, registry));
}

function deserializeValue(typeBundle, value, baseTypeName, registry) {
  const baseType = schemaForType(typeBundle, baseTypeName);

  if (Array.isArray(value)) {
    return value.map((item) => deserializeValue(typeBundle, item, baseTypeName, registry));
  } else if (value === null) {
    return null;
  } else if (isConnection(baseType)) {
    return deserializeConnection(typeBundle, value, baseTypeName, registry);
  } else if (serializedAsObject(baseType)) {
    return deserializeObject(typeBundle, value, baseTypeName, registry);
  } else {
    return value;
  }
}

export default function deserializeObject(typeBundle, objectGraph, typeName, registry = new ClassRegistry()) {
  const objectType = schemaForType(typeBundle, typeName);
  const attrs = Object.keys(objectGraph).reduce((acc, fieldName) => {
    const baseTypeName = objectType.fieldBaseTypes[fieldName];
    const value = objectGraph[fieldName];

    acc[fieldName] = deserializeValue(typeBundle, value, baseTypeName, registry);

    return acc;
  }, {});

  return new (registry.classForType(typeName))(attrs);
}
