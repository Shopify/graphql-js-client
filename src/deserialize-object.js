import ClassRegistry from './class-registry';
import {Field} from './selection-set';
import Query from './query';

function serializedAsObject(type) {
  return type.kind === 'OBJECT' || type.kind === 'INTERFACE' || type.kind === 'UNION';
}

function serializedAsScalar(type) {
  return type.kind === 'SCALAR';
}

function isConnection(type) {
  return type.name.endsWith('Connection');
}

function selectionSetForNode(connectionsSelectionSet) {
  if (!connectionsSelectionSet) {
    return null;
  }

  return connectionsSelectionSet
    .selections
    .find((field) => field.name === 'edges')
    .selectionSet
    .selections
    .find((field) => field.name === 'node')
    .selectionSet;
}

function deserializeConnection(value, connectionsSelectionSet, registry, parent) {
  const nodesSelectionSet = selectionSetForNode(connectionsSelectionSet);

  return value.edges.map((edge) => deserializeValue(edge.node, nodesSelectionSet, registry, parent));
}

function deserializeValue(value, selectionSetSet, registry, parent) {
  const baseType = selectionSetSet.typeSchema;

  if (Array.isArray(value)) {
    return value.map((item) => deserializeValue(item, selectionSetSet, registry, parent));
  } else if (value === null) {
    return null;
  } else if (isConnection(baseType)) {
    const connection = deserializeConnection(value, selectionSetSet, registry, parent);

    return connection;
  } else if (serializedAsObject(baseType)) {
    return deserializeObject(value, selectionSetSet, registry, parent);
  } else if (serializedAsScalar(baseType)) {
    return value;
  } else {
    throw new Error(`Unknown value type ${baseType.kind}:${baseType.name}.`);
  }
}

class Ancestry {
  constructor(selectionSet, parent, nodeId = null) {
    Object.assign(this, {
      selectionSet,
      parent,
      nodeId
    });
  }

  get isNode() {
    return this.selectionSet.typeSchema.implementsNode;
  }

  get nearestNode() {
    if (!this.parent) {
      return null;
    } else if (this.parent.isNode) {
      return this.parent;
    }

    return this.parent.nearestNode;
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


export default function deserializeObject(data, selectionSet, registry = new ClassRegistry(), parent) {
  const ancestry = new Ancestry(selectionSet, parent, data.id);

  const attrs = Object.keys(data).reduce((acc, fieldName) => {
    const value = data[fieldName];

    const valuesSelectionSet = selectionSetForField(fieldName, selectionSet);

    acc[fieldName] = deserializeValue(value, valuesSelectionSet, registry, ancestry); // ancestry represents the parent

    return acc;
  }, {});

  if (selectionSet) {
    attrs.ancestry = ancestry;

    if (ancestry.isNode) {
      attrs.refetchQuery = function() {
        return new Query(selectionSet.typeBundle, (root) => {
          root.addField('node', {id: this.ancestry.nodeId}, (node) => {
            node.addInlineFragmentOn(this.ancestry.selectionSet.typeSchema.name, this.ancestry.selectionSet);
          });
        });
      };
    }
  }

  return new (registry.classForType(selectionSet.typeSchema.name))(attrs);
}
