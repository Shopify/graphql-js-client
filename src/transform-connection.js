import Query from './query';
import isNodeContext from './is-node-context';
import variable, {VariableDefinition} from './variable';
import Scalar from './scalar';

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

function initializeQuery(currentContext, contextChain, queryBuilder) {
  const lastInChain = contextChain[contextChain.length - 1];
  const first = lastInChain.selection.args.first;
  const variableDefinitions = Object
    .keys(lastInChain.selection.args)
    .filter((key) => {
      return VariableDefinition.prototype.isPrototypeOf(lastInChain.selection.args[key]);
    })
    .map((key) => {
      return lastInChain.selection.args[key];
    })
    .concat(variable('first', 'Int', first));

  return new Query(currentContext.selection.selectionSet.typeBundle, variableDefinitions, queryBuilder);
}

function addNextFieldTo(currentSelection, contextChain, cursor, path) {
  // There are always at least two. When we start, it's the root context, and the first set
  const nextContext = contextChain.shift();

  path.push(nextContext.selection.responseKey);

  if (contextChain.length) {
    currentSelection.add(nextContext.selection.name, {alias: nextContext.selection.alias, args: nextContext.selection.args}, (newSelection) => {
      addNextFieldTo(newSelection, contextChain, cursor, path);
    });
  } else {
    const edgesField = nextContext.selection.selectionSet.selections.find((field) => {
      return field.name === 'edges';
    });
    const nodeField = edgesField.selectionSet.selections.find((field) => {
      return field.name === 'node';
    });
    const first = variable('first', 'Int', nextContext.selection.args.first);
    const options = {
      alias: nextContext.selection.alias,
      args: Object.assign({}, nextContext.selection.args, {after: cursor, first})
    };

    currentSelection.addConnection(nextContext.selection.name, options, nodeField.selectionSet);
  }
}

function nextPageQueryAndPath(context, cursor) {
  const nearestNodeContext = nearestNode(context);
  const path = [];

  if (nearestNodeContext) {
    return function() {
      const nodeType = nearestNodeContext.selection.selectionSet.typeSchema;
      const nodeId = nearestNodeContext.responseData.id;
      const contextChain = contextsFromNearestNode(context);
      const query = initializeQuery(context, contextChain, (root) => {
        path.push('node');
        root.add('node', {args: {id: nodeId}}, (node) => {
          node.addInlineFragmentOn(nodeType.name, (fragment) => {
            addNextFieldTo(fragment, contextChain.slice(1), cursor, path);
          });
        });
      });

      return [query, path];
    };
  } else {
    return function() {
      const contextChain = contextsFromRoot(context);
      const query = initializeQuery(context, contextChain, (root) => {
        addNextFieldTo(root, contextChain.slice(1), cursor, path);
      });

      return [query, path];
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
