import ClassRegistry from './class-registry';
import schemaForType from './schema-for-type';

function serializedAsObject(type) {
  return type.kind === 'OBJECT' || type.kind === 'INTERFACE' || type.kind === 'UNION';
}

function isConnection(type) {
  return type.name.endsWith('Connection');
}

function deserializeConnection(typeBundle, value, baseTypeName, registry, connectionsSelectionSet) {
  const connectionType = schemaForType(typeBundle, baseTypeName);
  const edgeType = schemaForType(typeBundle, connectionType.fieldBaseTypes.edges);
  const nodeType = schemaForType(typeBundle, edgeType.fieldBaseTypes.node);

  const nodesSelectionSet = connectionsSelectionSet && connectionsSelectionSet.selections
                                                                              .find((field) => field.name === 'edges')
                                                                              .selectionSet
                                                                              .selections
                                                                              .find((field) => field.name === 'node')
                                                                              .selectionSet;

  return value.edges.map((edge) => deserializeValue(typeBundle, edge.node, nodeType.name, registry, nodesSelectionSet));
}

function deserializeValue(typeBundle, value, baseTypeName, registry, valuesSelectionSet) {
  const baseType = schemaForType(typeBundle, baseTypeName);

  if (Array.isArray(value)) {
    return value.map((item) => deserializeValue(typeBundle, item, baseTypeName, registry, valuesSelectionSet));
  } else if (value === null) {
    return null;
  } else if (isConnection(baseType)) {
    return deserializeConnection(typeBundle, value, baseTypeName, registry, valuesSelectionSet);
  } else if (serializedAsObject(baseType)) {
    return deserializeObject(typeBundle, value, baseTypeName, registry, valuesSelectionSet);
  } else {
    return value;
  }
}

export default function deserializeObject(typeBundle, objectGraph, typeName, registry = new ClassRegistry(), selectionSet) {
  if (selectionSet && selectionSet.typeSchema.name !== typeName) {
    throw new Error(`selectionSet for type "${selectionSet.typeSchema.name}" does not match typeName "${typeName}"`);
  }

  const objectType = schemaForType(typeBundle, typeName);
  const attrs = Object.keys(objectGraph).reduce((acc, fieldName) => {
    const baseTypeName = objectType.fieldBaseTypes[fieldName];
    const value = objectGraph[fieldName];

    const valuesField = selectionSet && selectionSet.selections.find((fieldOrFragment) => {
      return fieldOrFragment.name === fieldName;
    });

    const valuesSelectionSet = valuesField && valuesField.selectionSet;

    acc[fieldName] = deserializeValue(typeBundle, value, baseTypeName, registry, valuesSelectionSet);

    return acc;
  }, {});

  if (selectionSet) {
    attrs.queryNode = selectionSet;
  }

  return new (registry.classForType(typeName))(attrs);
}
