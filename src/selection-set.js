import join from './join';
import schemaForType from './schema-for-type';
import formatArgs from './format-args';
import noop from './noop';

function getArgsAndCallback(paramArgsCallback) {
  let callback = noop;
  let args = {};
  let selectionSet = null;

  if (paramArgsCallback.length === 2) {
    if (typeof paramArgsCallback[1] === 'function') {
      [args, callback] = paramArgsCallback;
    } else {
      [args, selectionSet] = paramArgsCallback;
    }
  } else if (paramArgsCallback.length === 1) {
    if (typeof paramArgsCallback[0] === 'function') {
      callback = paramArgsCallback[0];
    // SelectionSet is defined before this function is called since it's
    // called by SelectionSet
    // eslint-disable-next-line no-use-before-define
    } else if (SelectionSet.prototype.isPrototypeOf(paramArgsCallback[0])) {
      selectionSet = paramArgsCallback[0];
    } else {
      args = paramArgsCallback[0];
    }
  }

  return {args, selectionSet, callback};
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


export default class SelectionSet {
  constructor(typeBundle, type) {
    if (typeof type === 'string') {
      this.typeSchema = schemaForType(typeBundle, type);
    } else {
      this.typeSchema = type;
    }
    this.typeBundle = typeBundle;
    this.selections = [];
  }

  hasSelectionWithName(name) {
    return this.selections.some((field) => {
      return field.name === name;
    });
  }

  toString() {
    if (this.typeSchema.kind === 'SCALAR') {
      return '';
    } else {
      const commaDelimitedSelections = join(this.selections.map((selection) => {
        return selection.toString();
      }));

      return ` { ${commaDelimitedSelections} }`;
    }
  }

  /**
   * will add a field to be queried to the current query node.
   *
   * @param {String}    name The name of the field to add to the query
   * @param {Object}    [args] Arguments for the field to query
   * @param {Function}  [callback] Callback which will return a new query node for the field added
   */
  addField(name, ...paramArgsCallback) {
    if (this.hasSelectionWithName(name)) {
      throw new Error(`The field '${name}' has already been added`);
    }

    const parsedArgs = getArgsAndCallback(paramArgsCallback);
    const {args, callback} = parsedArgs;
    let {selectionSet} = parsedArgs;

    if (!selectionSet) {
      const fieldBaseType = schemaForType(this.typeBundle, this.typeSchema.fieldBaseTypes[name]);

      selectionSet = new SelectionSet(this.typeBundle, fieldBaseType);
      // selectionSet = new SelectionSet(this.typeBundle, fieldDescriptor.schema);
      callback(selectionSet);
    }

    this.selections.push(new Field(name, args, selectionSet));
  }

  /**
   * will add a connection to be queried to the current query node.
   *
   * @param {String}    name The name of the connection to add to the query
   * @param {Object}    [args] Arguments for the connection query eg. { first: 10 }
   * @param {Function|SelectionSet}  [callback|selectionSet] Either pass a callback which will return a new
   *                                                         SelectionSet. Or pass an existing SelectionSet.
   */
  addConnection(name, ...paramArgsCallback) {
    const {args, callback} = getArgsAndCallback(paramArgsCallback);

    this.addField(name, args, (connection) => {
      connection.addField('pageInfo', {}, (pageInfo) => {
        pageInfo.addField('hasNextPage');
        pageInfo.addField('hasPreviousPage');
      });
      connection.addField('edges', {}, (edges) => {
        edges.addField('cursor');
        edges.addField('node', {}, callback);
      });
    });
  }

  addInlineFragmentOn(typeName, fieldTypeCb = noop) {
    const selectionSet = new SelectionSet(this.typeBundle, schemaForType(this.typeBundle, typeName));

    fieldTypeCb(selectionSet);
    this.selections.push(new InlineFragment(typeName, selectionSet));
  }
}
