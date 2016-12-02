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

function deserializeValue(value, selectionSet, registry, parent) {
  const baseType = selectionSet.typeSchema;

  if (Array.isArray(value)) {
    return value.map((item) => deserializeValue(item, selectionSet, registry, parent));
  } else if (value === null) {
    return null;
  } else if (isConnection(baseType)) {
    const connection = deserializeConnection(value, selectionSet, registry, parent);

    // eslint-disable-next-line no-inner-declarations
    function addNextFieldTo(selection, setToAdd, fieldSource, rest) {
      const fieldReference = fieldSource.find((field) => {
        return field.selectionSet === setToAdd;
      });

      const fieldName = fieldReference.name;
      const args = Object.assign({}, fieldReference.args);

      selection.addField(fieldName, args, (newSelection) => {
        if (rest && rest.length) {
          addNextFieldTo(newSelection, rest.shift(), setToAdd.selections, rest);
        } else {
          const connectionField = setToAdd.selections.find((field) => {
            return field.selectionSet === selectionSet;
          });
          const edgesField = connectionField.selectionSet.selections.find((field) => {
            return field.name === 'edges';
          });
          const nodeField = edgesField.selectionSet.selections.find((field) => {
            return field.name === 'node';
          });

          newSelection.addConnection(
            connectionField.name,
            Object.assign({}, connectionField.args, {after: value.edges[value.edges.length - 1].cursor}),
            nodeField.selectionSet
          );
        }
      });
    }

    if (parent.isNode || parent.nearestNode) {
      connection.nextPageQuery = function() {
        return new Query(selectionSet.typeBundle, (root) => {
          const chain = parent.selectionSetsFromNearestNode;
          const rootNodeId = parent.nearestNodeId;
          const rootNodesSelectionSet = chain.shift();

          root.addField('node', {id: rootNodeId}, (node) => {
            node.addInlineFragmentOn(rootNodesSelectionSet.typeSchema.name, (rootNode) => {
              if (chain.length) {
                addNextFieldTo(rootNode, chain.shift(), rootNodesSelectionSet.selections, chain);
              } else {
                const fieldReference = rootNodesSelectionSet.selections.find((field) => {
                  return field.selectionSet === selectionSet;
                });

                const fieldName = fieldReference.name;
                const args = Object.assign({}, fieldReference.args, {after: value.edges[value.edges.length - 1].cursor});

                const edgesField = selectionSet.selections.find((field) => {
                  return field.name === 'edges';
                });
                const nodeField = edgesField.selectionSet.selections.find((field) => {
                  return field.name === 'node';
                });

                // Traverse the sets. This is the connection's set
                rootNode.addConnection(fieldName, args, nodeField.selectionSet);
              }
            });
          });
        });
      };
    } else {
      connection.nextPageQuery = function() {
        const chain = parent.selectionSetsFromRoot;
        const existingRoot = chain.shift();

        return new Query(selectionSet.typeBundle, (root) => {
          addNextFieldTo(root, chain.shift(), existingRoot.selections, chain);
        });
      };
    }

    return connection;
  } else if (serializedAsObject(baseType)) {
    return deserializeObject(value, selectionSet, registry, parent);
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

  get selectionSetsFromRoot() {
    if (this.parent) {
      return this.parent.selectionSetsFromRoot.concat(this.selectionSet);
    }

    return [this.selectionSet];
  }

  get selectionSetsFromNearestNode() {
    if (this.isNode) {
      return [this.selectionSet]; // This is our escape condition.
    } else if (!this.nearestNode) {
      return null; // This is our "We don't have a parent Node" condition.
    }

    // This is where we recurse and append (default)
    return this.parent.selectionSetsFromNearestNode.concat(this.selectionSet);
  }

  get nearestNodeId() {
    if (this.isNode) {
      return this.nodeId;
    } else if (!this.nearestNode) {
      return null;
    }

    return this.parent.nearestNodeId;
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

  // Search fragments for the type. God.
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
          root.add('node', {id: this.ancestry.nodeId}, (node) => {
            node.addInlineFragmentOn(this.ancestry.selectionSet.typeSchema.name, this.ancestry.selectionSet);
          });
        });
      };
    }
  }

  return new (registry.classForType(selectionSet.typeSchema.name))(attrs);
}
