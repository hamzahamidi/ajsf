import { cloneDeep } from './clone-deep.function';
import {
  checkInlineType,
  getFromSchema,
  getInputType,
  isInputRequired,
  removeRecursiveReferences,
  updateInputOptions
  } from './json-schema.functions';
import {
  copy,
  fixTitle,
  forEach,
  hasOwn
  } from './utility.functions';
import {
  inArray,
  isArray,
  isDefined,
  isEmpty,
  isNumber,
  isObject,
  isString
  } from './validator.functions';
import { JsonPointer } from './jsonpointer.functions';
import { TitleMapItem } from '../json-schema-form.service';

let idCounter = 0;

const legacyValidationMessageCodes: ReadonlyMap<string, string> = new Map<string, string>([
  ['0', 'type'],
  ['1', 'enum'],
  ['100', 'multipleOf'],
  ['101', 'minimum'],
  ['102', 'exclusiveMinimum'],
  ['103', 'maximum'],
  ['104', 'exclusiveMaximum'],
  ['200', 'minLength'],
  ['201', 'maxLength'],
  ['202', 'pattern'],
  ['300', 'minProperties'],
  ['301', 'maxProperties'],
  ['302', 'required'],
  ['304', 'dependencies'],
  ['400', 'minItems'],
  ['401', 'maxItems'],
  ['402', 'uniqueItems'],
  ['500', 'format'],
]);

const uniqueId = () => String(++idCounter);

function hasArrayDataPointer(item) {
  return hasOwn(item, 'dataPointer') && item.dataPointer.includes('/-');
}

function findDataPointer(items) {
  if (items === null || typeof items !== 'object') { return; }
  if (hasOwn(items, 'dataPointer')) { return items.dataPointer; }
  if (isArray(items.items)) {
    for (const item of items.items) {
      if (hasArrayDataPointer(item)) {
        return item.dataPointer;
      }
      if (hasOwn(item, 'items')) {
        const searchItem = findDataPointer(item);
        if (searchItem) { return searchItem; }
      }
    }
  }
}



/**
 * Layout function library:
 *
 * buildLayout:            Builds a complete layout from an input layout and schema
 *
 * buildLayoutFromSchema:  Builds a complete layout entirely from an input schema
 *
 * mapLayout:
 *
 * getLayoutNode:
 *
 * buildTitleMap:
 */

/**
 * 'buildLayout' function
 *
 * //   jsf
 * //   widgetLibrary
 * //
 */
interface LayoutBuildContext {
  jsf: any;
  widgetLibrary: any;
  hasSubmitButton: boolean;
}

interface LayoutNodeSchemaContext {
  nodeValue: any;
  nodeSchema: any;
  schemaPointer: string;
  nodeDataMap: any;
  shortDataPointer: string;
  recursive: boolean;
}

export function buildLayout(jsf, widgetLibrary) {
  const context: LayoutBuildContext = {
    jsf,
    widgetLibrary,
    hasSubmitButton: !JsonPointer.get(jsf, '/formOptions/addSubmit'),
  };
  const formLayout = mapLayout(jsf.layout, (layoutItem, _index, layoutPointer) =>
    buildLayoutItem(layoutItem, layoutPointer, context)
  );
  registerRootLayout(context, formLayout);
  appendSubmitButton(context, formLayout);
  return formLayout;
}

function buildLayoutItem(
  layoutItem: any,
  layoutPointer: string,
  context: LayoutBuildContext,
): any {
  const newNode = normalizeLayoutItem(layoutItem);
  if (!newNode) return null;
  normalizeLayoutDataPointer(newNode);
  if (hasOwn(newNode, 'dataPointer')) {
    if (newNode.dataPointer === '*') {
      return buildLayoutFromSchema(context.jsf, context.widgetLibrary, context.jsf.formValues);
    }
    buildDataPointerNode(newNode, context);
  } else if (hasOwn(newNode, 'type') || hasOwn(newNode, 'items')) {
    buildLayoutGroupNode(newNode, layoutPointer, context);
  }
  if (newNode.type === 'submit') context.hasSubmitButton = true;
  return newNode;
}

function normalizeLayoutItem(layoutItem: any): any | null {
  const newNode: any = { _id: uniqueId(), options: {} };
  if (isObject(layoutItem)) {
    Object.assign(newNode, layoutItem);
    const layoutProperties = Object.keys(newNode).filter(option => !inArray(option, [
      '_id', '$ref', 'arrayItem', 'arrayItemType', 'dataPointer', 'dataType',
      'items', 'key', 'name', 'options', 'recursiveReference', 'type', 'widget'
    ]));
    for (const option of layoutProperties) {
      newNode.options[option] = newNode[option];
      delete newNode[option];
    }
    normalizeLayoutNodeType(newNode);
    normalizeLayoutNodeTitle(newNode);
    normalizeLayoutNodeValidationMessages(newNode.options);
    return newNode;
  }
  if (JsonPointer.isJsonPointer(layoutItem)) {
    newNode.dataPointer = layoutItem;
    return newNode;
  }
  if (isString(layoutItem)) {
    newNode.key = layoutItem;
    return newNode;
  }
  console.error('buildLayout error: Form layout element not recognized:');
  console.error(layoutItem);
  return null;
}

function normalizeLayoutNodeType(node: any): void {
  if (!hasOwn(node, 'type') && isString(node.widget)) {
    node.type = node.widget;
    delete node.widget;
  }
}

function normalizeLayoutNodeTitle(node: any): void {
  if (!hasOwn(node.options, 'title') && hasOwn(node.options, 'legend')) {
    node.options.title = node.options.legend;
    delete node.options.legend;
  }
}

function normalizeLayoutNodeValidationMessages(options: any): void {
  if (hasOwn(options, 'validationMessages')) return;
  if (hasOwn(options, 'errorMessages')) {
    options.validationMessages = options.errorMessages;
    delete options.errorMessages;
    return;
  }
  if (!hasOwn(options, 'validationMessage')) return;
  options.validationMessages = convertLegacyValidationMessages(options.validationMessage);
  delete options.validationMessage;
}

function convertLegacyValidationMessages(messages: any): any {
  if (typeof messages === 'string') return messages;
  const validationMessages = {};
  for (const key of Object.keys(messages)) {
    const code = key + '';
    const newKey = legacyValidationMessageCodes.get(code) ?? code;
    validationMessages[newKey] = messages[key];
  }
  return validationMessages;
}

function normalizeLayoutDataPointer(node: any): void {
  if (hasOwn(node, 'dataPointer')) return;
  if (hasOwn(node, 'key')) {
    node.dataPointer = node.key === '*'
      ? node.key
      : JsonPointer.compile(JsonPointer.parseObjectPath(node.key), '-');
    delete node.key;
    return;
  }
  if (!hasOwn(node, 'type') || node.type.slice(-5) !== 'array') return;
  const childDataPointer = findDataPointer(node);
  if (childDataPointer) {
    node.dataPointer = childDataPointer.slice(0, childDataPointer.lastIndexOf('/-'));
  }
}

function buildDataPointerNode(node: any, context: LayoutBuildContext): void {
  const nodeContext = resolveLayoutNodeSchema(node, context);
  configureLayoutNodeFromSchema(node, nodeContext, context);
  normalizeLayoutNodeOptions(node);
  registerLayoutNodeWidget(node, nodeContext, context);
  if (node.dataType === 'array') {
    inferArrayItemsFromSchema(node, nodeContext, context);
    if (hasOwn(node, 'items') || hasOwn(node, 'additionalItems')) {
      buildArrayLayout(node, nodeContext, context);
      return;
    }
  }
  node.arrayItem = false;
}

function resolveLayoutNodeSchema(node: any, context: LayoutBuildContext): LayoutNodeSchemaContext {
  const { jsf } = context;
  const nodeValue = JsonPointer.get(
    jsf.formValues,
    node.dataPointer.replaceAll('/-', '/1')
  );
  node.dataPointer = JsonPointer.toGenericPointer(node.dataPointer, jsf.arrayMap);
  const lastKey = JsonPointer.toKey(node.dataPointer);
  if (!node.name && isString(lastKey) && lastKey !== '-') node.name = lastKey;
  const shortDataPointer = removeRecursiveReferences(
    node.dataPointer, jsf.dataRecursiveRefMap, jsf.arrayMap
  );
  const recursive = !shortDataPointer.length || shortDataPointer !== node.dataPointer;
  if (!jsf.dataMap.has(shortDataPointer)) jsf.dataMap.set(shortDataPointer, new Map());
  const nodeDataMap = jsf.dataMap.get(shortDataPointer);
  const schemaPointer = getLayoutSchemaPointer(shortDataPointer, nodeDataMap, jsf);
  nodeDataMap.set('disabled', !!node.options.disabled);
  return {
    nodeValue,
    nodeSchema: JsonPointer.get(jsf.schema, schemaPointer),
    schemaPointer,
    nodeDataMap,
    shortDataPointer,
    recursive,
  };
}

function getLayoutSchemaPointer(shortDataPointer: string, nodeDataMap: any, jsf: any): string {
  if (nodeDataMap.has('schemaPointer')) return nodeDataMap.get('schemaPointer');
  const schemaPointer = JsonPointer.toSchemaPointer(shortDataPointer, jsf.schema);
  nodeDataMap.set('schemaPointer', schemaPointer);
  return schemaPointer;
}

function configureLayoutNodeFromSchema(
  node: any,
  nodeContext: LayoutNodeSchemaContext,
  context: LayoutBuildContext,
): void {
  const { jsf, widgetLibrary } = context;
  const { nodeSchema, schemaPointer, nodeDataMap, shortDataPointer, nodeValue } = nodeContext;
  if (!nodeSchema) {
    updateInputOptions(node, {}, jsf);
    return;
  }
  configureLayoutNodeType(node, nodeSchema, widgetLibrary);
  if (nodeSchema.type === 'object' && isArray(nodeSchema.required)) {
    nodeDataMap.set('required', nodeSchema.required);
  }
  node.dataType = nodeSchema.type || (hasOwn(nodeSchema, '$ref') ? '$ref' : null);
  updateInputOptions(node, nodeSchema, jsf);
  if (node.type === 'checkboxes' && hasOwn(nodeSchema, 'items')) {
    updateInputOptions(node, nodeSchema.items, jsf);
  } else if (node.dataType === 'array') {
    configureArrayOptions(node, nodeSchema, nodeValue, shortDataPointer, nodeDataMap, jsf);
  }
  if (isInputRequired(jsf.schema, schemaPointer)) {
    node.options.required = true;
    jsf.fieldsRequired = true;
  }
}

function configureLayoutNodeType(node: any, nodeSchema: any, widgetLibrary: any): void {
  if (!hasOwn(node, 'type')) {
    node.type = getInputType(nodeSchema, node);
    return;
  }
  if (widgetLibrary.hasWidget(node.type)) {
    node.type = checkInlineType(node.type, nodeSchema, node);
    return;
  }
  const oldWidgetType = node.type;
  node.type = getInputType(nodeSchema, node);
  console.error(`error: widget type "${oldWidgetType}" ` +
    `not found in library. Replacing with "${node.type}".`);
}

function configureArrayOptions(
  node: any,
  schema: any,
  nodeValue: any,
  shortDataPointer: string,
  nodeDataMap: any,
  jsf: any,
): void {
  node.options.maxItems = Math.min(schema.maxItems || 1000, node.options.maxItems || 1000);
  node.options.minItems = Math.max(schema.minItems || 0, node.options.minItems || 0);
  node.options.listItems = Math.max(
    node.options.listItems || 0,
    isArray(nodeValue) ? nodeValue.length : 0
  );
  node.options.tupleItems = isArray(schema.items) ? schema.items.length : 0;
  reconcileArrayItemCounts(node);
  if (!nodeDataMap.has('maxItems')) {
    nodeDataMap.set('maxItems', node.options.maxItems);
    nodeDataMap.set('minItems', node.options.minItems);
    nodeDataMap.set('tupleItems', node.options.tupleItems);
    nodeDataMap.set('listItems', node.options.listItems);
  }
  if (!jsf.arrayMap.has(shortDataPointer)) {
    jsf.arrayMap.set(shortDataPointer, node.options.tupleItems);
  }
}

function reconcileArrayItemCounts(node: any): void {
  if (node.options.maxItems < node.options.tupleItems) {
    node.options.tupleItems = node.options.maxItems;
    node.options.listItems = 0;
    return;
  }
  if (node.options.maxItems < node.options.tupleItems + node.options.listItems) {
    node.options.listItems = node.options.maxItems - node.options.tupleItems;
    return;
  }
  if (node.options.minItems > node.options.tupleItems + node.options.listItems) {
    node.options.listItems = node.options.minItems - node.options.tupleItems;
  }
}

function normalizeLayoutNodeOptions(node: any): void {
  if (!node.options.title && !/^\d+$/.test(node.name)) {
    node.options.title = fixTitle(node.name);
  }
  if (!hasOwn(node.options, 'copyValueTo')) return;
  const copyValueTo = node.options.copyValueTo;
  if (typeof copyValueTo === 'string') node.options.copyValueTo = [copyValueTo];
  if (isArray(node.options.copyValueTo)) {
    node.options.copyValueTo = node.options.copyValueTo.map(item =>
      JsonPointer.compile(JsonPointer.parseObjectPath(item), '-')
    );
  }
}

function registerLayoutNodeWidget(
  node: any,
  nodeContext: LayoutNodeSchemaContext,
  context: LayoutBuildContext,
): void {
  node.widget = context.widgetLibrary.getWidget(node.type);
  nodeContext.nodeDataMap.set('inputType', node.type);
  nodeContext.nodeDataMap.set('widget', node.widget);
}

function inferArrayItemsFromSchema(
  node: any,
  nodeContext: LayoutNodeSchemaContext,
  context: LayoutBuildContext,
): void {
  if (hasOwn(node, 'items') || hasOwn(node, 'additionalItems') ||
    !inArray(node.type, ['array', 'tabarray'])) return;
  const fromSchema = buildLayoutFromSchema(
    context.jsf, context.widgetLibrary, nodeContext.nodeValue,
    nodeContext.schemaPointer, node.dataPointer,
    node.arrayItem, node.arrayItemType, node.options.removable
  );
  if (fromSchema && isArray(fromSchema.items) && fromSchema.items.length) {
    node.items = fromSchema.items;
  }
}

function buildArrayLayout(
  node: any,
  nodeContext: LayoutNodeSchemaContext,
  context: LayoutBuildContext,
): void {
  const itemRefPointer = createArrayItemReference(node, context);
  normalizeArrayItems(node, itemRefPointer, context);
  updateArrayListItemCount(node, nodeContext.nodeDataMap);
  registerArrayItemReference(node, nodeContext, itemRefPointer, context);
  appendRequiredArrayItems(node, itemRefPointer, nodeContext.nodeValue, context);
  appendArrayAddButton(node, itemRefPointer, nodeContext.recursive, context);
}

function createArrayItemReference(node: any, context: LayoutBuildContext): string {
  const { jsf } = context;
  const itemRefPointer = removeRecursiveReferences(
    node.dataPointer + '/-', jsf.dataRecursiveRefMap, jsf.arrayMap
  );
  if (!jsf.dataMap.has(itemRefPointer)) jsf.dataMap.set(itemRefPointer, new Map());
  jsf.dataMap.get(itemRefPointer).set('inputType', 'section');
  return itemRefPointer;
}

function normalizeArrayItems(node: any, itemRefPointer: string, context: LayoutBuildContext): void {
  if (node.items.length > 1) {
    groupArrayItemNodes(node, itemRefPointer, context);
    return;
  }
  if (node.items.length) normalizeSingleArrayItem(node, itemRefPointer, context.jsf);
}

function groupArrayItemNodes(node: any, itemRefPointer: string, context: LayoutBuildContext): void {
  const arrayItemGroup = [];
  for (let i = node.items.length - 1; i >= 0; i--) {
    const subItem = node.items[i];
    if (hasOwn(subItem, 'dataPointer') &&
      subItem.dataPointer.slice(0, itemRefPointer.length) === itemRefPointer
    ) {
      const arrayItem = node.items.splice(i, 1)[0];
      arrayItem.dataPointer = node.dataPointer + '/-' +
        arrayItem.dataPointer.slice(itemRefPointer.length);
      arrayItemGroup.unshift(arrayItem);
      continue;
    }
    configureArrayItemNode(subItem, node);
  }
  if (!arrayItemGroup.length) return;
  node.items.push({
    _id: uniqueId(),
    arrayItem: true,
    arrayItemType: node.options.tupleItems > node.items.length ? 'tuple' : 'list',
    items: arrayItemGroup,
    options: { removable: node.options.removable !== false },
    dataPointer: node.dataPointer + '/-',
    type: 'section',
    widget: context.widgetLibrary.getWidget('section'),
  });
}

function configureArrayItemNode(subItem: any, node: any): void {
  subItem.arrayItem = true;
  const slot = Number(String(subItem.dataPointer).split('/').pop());
  const tupleSlot = Number.isInteger(slot) && slot < node.options.tupleItems;
  subItem.arrayItemType = tupleSlot ? 'tuple' : 'list';
  subItem.removable = !tupleSlot && node.options.removable !== false;
}

function normalizeSingleArrayItem(node: any, itemRefPointer: string, jsf: any): void {
  const item = node.items[0];
  item.arrayItem = true;
  if (!item.dataPointer) {
    item.dataPointer = JsonPointer.toGenericPointer(itemRefPointer, jsf.arrayMap);
  }
  if (!JsonPointer.has(node, '/items/0/options/removable')) item.options.removable = true;
  if (node.options.orderable === false) item.options.orderable = false;
  item.arrayItemType = node.options.tupleItems ? 'tuple' : 'list';
}

function updateArrayListItemCount(node: any, nodeDataMap: any): void {
  if (!isArray(node.items)) return;
  const arrayListItems = node.items.filter(item => item.type !== '$ref').length -
    node.options.tupleItems;
  if (arrayListItems <= node.options.listItems) return;
  node.options.listItems = arrayListItems;
  nodeDataMap.set('listItems', arrayListItems);
}

function registerArrayItemReference(
  node: any,
  nodeContext: LayoutNodeSchemaContext,
  itemRefPointer: string,
  context: LayoutBuildContext,
): void {
  const { jsf } = context;
  if (hasOwn(jsf.layoutRefLibrary, itemRefPointer)) return;
  const lastItem = node.items.at(-1);
  const listItemSchemaPointer = getArrayListItemSchemaPointer(nodeContext);
  // A tuple slot is fixed, so the schema defines the template for new list items.
  if (lastItem?.arrayItemType === 'tuple' && listItemSchemaPointer) {
    registerTupleListItemReference(node, nodeContext.recursive, itemRefPointer, listItemSchemaPointer, context);
    return;
  }
  registerClonedArrayItemReference(lastItem, node, nodeContext.recursive, itemRefPointer, jsf);
}

function getArrayListItemSchemaPointer(nodeContext: LayoutNodeSchemaContext): string | null {
  const { nodeSchema, schemaPointer } = nodeContext;
  if (isArray(nodeSchema?.items)) {
    return isObject(nodeSchema.additionalItems) ? schemaPointer + '/additionalItems' : null;
  }
  return isObject(nodeSchema?.items) ? schemaPointer + '/items' : null;
}

function registerTupleListItemReference(
  node: any,
  recursive: boolean,
  itemRefPointer: string,
  listItemSchemaPointer: string,
  context: LayoutBuildContext,
): void {
  const { jsf, widgetLibrary } = context;
  // Register the in-progress reference before schema expansion to stop recursive layouts.
  jsf.layoutRefLibrary[itemRefPointer] = null;
  jsf.layoutRefLibrary[itemRefPointer] = buildLayoutFromSchema(
    jsf, widgetLibrary, null,
    removeRecursiveReferences(listItemSchemaPointer, jsf.schemaRecursiveRefMap, jsf.arrayMap),
    recursive ? '' : node.dataPointer + '/-',
    true, 'list', node.options.removable !== false, true,
    recursive ? node.dataPointer + '/-' : ''
  );
  if (recursive && jsf.layoutRefLibrary[itemRefPointer]) {
    jsf.layoutRefLibrary[itemRefPointer].recursiveReference = true;
  }
}

function registerClonedArrayItemReference(
  lastItem: any,
  node: any,
  recursive: boolean,
  itemRefPointer: string,
  jsf: any,
): void {
  jsf.layoutRefLibrary[itemRefPointer] = cloneDeep(lastItem);
  if (recursive) jsf.layoutRefLibrary[itemRefPointer].recursiveReference = true;
  // Only cloned siblings carry ids and absolute data pointers that need adjustment.
  forEach(jsf.layoutRefLibrary[itemRefPointer], (item, _key) => {
    if (hasOwn(item, '_id')) item._id = null;
    if (recursive && hasOwn(item, 'dataPointer')) {
      item.dataPointer = item.dataPointer.slice(itemRefPointer.length);
    }
  }, 'top-down');
}

function appendRequiredArrayItems(
  node: any,
  itemRefPointer: string,
  nodeValue: any,
  context: LayoutBuildContext,
): void {
  if (node.recursiveReference && !node.options.required) return;
  const valueLength = isArray(nodeValue) ? nodeValue.length : 0;
  const arrayLength = Math.min(
    Math.max(node.options.tupleItems + node.options.listItems, valueLength),
    node.options.maxItems
  );
  for (let i = node.items.length; i < arrayLength; i++) {
    node.items.push(getLayoutNode({
      $ref: itemRefPointer,
      dataPointer: node.dataPointer,
      recursiveReference: node.recursiveReference,
    }, context.jsf, context.widgetLibrary));
  }
}

function appendArrayAddButton(
  node: any,
  itemRefPointer: string,
  recursive: boolean,
  context: LayoutBuildContext,
): void {
  if (!shouldAddArrayButton(node)) return;
  const buttonText = getArrayButtonText(node, context.jsf);
  const button = {
    _id: uniqueId(),
    arrayItem: true,
    arrayItemType: 'list',
    dataPointer: node.dataPointer + '/-',
    options: {
      listItems: node.options.listItems,
      maxItems: node.options.maxItems,
      minItems: node.options.minItems,
      removable: false,
      title: buttonText,
      tupleItems: node.options.tupleItems,
    },
    recursiveReference: recursive,
    type: '$ref',
    widget: context.widgetLibrary.getWidget('$ref'),
    $ref: itemRefPointer,
  };
  node.items.push(button);
  applyArrayButtonStyle(node, button);
}

function shouldAddArrayButton(node: any): boolean {
  return node.options.addable !== false &&
    node.options.minItems < node.options.maxItems &&
    node.items.at(-1)?.type !== '$ref';
}

function getArrayButtonText(node: any, jsf: any): string {
  if (node.options.title) return arrayButtonTextFromTitle(node.options.title);
  if (node.name && !/^\d+$/.test(node.name)) return arrayButtonTextFromName(node.name);
  const parentSchema = getFromSchema(jsf.schema, node.dataPointer, 'parentSchema');
  if (hasOwn(parentSchema, 'title')) return 'Add to ' + parentSchema.title;
  const pointerArray = JsonPointer.parse(node.dataPointer);
  return 'Add to ' + fixTitle(pointerArray.at(-2));
}

function arrayButtonTextFromTitle(title: string): string {
  return /^add\b/i.test(title) ? title : 'Add ' + title;
}

function arrayButtonTextFromName(name: string): string {
  return /^add\b/i.test(name) ? 'Add ' + fixTitle(name) : fixTitle(name);
}

function applyArrayButtonStyle(node: any, button: any): void {
  if (!isString(JsonPointer.get(node, '/style/add'))) return;
  button.options.fieldStyle = node.style.add;
  delete node.style.add;
  if (isEmpty(node.style)) delete node.style;
}

function buildLayoutGroupNode(node: any, layoutPointer: string, context: LayoutBuildContext): void {
  const { jsf, widgetLibrary } = context;
  const parentType: string = JsonPointer.get(jsf.layout, layoutPointer, 0, -2).type;
  if (!hasOwn(node, 'type')) {
    node.type = inArray(parentType, ['tabs', 'tabarray']) ? 'tab' : 'array';
  }
  node.arrayItem = parentType === 'array';
  node.widget = widgetLibrary.getWidget(node.type);
  updateInputOptions(node, {}, jsf);
}

function registerRootLayout(context: LayoutBuildContext, formLayout: any[]): void {
  const { jsf, widgetLibrary } = context;
  if (!jsf.hasRootReference) return;
  const fullLayout = cloneDeep(formLayout);
  if (fullLayout.at(-1).type === 'submit') fullLayout.pop();
  jsf.layoutRefLibrary[''] = {
    _id: null,
    dataPointer: '',
    dataType: 'object',
    items: fullLayout,
    name: '',
    options: cloneDeep(jsf.formOptions.defautWidgetOptions),
    recursiveReference: true,
    required: false,
    type: 'section',
    widget: widgetLibrary.getWidget('section'),
  };
}

function appendSubmitButton(context: LayoutBuildContext, formLayout: any[]): void {
  if (context.hasSubmitButton) return;
  formLayout.push({
    _id: uniqueId(),
    options: { title: 'Submit' },
    type: 'submit',
    widget: context.widgetLibrary.getWidget('submit'),
  });
}

/**
 * 'buildLayoutFromSchema' function
 *
 * //   jsf -
 * //   widgetLibrary -
 * //   nodeValue -
 * //  { string = '' } schemaPointer -
 * //  { string = '' } dataPointer -
 * //  { boolean = false } arrayItem -
 * //  { string = null } arrayItemType -
 * //  { boolean = null } removable -
 * //  { boolean = false } forRefLibrary -
 * //  { string = '' } dataPointerPrefix -
 * //
 */
type BuildSchemaLayoutArguments = [
  nodeValue?: any,
  schemaPointer?: string,
  dataPointer?: string,
  arrayItem?: boolean,
  arrayItemType?: string | null,
  removable?: boolean | null,
  forRefLibrary?: boolean,
  dataPointerPrefix?: string,
];

interface SchemaLayoutContext {
  jsf: any;
  widgetLibrary: any;
  arrayItem: boolean;
  arrayItemType: string | null;
  removable: boolean | null;
  forRefLibrary: boolean;
  dataPointerPrefix: string;
}

interface SchemaLayoutData {
  shortDataPointer: string;
  nodeDataMap: any;
}

interface TupleSchemaLayoutContext {
  context: SchemaLayoutContext;
  newNode: any;
  schema: any;
  nodeValue: any;
  schemaPointer: string;
  dataPointer: string;
  shortDataPointer: string;
  removable: boolean;
}

interface AdditionalSchemaListContext extends TupleSchemaLayoutContext {
  additionalItemsSchemaPointer: string;
}

export function buildLayoutFromSchema(jsf, widgetLibrary, ...args: BuildSchemaLayoutArguments) {
  const [
    nodeValue = null,
    schemaPointer = '',
    dataPointer = '',
    arrayItem = false,
    arrayItemType = null,
    removable = null,
    forRefLibrary = false,
    dataPointerPrefix = '',
  ] = args;
  return buildSchemaLayout(
    { jsf, widgetLibrary, arrayItem, arrayItemType, removable, forRefLibrary, dataPointerPrefix },
    nodeValue,
    schemaPointer,
    dataPointer
  );
}

function extendSchemaLayoutContext(
  context: SchemaLayoutContext,
  changes: Partial<SchemaLayoutContext>
): SchemaLayoutContext {
  return { ...context, ...changes };
}

function buildSchemaLayout(
  context: SchemaLayoutContext,
  nodeValue: any,
  schemaPointer: string,
  dataPointer: string
) {
  const { jsf } = context;
  const schema = JsonPointer.get(jsf.schema, schemaPointer);
  if (
    !hasOwn(schema, 'type') &&
    !hasOwn(schema, '$ref') &&
    !hasOwn(schema, 'x-schema-form')
  ) {
    return null;
  }

  const newNodeType: string = getInputType(schema);
  if (
    !isDefined(nodeValue) &&
    (jsf.formOptions.setSchemaDefaults === true ||
      (jsf.formOptions.setSchemaDefaults === 'auto' && isEmpty(jsf.formValues)))
  ) {
    nodeValue = JsonPointer.get(jsf.schema, schemaPointer + '/default');
  }

  const newNode = createSchemaLayoutNode(context, schema, newNodeType, schemaPointer, dataPointer);
  const data = schemaLayoutData(jsf, context.dataPointerPrefix, dataPointer);
  if (!data.nodeDataMap.has('inputType')) {
    data.nodeDataMap.set('schemaPointer', schemaPointer);
    data.nodeDataMap.set('inputType', newNode.type);
    data.nodeDataMap.set('widget', newNode.widget);
    data.nodeDataMap.set('disabled', !!newNode.options.disabled);
  }
  updateInputOptions(newNode, schema, jsf);
  if (!newNode.options.title && newNode.name && !/^\d+$/.test(newNode.name)) {
    newNode.options.title = fixTitle(newNode.name);
  }

  if (newNode.dataType === 'object') {
    return buildObjectSchemaLayout(context, newNode, schema, nodeValue, schemaPointer, dataPointer, data.nodeDataMap);
  }
  if (newNode.dataType === 'array') {
    return buildArraySchemaLayout(context, newNode, schema, nodeValue, schemaPointer, dataPointer, data);
  }
  if (newNode.dataType === '$ref') {
    return buildReferenceSchemaLayout(context, newNode, schema, schemaPointer, dataPointer);
  }
  return newNode;
}

function createSchemaLayoutNode(
  context: SchemaLayoutContext,
  schema: any,
  newNodeType: string,
  schemaPointer: string,
  dataPointer: string
): any {
  const { jsf, widgetLibrary } = context;
  const newNode: any = {
    _id: context.forRefLibrary ? null : uniqueId(),
    arrayItem: context.arrayItem,
    dataPointer: JsonPointer.toGenericPointer(dataPointer, jsf.arrayMap),
    dataType: schema.type || (hasOwn(schema, '$ref') ? '$ref' : null),
    options: {},
    required: isInputRequired(jsf.schema, schemaPointer),
    type: newNodeType,
    widget: widgetLibrary.getWidget(newNodeType),
  };
  const lastDataKey = JsonPointer.toKey(newNode.dataPointer);
  if (lastDataKey !== '-') newNode.name = lastDataKey;
  if (newNode.arrayItem) {
    newNode.arrayItemType = context.arrayItemType;
    newNode.options.removable = context.removable !== false;
  }
  return newNode;
}

function schemaLayoutData(jsf: any, dataPointerPrefix: string, dataPointer: string): SchemaLayoutData {
  const shortDataPointer = removeRecursiveReferences(
    dataPointerPrefix + dataPointer,
    jsf.dataRecursiveRefMap,
    jsf.arrayMap
  );
  if (!jsf.dataMap.has(shortDataPointer)) jsf.dataMap.set(shortDataPointer, new Map());
  return { shortDataPointer, nodeDataMap: jsf.dataMap.get(shortDataPointer) };
}

function buildObjectSchemaLayout(
  context: SchemaLayoutContext,
  newNode: any,
  schema: any,
  nodeValue: any,
  schemaPointer: string,
  dataPointer: string,
  nodeDataMap: any
): any {
  const { jsf } = context;
  if (isArray(schema.required) && !nodeDataMap.has('required')) {
    nodeDataMap.set('required', schema.required);
  }
  if (!isObject(schema.properties)) return newNode;

  const newSection: any[] = [];
  const propertyKeys = schema['ui:order'] || Object.keys(schema.properties);
  expandSchemaPropertyOrder(propertyKeys, schema.properties);
  for (const key of propertyKeys.filter(key =>
    hasOwn(schema.properties, key) || hasOwn(schema, 'additionalProperties')
  )) {
    const keySchemaPointer = hasOwn(schema.properties, key)
      ? '/properties/' + JsonPointer.escape(key)
      : '/additionalProperties';
    const innerItem = buildSchemaLayout(
      extendSchemaLayoutContext(context, { arrayItem: false, arrayItemType: null, removable: null }),
      isObject(nodeValue) ? nodeValue[key] : null,
      schemaPointer + keySchemaPointer,
      dataPointer + '/' + JsonPointer.escape(key)
    );
    if (!innerItem) continue;
    if (isInputRequired(schema, '/' + JsonPointer.escape(key))) {
      innerItem.options.required = true;
      jsf.fieldsRequired = true;
    }
    newSection.push(innerItem);
  }

  if (dataPointer === '' && !context.forRefLibrary) return newSection;
  newNode.items = newSection;
  return newNode;
}

function expandSchemaPropertyOrder(propertyKeys: any, properties: Record<string, unknown>): void {
  if (!propertyKeys.includes('*') || hasOwn(properties, '*')) return;
  const unnamedKeys = Object.keys(properties).filter(key => !propertyKeys.includes(key));
  for (let index = propertyKeys.length - 1; index >= 0; index--) {
    if (propertyKeys[index] === '*') propertyKeys.splice(index, 1, ...unnamedKeys);
  }
}

function buildArraySchemaLayout(
  context: SchemaLayoutContext,
  newNode: any,
  schema: any,
  nodeValue: any,
  schemaPointer: string,
  dataPointer: string,
  data: SchemaLayoutData
): any {
  const removable = initializeArraySchemaLayout(newNode, schema, context.jsf, schemaPointer, data.shortDataPointer, data.nodeDataMap);
  const tupleContext: TupleSchemaLayoutContext = {
    context,
    newNode,
    schema,
    nodeValue,
    schemaPointer,
    dataPointer,
    shortDataPointer: data.shortDataPointer,
    removable,
  };
  const additionalItemsSchemaPointer = buildTupleSchemaItems(tupleContext);
  if (additionalItemsSchemaPointer) {
    buildAdditionalSchemaListItems({ ...tupleContext, additionalItemsSchemaPointer });
  }
  return newNode;
}

function initializeArraySchemaLayout(
  newNode: any,
  schema: any,
  jsf: any,
  schemaPointer: string,
  shortDataPointer: string,
  nodeDataMap: any
): boolean {
  newNode.items = [];
  newNode.options.maxItems = Math.min(schema.maxItems || 1000, newNode.options.maxItems || 1000);
  newNode.options.minItems = Math.max(schema.minItems || 0, newNode.options.minItems || 0);
  if (!newNode.options.minItems && isInputRequired(jsf.schema, schemaPointer)) newNode.options.minItems = 1;
  if (!hasOwn(newNode.options, 'listItems')) newNode.options.listItems = 1;
  newNode.options.tupleItems = isArray(schema.items) ? schema.items.length : 0;
  adjustSchemaArrayItemCounts(newNode);
  if (!nodeDataMap.has('maxItems')) {
    nodeDataMap.set('maxItems', newNode.options.maxItems);
    nodeDataMap.set('minItems', newNode.options.minItems);
    nodeDataMap.set('tupleItems', newNode.options.tupleItems);
    nodeDataMap.set('listItems', newNode.options.listItems);
  }
  if (!jsf.arrayMap.has(shortDataPointer)) jsf.arrayMap.set(shortDataPointer, newNode.options.tupleItems);
  return newNode.options.removable !== false;
}

function adjustSchemaArrayItemCounts(newNode: any): void {
  if (newNode.options.maxItems <= newNode.options.tupleItems) {
    newNode.options.tupleItems = newNode.options.maxItems;
    newNode.options.listItems = 0;
  } else if (newNode.options.maxItems < newNode.options.tupleItems + newNode.options.listItems) {
    newNode.options.listItems = newNode.options.maxItems - newNode.options.tupleItems;
  } else if (newNode.options.minItems > newNode.options.tupleItems + newNode.options.listItems) {
    newNode.options.listItems = newNode.options.minItems - newNode.options.tupleItems;
  }
}

function buildTupleSchemaItems(input: TupleSchemaLayoutContext): string | null {
  const { newNode, schema, schemaPointer } = input;
  if (!isArray(schema.items)) return isObject(schema.items) ? schemaPointer + '/items' : null;
  newNode.items = [];
  for (let index = 0; index < newNode.options.tupleItems; index++) {
    const newItem = buildTupleSchemaItem(input, index);
    if (newItem) newNode.items.push(newItem);
  }
  return isObject(schema.additionalItems) ? schemaPointer + '/additionalItems' : null;
}

function buildTupleSchemaItem(input: TupleSchemaLayoutContext, index: number): any {
  const { context, newNode, nodeValue, schemaPointer, dataPointer, shortDataPointer, removable } = input;
  const { jsf, widgetLibrary } = context;
  const itemRefPointer = removeRecursiveReferences(
    shortDataPointer + '/' + index, jsf.dataRecursiveRefMap, jsf.arrayMap
  );
  const itemRecursive = !itemRefPointer.length || itemRefPointer !== shortDataPointer + '/' + index;
  const itemValue = isArray(nodeValue) ? nodeValue[index] : null;
  if (removable && index >= newNode.options.minItems) {
    registerTupleLayoutReference(
      context, itemRefPointer, itemRecursive, itemValue, schemaPointer, dataPointer, index
    );
    return getLayoutNode({
      $ref: itemRefPointer,
      dataPointer: dataPointer + '/' + index,
      recursiveReference: itemRecursive,
    }, jsf, widgetLibrary, itemValue);
  }
  return buildSchemaLayout(
    extendSchemaLayoutContext(context, {
      arrayItem: true,
      arrayItemType: 'tuple',
      removable: false,
    }),
    itemValue,
    schemaPointer + '/items/' + index,
    dataPointer + '/' + index
  );
}

function registerTupleLayoutReference(
  context: SchemaLayoutContext,
  itemRefPointer: string,
  itemRecursive: boolean,
  itemValue: any,
  schemaPointer: string,
  dataPointer: string,
  index: number
): void {
  const { jsf } = context;
  if (hasOwn(jsf.layoutRefLibrary, itemRefPointer)) return;
  jsf.layoutRefLibrary[itemRefPointer] = null;
  jsf.layoutRefLibrary[itemRefPointer] = buildSchemaLayout( // NOSONAR: replace the recursion placeholder after building the layout.
    extendSchemaLayoutContext(context, {
      arrayItem: true,
      arrayItemType: 'tuple',
      removable: true,
      forRefLibrary: true,
      dataPointerPrefix: itemRecursive ? dataPointer + '/' + index : '',
    }),
    itemValue,
    schemaPointer + '/items/' + index,
    itemRecursive ? '' : dataPointer + '/' + index
  );
  if (itemRecursive) jsf.layoutRefLibrary[itemRefPointer].recursiveReference = true;
}

function buildAdditionalSchemaListItems(input: AdditionalSchemaListContext): void {
  const {
    context, newNode, schema, nodeValue, dataPointer,
    shortDataPointer, additionalItemsSchemaPointer, removable,
  } = input;
  const { jsf } = context;
  const itemRefPointer = removeRecursiveReferences(
    shortDataPointer + '/-', jsf.dataRecursiveRefMap, jsf.arrayMap
  );
  const itemRecursive = !itemRefPointer.length || itemRefPointer !== shortDataPointer + '/-';
  const itemSchemaPointer = removeRecursiveReferences(
    additionalItemsSchemaPointer, jsf.schemaRecursiveRefMap, jsf.arrayMap
  );
  registerAdditionalListLayoutReference(
    context, itemRefPointer, itemRecursive, itemSchemaPointer, dataPointer, removable
  );
  addDefaultSchemaListItems(context, newNode, nodeValue, itemRefPointer, itemRecursive, dataPointer, jsf);
  addSchemaListButton(context, newNode, schema, itemRefPointer, itemRecursive, dataPointer);
}

function registerAdditionalListLayoutReference(
  context: SchemaLayoutContext,
  itemRefPointer: string,
  itemRecursive: boolean,
  itemSchemaPointer: string,
  dataPointer: string,
  removable: boolean
): void {
  const { jsf } = context;
  if (!itemRefPointer.length || hasOwn(jsf.layoutRefLibrary, itemRefPointer)) return;
  jsf.layoutRefLibrary[itemRefPointer] = null;
  jsf.layoutRefLibrary[itemRefPointer] = buildSchemaLayout( // NOSONAR: replace the recursion placeholder after building the layout.
    extendSchemaLayoutContext(context, {
      arrayItem: true,
      arrayItemType: 'list',
      removable,
      forRefLibrary: true,
      dataPointerPrefix: itemRecursive ? dataPointer + '/-' : '',
    }),
    null,
    itemSchemaPointer,
    itemRecursive ? '' : dataPointer + '/-'
  );
  if (itemRecursive) jsf.layoutRefLibrary[itemRefPointer].recursiveReference = true;
}

function addDefaultSchemaListItems(
  context: SchemaLayoutContext,
  newNode: any,
  nodeValue: any,
  itemRefPointer: string,
  itemRecursive: boolean,
  dataPointer: string,
  jsf: any
): void {
  if (itemRecursive && !newNode.options.required) return;
  const arrayLength = Math.min(
    Math.max(
      itemRecursive ? 0 : newNode.options.tupleItems + newNode.options.listItems,
      isArray(nodeValue) ? nodeValue.length : 0
    ),
    newNode.options.maxItems
  );
  for (let index = newNode.items.length; index < arrayLength; index++) {
    newNode.items.push(getLayoutNode({
      $ref: itemRefPointer,
      dataPointer: dataPointer + '/-',
      recursiveReference: itemRecursive,
    }, jsf, context.widgetLibrary, isArray(nodeValue) ? nodeValue[index] : null));
  }
}

function addSchemaListButton(
  context: SchemaLayoutContext,
  newNode: any,
  schema: any,
  itemRefPointer: string,
  itemRecursive: boolean,
  dataPointer: string
): void {
  if (
    newNode.options.addable === false ||
    newNode.options.minItems >= newNode.options.maxItems ||
    newNode.items.at(-1)?.type === '$ref'
  ) {
    return;
  }
  const { jsf, widgetLibrary } = context;
  let buttonText = jsf.layoutRefLibrary[itemRefPointer]?.options?.title;
  const prefix = buttonText ? 'Add ' : 'Add to ';
  if (!buttonText) buttonText = schema.title || fixTitle(JsonPointer.toKey(dataPointer));
  if (!/^add\b/i.test(buttonText)) buttonText = prefix + buttonText;
  newNode.items.push({
    _id: uniqueId(),
    arrayItem: true,
    arrayItemType: 'list',
    dataPointer: newNode.dataPointer + '/-',
    options: {
      listItems: newNode.options.listItems,
      maxItems: newNode.options.maxItems,
      minItems: newNode.options.minItems,
      removable: false,
      title: buttonText,
      tupleItems: newNode.options.tupleItems,
    },
    recursiveReference: itemRecursive,
    type: '$ref',
    widget: widgetLibrary.getWidget('$ref'),
    $ref: itemRefPointer,
  });
}

function buildReferenceSchemaLayout(
  context: SchemaLayoutContext,
  newNode: any,
  schema: any,
  schemaPointer: string,
  dataPointer: string
): any {
  const { jsf, widgetLibrary } = context;
  const schemaRef = JsonPointer.compile(schema.$ref);
  const dataRef = JsonPointer.toDataPointer(schemaRef, jsf.schema);
  const buttonText = referenceSchemaButtonText(newNode, jsf, schemaPointer);
  Object.assign(newNode, {
    recursiveReference: true,
    widget: widgetLibrary.getWidget('$ref'),
    $ref: dataRef,
  });
  Object.assign(newNode.options, { removable: false, title: buttonText });
  const maxItems = JsonPointer.get(jsf.schema, schemaPointer, 0, -1).maxItems;
  if (isNumber(maxItems)) newNode.options.maxItems = maxItems;
  registerReferenceSchemaLayout(context, newNode, schemaRef, dataRef, dataPointer);
  return newNode;
}

function referenceSchemaButtonText(newNode: any, jsf: any, schemaPointer: string): string {
  if (newNode.options.add) return newNode.options.add;
  if (newNode.name && !/^\d+$/.test(newNode.name)) {
    return (/^add\b/i.test(newNode.name) ? '' : 'Add ') + fixTitle(newNode.name);
  }
  const parentSchema = JsonPointer.get(jsf.schema, schemaPointer, 0, -1);
  if (hasOwn(parentSchema, 'title')) return 'Add to ' + parentSchema.title;
  const pointerArray = JsonPointer.parse(newNode.dataPointer);
  return 'Add to ' + fixTitle(pointerArray.at(-2));
}

function registerReferenceSchemaLayout(
  context: SchemaLayoutContext,
  newNode: any,
  schemaRef: string,
  dataRef: string,
  dataPointer: string
): void {
  const { jsf } = context;
  if (!dataRef.length) return;
  if (!hasOwn(jsf.layoutRefLibrary, dataRef)) {
    jsf.layoutRefLibrary[dataRef] = null;
    const newLayout = buildSchemaLayout(
      extendSchemaLayoutContext(context, {
        arrayItem: newNode.arrayItem,
        arrayItemType: newNode.arrayItemType,
        removable: true,
        forRefLibrary: true,
        dataPointerPrefix: dataPointer,
      }),
      null,
      schemaRef,
      ''
    );
    if (newLayout) {
      newLayout.recursiveReference = true;
      jsf.layoutRefLibrary[dataRef] = newLayout;
    } else {
      delete jsf.layoutRefLibrary[dataRef];
    }
  } else if (!jsf.layoutRefLibrary[dataRef].recursiveReference) {
    jsf.layoutRefLibrary[dataRef].recursiveReference = true;
  }
}
/**
 * 'mapLayout' function
 *
 * Creates a new layout by running each element in an existing layout through
 * an iteratee. Recursively maps within array elements 'items' and 'tabs'.
 * The iteratee is invoked with four arguments: (value, index, layout, path)
 *
 * The returned layout may be longer (or shorter) then the source layout.
 *
 * If an item from the source layout returns multiple items (as '*' usually will),
 * this function will keep all returned items in-line with the surrounding items.
 *
 * If an item from the source layout causes an error and returns null, it is
 * skipped without error, and the function will still return all non-null items.
 *
 * //   layout - the layout to map
 * //  { (v: any, i?: number, l?: any, p?: string) => any }
 *   function - the funciton to invoke on each element
 * //  { string|string[] = '' } layoutPointer - the layoutPointer to layout, inside rootLayout
 * //  { any[] = layout } rootLayout - the root layout, which conatins layout
 * //
 */
export function mapLayout(layout, fn, layoutPointer = '', rootLayout = layout) {
  let indexPad = 0;
  let newLayout: any[] = [];
  forEach(layout, (item, index) => {
    const realIndex = +index + indexPad;
    const newLayoutPointer = layoutPointer + '/' + realIndex;
    let newNode: any = copy(item);
    let itemsArray: any[] = [];
    if (isObject(item)) {
      if (hasOwn(item, 'tabs')) {
        item.items = item.tabs;
        delete item.tabs;
      }
      if (hasOwn(item, 'items')) {
        itemsArray = isArray(item.items) ? item.items : [item.items];
      }
    }
    if (itemsArray.length) {
      newNode.items = mapLayout(itemsArray, fn, newLayoutPointer + '/items', rootLayout);
    }
    newNode = fn(newNode, realIndex, newLayoutPointer, rootLayout);
    if (!isDefined(newNode)) {
      indexPad--;
    } else {
      if (isArray(newNode)) { indexPad += newNode.length - 1; }
      newLayout = newLayout.concat(newNode);
    }
  });
  return newLayout;
}

/**
 * 'getLayoutNode' function
 * Copy a new layoutNode from layoutRefLibrary
 *
 * //   refNode -
 * //   layoutRefLibrary -
 * //  { any = null } widgetLibrary -
 * //  { any = null } nodeValue -
 * //  copied layoutNode
 */
export function getLayoutNode(
  refNode, jsf, widgetLibrary: any = null, nodeValue: any = null
) {

  // If recursive reference and building initial layout, return Add button
  if (refNode.recursiveReference && widgetLibrary) {
    const newLayoutNode = cloneDeep(refNode);
    if (!newLayoutNode.options) { newLayoutNode.options = {}; }
    Object.assign(newLayoutNode, {
      recursiveReference: true,
      widget: widgetLibrary.getWidget('$ref'),
    });
    Object.assign(newLayoutNode.options, {
      removable: false,
      title: 'Add ' + newLayoutNode.$ref,
    });
    return newLayoutNode;

    // Otherwise, return referenced layout
  } else {
    let newLayoutNode = jsf.layoutRefLibrary[refNode.$ref];
    // If value defined, build new node from schema (to set array lengths)
    if (isDefined(nodeValue)) {
      newLayoutNode = buildLayoutFromSchema(
        jsf, widgetLibrary, nodeValue,
        JsonPointer.toSchemaPointer(refNode.$ref, jsf.schema),
        refNode.$ref, newLayoutNode.arrayItem,
        newLayoutNode.arrayItemType, newLayoutNode.options.removable, false
      );
    } else {
      // If value not defined, copy node from layoutRefLibrary
      newLayoutNode = cloneDeep(newLayoutNode);
      JsonPointer.forEachDeep(newLayoutNode, (subNode, pointer) => {

        // Reset all _id's in newLayoutNode to unique values
        if (hasOwn(subNode, '_id')) { subNode._id = uniqueId(); }

        // If adding a recursive item, prefix current dataPointer
        // to all dataPointers in new layoutNode
        if (refNode.recursiveReference && hasOwn(subNode, 'dataPointer')) {
          subNode.dataPointer = refNode.dataPointer + subNode.dataPointer;
        }
      });
    }
    return newLayoutNode;
  }
}

interface TitleMapState {
  items: TitleMapItem[];
  hasEmptyValue: boolean;
}

function isEmptyTitleValue(value: unknown): boolean {
  return value === undefined || value === null;
}

function titleMapFromArray(titleMap: any[], enumList: any, fieldRequired: boolean): TitleMapState {
  if (!enumList) {
    return {
      items: titleMap,
      hasEmptyValue: !fieldRequired && !!titleMap
        .filter(item => isEmptyTitleValue(item.value)).length,
    };
  }

  const items: TitleMapItem[] = [];
  let hasEmptyValue = false;
  for (const index of Object.keys(titleMap)) {
    const entry = titleMap[index];
    if (isObject(entry)) {
      if (enumList.includes(entry.value)) {
        items.push({ name: entry.name, value: entry.value });
        hasEmptyValue ||= isEmptyTitleValue(entry.value);
      }
    } else if (isString(entry) && index < enumList.length) {
      const value = enumList[index];
      items.push({ name: entry, value });
      hasEmptyValue ||= isEmptyTitleValue(value);
    }
  }
  return { items, hasEmptyValue };
}

function titleMapFromObject(titleMap: any, enumList: any): TitleMapState {
  const items: TitleMapItem[] = [];
  let hasEmptyValue = false;
  if (enumList) {
    for (const index of Object.keys(enumList)) {
      const value = enumList[index];
      if (!hasOwn(titleMap, value)) { continue; }
      items.push({ name: titleMap[value], value });
      hasEmptyValue ||= isEmptyTitleValue(value);
    }
  } else {
    for (const value of Object.keys(titleMap)) {
      items.push({ name: titleMap[value], value });
      hasEmptyValue ||= isEmptyTitleValue(value);
    }
  }
  return { items, hasEmptyValue };
}

function buildTitleMapState(titleMap: any, enumList: any, fieldRequired: boolean): TitleMapState {
  if (titleMap) {
    return isArray(titleMap)
      ? titleMapFromArray(titleMap, enumList, fieldRequired)
      : titleMapFromObject(titleMap, enumList);
  }
  if (enumList) {
    const items = Object.keys(enumList).map(index => ({ name: enumList[index], value: enumList[index] }));
    return { items, hasEmptyValue: items.some(item => isEmptyTitleValue(item.value)) };
  }
  return {
    items: [{ name: 'True', value: true }, { name: 'False', value: false }],
    hasEmptyValue: false,
  };
}

function flattenTitleGroups(titles: TitleMapItem[]): TitleMapState {
  const items: TitleMapItem[] = [];
  let hasEmptyValue = false;
  for (const title of titles) {
    if (hasOwn(title, 'group')) {
      if (isArray(title.items)) {
        for (const item of title.items) {
          items.push({ ...item, name: `${title.group}: ${item.name}` });
        }
        hasEmptyValue ||= title.items.some(item => isEmptyTitleValue(item.value));
      }
      if (hasOwn(title, 'name') && hasOwn(title, 'value')) {
        title.name = `${title.group}: ${title.name}`;
        delete title.group;
        items.push(title);
        hasEmptyValue ||= isEmptyTitleValue(title.value);
      }
    } else {
      items.push(title);
      hasEmptyValue ||= isEmptyTitleValue(title.value);
    }
  }
  return { items, hasEmptyValue };
}

function nestTitleGroups(titles: TitleMapItem[]): TitleMapState {
  const items: TitleMapItem[] = [];
  let hasEmptyValue = false;
  for (const title of titles) {
    if (hasOwn(title, 'group')) {
      // Matching groups combine, so an already open group is found by name.
      // Comparing only against the last entry opened a second group whenever
      // a name recurred with anything in between.
      let openGroup = items.find(item => item.group === title.group);
      if (!openGroup) {
        openGroup = { group: title.group, items: title.items || [] };
        items.push(openGroup);
      }
      if (hasOwn(title, 'name') && hasOwn(title, 'value')) {
        openGroup.items!.push({ name: title.name, value: title.value });
        hasEmptyValue ||= isEmptyTitleValue(title.value);
      }
    } else {
      items.push(title);
      hasEmptyValue ||= isEmptyTitleValue(title.value);
    }
  }
  return { items, hasEmptyValue };
}

function groupTitleMap(state: TitleMapState, options: { flatList: boolean }): TitleMapState {
  return options.flatList ? flattenTitleGroups(state.items) : nestTitleGroups(state.items);
}

/**
 * 'buildTitleMap' function
 *
 * //   titleMap -
 * //   enumList -
 * //  { boolean = true } fieldRequired -
 * //  { boolean = true } flatList -
 * // { TitleMapItem[] }
 */
export function buildTitleMap(
  titleMap, enumList, fieldRequired = true, flatList = true
) {
  let state = buildTitleMapState(titleMap, enumList, fieldRequired);
  if (state.items.some(title => hasOwn(title, 'group'))) {
    state = groupTitleMap({ ...state, hasEmptyValue: false }, { flatList });
  }
  if (!fieldRequired && !state.hasEmptyValue) {
    state.items.unshift({ name: '<em>None</em>', value: null });
  }
  return state.items;
}
