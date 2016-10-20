import join from './join';
import descriptorForField from './descriptor-for-field';
import schemaForType from './schema-for-type';
import noop from './noop';

function formatArgPair(key, hash) {
  return `${key}: ${JSON.stringify(hash[key])}`;
}

function formatArgs(argumentHash) {
  const keys = Object.keys(argumentHash);

  if (!keys.length) {
    return '';
  }

  const formattedArgs = Object.keys(argumentHash).map((key) => {
    return formatArgPair(key, argumentHash);
  });

  return ` (${join(formattedArgs)})`;
}

function getArgsAndCallback(paramArgsCallback) {
  let callback = noop;
  let args = {};

  if (paramArgsCallback.length === 1) {
    if (typeof paramArgsCallback[0] === 'function') {
      callback = paramArgsCallback[0];
    } else {
      args = paramArgsCallback[0];
    }
  } else if (paramArgsCallback.length === 2) {
    [args, callback] = paramArgsCallback;
  }

  return {args, callback};
}

class Field {
  constructor(name, args, selectionSet) {
    this.name = name;
    this.args = args;
    this.selectionSet = selectionSet;
  }
  toString() {
    return `${this.name}${formatArgs(this.args)}${this.selectionSet.toString()}`;
  }
}

class InlineFragment {
  constructor(typeName, selectionSet) {
    this.typeName = typeName;
    this.selectionSet = selectionSet;
  }
  toString() {
    return `... on ${this.typeName}${this.selectionSet.toString()}`;
  }
}

export default class Query {
  constructor(typeBundle, type = 'QueryRoot', parent) {
    if (typeof type === 'string') {
      this.typeSchema = schemaForType(typeBundle, type);
    } else {
      this.typeSchema = type;
    }

    this.typeBundle = typeBundle;
    this.parent = parent;
    this.fields = [];
  }

  get label() {
    if (this.typeSchema.name === 'QueryRoot') {
      return 'query';
    }

    return `fragment on ${this.typeSchema.name}`;
  }

  get body() {
    if (this.typeSchema.kind === 'SCALAR') {
      return '';
    }

    return ` { ${this.selections} }`;
  }

  get selections() {
    return join(this.fields.map((field) => {
      return field.toString();
    }));
  }

  toString() {
    if (this.parent) {
      return this.body;
    }

    return `${this.label} ${this.body}`;
  }

  /**
   * will add a field to be queried to the current query node.
   *
   * @param {String}    name The name of the field to add to the query
   * @param {Object}    [args] Arguments for the field to query
   * @param {Function}  [callback] Callback which will return a new query node for the field added
   */
  addField(name, ...paramArgsCallback) {
    const {args, callback} = getArgsAndCallback(paramArgsCallback);

    const fieldDescriptor = descriptorForField(this.typeBundle, name, this.typeSchema.name);
    const selectionSet = new Query(this.typeBundle, fieldDescriptor.schema, this);

    callback(selectionSet);

    this.fields.push(new Field(name, args, selectionSet));
  }

  /**
   * will add a connection to be queried to the current query node.
   *
   * @param {String}    name The name of the connection to add to the query
   * @param {Object}    [args] Arguments for the connection query eg. { first: 10 }
   * @param {Function}  [callback] Callback which will return a new query node for the connection added
   */
  addConnection(name, ...paramArgsCallback) {
    const {args, callback} = getArgsAndCallback(paramArgsCallback);

    const fieldDescriptor = descriptorForField(this.typeBundle, name, this.typeSchema.name);
    const selectionSet = new Query(this.typeBundle, fieldDescriptor.schema, this);

    selectionSet.addField('pageInfo', {}, (pageInfo) => {
      pageInfo.addField('hasNextPage');
      pageInfo.addField('hasPreviousPage');
    });

    selectionSet.addField('edges', {}, (edges) => {
      edges.addField('cursor');
      edges.addField('node', {}, callback);
    });

    this.fields.push(new Field(name, args, selectionSet));
  }

  addInlineFragmentOn(typeName, fieldTypeCb = noop) {
    const selectionSet = new Query(this.typeBundle, schemaForType(this.typeBundle, typeName), this);

    fieldTypeCb(selectionSet);
    this.fields.push(new InlineFragment(typeName, selectionSet));
  }
}
