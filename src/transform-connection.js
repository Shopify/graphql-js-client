import Query from './query';
import isNodeContext from './is-node-context';

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

function addNextFieldTo(currentSelection, contextChain, cursor) {
  // There are always at least two. When we start, it's the root context, and the first set
  const nextContext = contextChain.shift();

  if (contextChain.length) {
    currentSelection.add(nextContext.selection.name, {alias: nextContext.selection.alias, args: nextContext.selection.args}, (newSelection) => {
      addNextFieldTo(newSelection, contextChain, cursor);
    });
  } else {
    const edgesField = nextContext.selection.selectionSet.selections.find((field) => {
      return field.name === 'edges';
    });
    const nodeField = edgesField.selectionSet.selections.find((field) => {
      return field.name === 'node';
    });
    const options = {
      alias: nextContext.selection.alias,
      args: Object.assign({}, nextContext.selection.args, {after: cursor})
    };

    currentSelection.addConnection(nextContext.selection.name, options, nodeField.selectionSet);
  }
}

function nextPageQuery(context, value) {
  const nearestNodeContext = nearestNode(context);

  if (nearestNodeContext) {
    return function() {
      const nodeType = nearestNodeContext.selection.selectionSet.typeSchema;
      const nodeId = nearestNodeContext.responseData.id;
      const contextChain = contextsFromNearestNode(context);

      return new Query(context.selection.selectionSet.typeBundle, (root) => {
        root.add('node', {args: {id: nodeId}}, (node) => {
          node.addInlineFragmentOn(nodeType.name, (fragment) => {
            addNextFieldTo(fragment, contextChain.slice(1), value.edges[value.edges.length - 1].cursor);
          });
        });
      });
    };
  } else {
    return function() {
      const contextChain = contextsFromRoot(context);

      return new Query(context.selection.selectionSet.typeBundle, (root) => {
        addNextFieldTo(root, contextChain.slice(1), value.edges[value.edges.length - 1].cursor);
      });
    };
  }
}

export default function transformConnections(context, value) {
  if (isConnection(context)) {
    const page = value.edges.map((edge) => edge.node);

    page.nextPageQuery = nextPageQuery(context, value);

    return page;
  } else {
    return value;
  }
}
