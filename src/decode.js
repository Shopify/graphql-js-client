/* eslint-disable no-warning-comments */
import ClassRegistry from './class-registry';
import {Field} from './selection-set';
import Query from '../src/query';

class DecodingContext {
  constructor(selection, responseData, parent = null) {
    this.selection = selection;
    this.responseData = responseData;
    this.parent = parent;
    Object.freeze(this);
  }

  contextForObjectProperty(responseKey) {
    const nestedSelections = this.selection.selectionSet.selectionsByResponseKey[responseKey];
    const nextSelection = nestedSelections && nestedSelections[0];
    const nextContext = new DecodingContext(nextSelection, this.responseData[responseKey], this);

    if (!nextSelection) {
      throw new Error(`Unexpected response key "${responseKey}", not found in selection set: ${this.selection.selectionSet}`);
    }

    if (nextSelection instanceof Field) {
      return nextContext;
    } else {
      return nextContext.contextForObjectProperty(responseKey);
    }
  }

  contextForArrayItem(item) {
    return new DecodingContext(this.selection, item, this.parent);
  }
}

function decodeArrayItems(context, transformers) {
  return context.responseData.map((item) => decodeContext(context.contextForArrayItem(item), transformers));
}

function decodeObjectValues(context, transformers) {
  return Object.keys(context.responseData).reduce((acc, responseKey) => {
    acc[responseKey] = decodeContext(context.contextForObjectProperty(responseKey), transformers);

    return acc;
  }, {});
}

function isObject(value) {
  return Object.prototype.toString.call(value) === '[object Object]';
}


function runTransformers(transformers, context, value) {
  return transformers.reduce((acc, transformer) => {
    return transformer(context, acc);
  }, value);
}


function decodeContext(context, transformers) {
  let value = context.responseData;

  if (Array.isArray(value)) {
    value = decodeArrayItems(context, transformers);
  } else if (isObject(value)) {
    value = decodeObjectValues(context, transformers);
  }

  return runTransformers(transformers, context, value);
}

function isNode(context) {
  return context.selection.selectionSet.typeSchema.implementsNode;
}

function generateRefetchQueries(context, value) {
  if (isNode(context)) {
    value.attrs.refetchQuery = function() {
      return new Query(context.selection.selectionSet.typeBundle, (root) => {
        root.add('node', {args: {id: context.data.id}}, (node) => {
          node.addInlineFragmentOn(context.selection.selectionSet.typeSchema.name, context.selection.selectionSet);
        });
      });
    };
  }

  return value;
}

function isConnection(context) {
  return context.selection.selectionSet.typeSchema.name.endsWith('Connection');
}

function nearestNode(context) {
  if (context == null) {
    return null;
  } else if (isNode(context)) {
    return context;
  } else {
    return nearestNode(context.parent);
  }
}

// eslint-disable-next-line no-unused-vars
function nextPageQuery(context, value) {
  const nearestNodeContext = nearestNode(context);

  if (nearestNodeContext) {
    return function() {
      // eslint-disable-next-line no-unused-vars
      return new Query(context.selection.selectionSet.typeBundle, (root) => {
        // TODO
      });
    };
  } else {
    return function() {
      // TODO
    };
  }
}

function transformConnections(context, value) {
  if (isConnection(context)) {
    const page = value.edges.map((edge) => edge.node);

    page.nextPageQuery = nextPageQuery(context, value);

    return page;
  } else {
    return value;
  }
}

function transformPojosToClassesWithRegistry(classRegistry) {
  return function transformPojosToClasses(context, value) {
    if (isObject(value)) {
      const Klass = classRegistry.classForType(context.selection.selectionSet.typeSchema.name);

      return new Klass(value);
    } else {
      return value;
    }
  };
}

function defaultTransformers(options) {
  const classRegistry = options.classRegistry || new ClassRegistry();

  return [
    transformPojosToClassesWithRegistry(classRegistry),
    generateRefetchQueries,
    transformConnections
  ];
}

export default function decode(selection, responseData, options = {}) {
  const transformers = options.transformers || defaultTransformers(options);
  const context = new DecodingContext(selection, responseData);


  return decodeContext(context, transformers);
}
