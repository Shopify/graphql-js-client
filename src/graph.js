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

export default class Graph {
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
      return `${field.name}${formatArgs(field.args)}${field.node.toQuery()}`;
    }));
  }

  toQuery() {
    if (this.parent) {
      return this.body;
    }

    return `${this.label} ${this.body}`;
  }

  addField(name, args = {}, fieldTypeCb = noop) {
    const fieldDescriptor = descriptorForField(this.typeBundle, name, this.typeSchema.name);
    const node = new Graph(this.typeBundle, fieldDescriptor.schema, this);

    fieldTypeCb(node);

    this.fields.push({name, args, node, fieldTypeCb});
  }

  addConnection(name, args = {}, fieldTypeCb = noop) {
    const fieldDescriptor = descriptorForField(this.typeBundle, name, this.typeSchema.name);
    const node = new Graph(this.typeBundle, fieldDescriptor.schema, this);

    node.addField('pageInfo', {}, (pageInfo) => {
      pageInfo.addField('hasNextPage');
      pageInfo.addField('hasPreviousPage');
    });

    node.addField('edges', {}, (edges) => {
      edges.addField('cursor');
      edges.addField('node', {}, fieldTypeCb);
    });

    this.fields.push({name, args, node, fieldTypeCb});
  }
}
