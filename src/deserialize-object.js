import ClassRegistry from './class-registry';
import schemaForType from './schema-for-type';
import {Field} from './selection-set';

function serializedAsObject(type) {
  return type.kind === 'OBJECT' || type.kind === 'INTERFACE' || type.kind === 'UNION';
}

function isConnection(type) {
  return type.name.endsWith('Connection');
}

function selectionSetForNode(connectionsSelectionSet) {
  if (!connectionsSelectionSet) {
    return null;
  }

  return connectionsSelectionSet.selections
                                .find((field) => field.name === 'edges')
                                .selectionSet
                                .selections
                                .find((field) => field.name === 'node')
                                .selectionSet;
}

function deserializeConnection(typeBundle, value, baseTypeName, registry, connectionsSelectionSet, ancestralNode) {
  const connectionType = schemaForType(typeBundle, baseTypeName);
  const edgeType = schemaForType(typeBundle, connectionType.fieldBaseTypes.edges);
  const nodeType = schemaForType(typeBundle, edgeType.fieldBaseTypes.node);

  const nodesSelectionSet = selectionSetForNode(connectionsSelectionSet);

  return value.edges.map((edge) => deserializeValue(typeBundle, edge.node, nodeType.name, registry, nodesSelectionSet, ancestralNode));
}

function deserializeValue(typeBundle, value, baseTypeName, registry, valuesSelectionSet, ancestralNode) {
  const baseType = schemaForType(typeBundle, baseTypeName);

  if (Array.isArray(value)) {
    return value.map((item) => deserializeValue(typeBundle, item, baseTypeName, registry, valuesSelectionSet));
  } else if (value === null) {
    return null;
  } else if (isConnection(baseType)) {
    return deserializeConnection(typeBundle, value, baseTypeName, registry, valuesSelectionSet, ancestralNode);
  } else if (serializedAsObject(baseType)) {
    return deserializeObject(typeBundle, value, baseTypeName, registry, valuesSelectionSet, ancestralNode);
  } else {
    return value;
  }
}

class Ancestry {
  constructor(selectionSet, isNode, ancestralNode) {
    Object.assign(this, {
      selectionSet,
      isNode,
      ancestralNode
    });
  }
}

function selectionSetForField(fieldName, selectionSet) {
  if (!selectionSet) {
    return null;
  }

  const valuesField = selectionSet.selections.filter((fieldOrFragment) => {
    return Field.prototype.isPrototypeOf(fieldOrFragment);
  }).find((field) => {
    return field.name === fieldName;
  });

  if (!valuesField) {
    return null;
  }

  return valuesField.selectionSet;
}


export default function deserializeObject(typeBundle, objectGraph, typeName, registry = new ClassRegistry(), selectionSet, ancestralNode) {
  if (selectionSet && selectionSet.typeSchema.name !== typeName) {
    throw new Error(`selectionSet for type "${selectionSet.typeSchema.name}" does not match typeName "${typeName}"`);
  }

  const objectType = schemaForType(typeBundle, typeName);

  let thisNode;

  if (objectType.implementsNode) {
    thisNode = {
      id: objectGraph.id,
      selectionSet
    };
  }

  const attrs = Object.keys(objectGraph).reduce((acc, fieldName) => {
    const baseTypeName = objectType.fieldBaseTypes[fieldName];
    const value = objectGraph[fieldName];

    const valuesSelectionSet = selectionSetForField(fieldName, selectionSet);

    acc[fieldName] = deserializeValue(typeBundle, value, baseTypeName, registry, valuesSelectionSet, thisNode);

    return acc;
  }, {});

  if (selectionSet) {
    attrs.ancestry = new Ancestry(selectionSet, objectType.implementsNode, ancestralNode);
  }

  return new (registry.classForType(typeName))(attrs);
}
