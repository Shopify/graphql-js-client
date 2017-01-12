export default function isNodeContext(context) {
  return context.selection.selectionSet.typeSchema.implementsNode;
}
