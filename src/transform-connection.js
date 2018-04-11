import Document from './document';
import isNodeContext from './is-node-context';
import variable, {isVariable} from './variable';
import Scalar from './scalar';
import {FragmentSpread} from './selection-set';

function isConnection(context) {
  return context.selection.selectionSet.typeSchema.name.endsWith('Connection');
}

function nearestNode(context) {
  if (context == null) {
    return null;
  } else if (isNodeContext(context)) {
    return context;
  } else {
    return nearestNode(context.parent);
  }
}

function contextsFromRoot(context) {
  if (context.parent) {
    return contextsFromRoot(context.parent).concat(context);
  } else {
    return [context];
  }
}

function contextsFromNearestNode(context) {
  if (context.selection.selectionSet.typeSchema.implementsNode) {
    return [context];
  } else {
    return contextsFromNearestNode(context.parent).concat(context);
  }
}

function initializeDocumentAndVars(currentContext, contextChain) {
  const lastInChain = contextChain[contextChain.length - 1];
  const first = lastInChain.selection.args.first;
  const variableDefinitions = Object
    .keys(lastInChain.selection.args)
    .filter((key) => {
      return isVariable(lastInChain.selection.args[key]);
    })
    .map((key) => {
      return lastInChain.selection.args[key];
    });

  let firstVar = variableDefinitions.find((definition) => {
    return definition.name === 'first';
  });

  if (!firstVar) {
    firstVar = variable('first', 'Int', first);
    variableDefinitions.push(firstVar);
  }

  const document = new Document(currentContext.selection.selectionSet.typeBundle);

  return [document, variableDefinitions, firstVar];
}

function addNextFieldTo(currentSelection, contextChain, path, cursor) {
  // There are always at least two. When we start, it's the root context, and the first set
  const nextContext = contextChain.shift();

  path.push(nextContext.selection.responseKey);

  if (contextChain.length) {
    currentSelection.add(nextContext.selection.name, {alias: nextContext.selection.alias, args: nextContext.selection.args}, (newSelection) => {
      addNextFieldTo(newSelection, contextChain, path, cursor);
    });
  } else {
    const edgesField = nextContext.selection.selectionSet.selections.find((field) => {
      return field.name === 'edges';
    });
    const nodeField = edgesField.selectionSet.selections.find((field) => {
      return field.name === 'node';
    });
    let first;

    if (isVariable(nextContext.selection.args.first)) {
      first = nextContext.selection.args.first;
    } else {
      first = variable('first', 'Int', nextContext.selection.args.first);
    }

    const options = {
      alias: nextContext.selection.alias,
      args: Object.assign({}, nextContext.selection.args, {after: cursor, first})
    };

    currentSelection.addConnection(nextContext.selection.name, options, nodeField.selectionSet);
  }
}

function collectFragments(selections) {
  return selections.reduce((fragmentDefinitions, field) => {
    if (FragmentSpread.prototype.isPrototypeOf(field)) {
      fragmentDefinitions.push(field.toDefinition());
    }

    fragmentDefinitions.push(...collectFragments(field.selectionSet.selections));

    return fragmentDefinitions;
  }, []);
}

function nextPageQueryAndPath(context, cursor) {
  const nearestNodeContext = nearestNode(context);

  if (nearestNodeContext) {
    return function() {
      const path = [];
      const nodeType = nearestNodeContext.selection.selectionSet.typeSchema;
      const nodeId = nearestNodeContext.responseData.id;
      const contextChain = contextsFromNearestNode(context);
      const [document, variableDefinitions] = initializeDocumentAndVars(context, contextChain);

      document.addQuery(variableDefinitions, (root) => {
        path.push('node');
        root.add('node', {args: {id: nodeId}}, (node) => {
          node.addInlineFragmentOn(nodeType.name, (fragment) => {
            addNextFieldTo(fragment, contextChain.slice(1), path, cursor);
          });
        });
      });

      const fragments = collectFragments(document.operations[0].selectionSet.selections);

      document.definitions.unshift(...fragments);

      return [document, path];
    };
  } else {
    return function() {
      const path = [];
      const contextChain = contextsFromRoot(context);
      const [document, variableDefinitions] = initializeDocumentAndVars(context, contextChain);

      document.addQuery(variableDefinitions, (root) => {
        addNextFieldTo(root, contextChain.slice(1), path, cursor);
      });

      const fragments = collectFragments(document.operations[0].selectionSet.selections);

      document.definitions.unshift(...fragments);

      return [document, path];
    };
  }
}

function hasNextPage(connection, edge) {
  if (edge !== connection.edges[connection.edges.length - 1]) {
    return new Scalar(true);
  }

  return connection.pageInfo.hasNextPage;
}

function hasPreviousPage(connection, edge) {
  if (edge !== connection.edges[0]) {
    return new Scalar(true);
  }

  return connection.pageInfo.hasPreviousPage;
}

export default function transformConnections(variableValues) {
  return function(context, value) {
    if (isConnection(context)) {
      if (!(value.pageInfo && value.pageInfo.hasOwnProperty('hasNextPage') && value.pageInfo.hasOwnProperty('hasPreviousPage'))) {
        throw new Error('Connections must include the selections "pageInfo { hasNextPage, hasPreviousPage }".');
      }

      return value.edges.map((edge) => {
        return Object.assign(edge.node, {
          nextPageQueryAndPath: nextPageQueryAndPath(context, edge.cursor),
          hasNextPage: hasNextPage(value, edge),
          hasPreviousPage: hasPreviousPage(value, edge),
          variableValues
        });
      });
    } else {
      return value;
    }
  };
}
