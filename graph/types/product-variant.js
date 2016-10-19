
const ProductVariant = {
  "name": "ProductVariant",
  "kind": "OBJECT",
  "scalars": {
    "available": {
      "type": "Boolean",
      "kind": "SCALAR",
      "isList": false,
      "args": []
    },
    "id": {
      "type": "ID",
      "kind": "SCALAR",
      "isList": false,
      "args": []
    },
    "price": {
      "type": "Money",
      "kind": "SCALAR",
      "isList": false,
      "args": []
    },
    "title": {
      "type": "String",
      "kind": "SCALAR",
      "isList": false,
      "args": []
    },
    "weight": {
      "type": "Float",
      "kind": "SCALAR",
      "isList": false,
      "args": []
    }
  },
  "objects": {
    "images": {
      "type": "Image",
      "kind": "OBJECT",
      "isList": true,
      "args": ["first", "maxWidth", "maxHeight", "crop", "scale"]
    },
    "selectedOptions": {
      "type": "SelectedOption",
      "kind": "OBJECT",
      "isList": true,
      "args": []
    }
  },
  "connections": {},
  "implementsNode": true
};
export default Object.freeze(ProductVariant);