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
export function buildLayout(jsf, widgetLibrary) {
  let hasSubmitButton = !JsonPointer.get(jsf, '/formOptions/addSubmit');
  const formLayout = mapLayout(jsf.layout, (layoutItem, index, layoutPointer) => {
    const newNode: any = {
      _id: uniqueId(),
      options: {},
    };
    if (isObject(layoutItem)) {
      Object.assign(newNode, layoutItem);
      Object.keys(newNode)
        .filter(option => !inArray(option, [
          '_id', '$ref', 'arrayItem', 'arrayItemType', 'dataPointer', 'dataType',
          'items', 'key', 'name', 'options', 'recursiveReference', 'type', 'widget'
        ]))
        .forEach(option => {
          newNode.options[option] = newNode[option];
          delete newNode[option];
        });
      if (!hasOwn(newNode, 'type') && isString(newNode.widget)) {
        newNode.type = newNode.widget;
        delete newNode.widget;
      }
      if (!hasOwn(newNode.options, 'title')) {
        if (hasOwn(newNode.options, 'legend')) {
          newNode.options.title = newNode.options.legend;
          delete newNode.options.legend;
        }
      }
      if (!hasOwn(newNode.options, 'validationMessages')) {
        if (hasOwn(newNode.options, 'errorMessages')) {
          newNode.options.validationMessages = newNode.options.errorMessages;
          delete newNode.options.errorMessages;

          // Convert Angular Schema Form (AngularJS) 'validationMessage' to
          // Angular JSON Schema Form 'validationMessages'
          // TV4 codes from https://github.com/geraintluff/tv4/blob/master/source/api.js
        } else if (hasOwn(newNode.options, 'validationMessage')) {
          if (typeof newNode.options.validationMessage === 'string') {
            newNode.options.validationMessages = newNode.options.validationMessage;
          } else {
            newNode.options.validationMessages = {};
            Object.keys(newNode.options.validationMessage).forEach(key => {
              const code = key + '';
              const newKey = legacyValidationMessageCodes.get(code) ?? code;
              newNode.options.validationMessages[newKey] = newNode.options.validationMessage[key];
            });
          }
          delete newNode.options.validationMessage;
        }
      }
    } else if (JsonPointer.isJsonPointer(layoutItem)) {
      newNode.dataPointer = layoutItem;
    } else if (isString(layoutItem)) {
      newNode.key = layoutItem;
    } else {
      console.error('buildLayout error: Form layout element not recognized:');
      console.error(layoutItem);
      return null;
    }
    let nodeSchema: any = null;

    // If newNode does not have a dataPointer, try to find an equivalent
    if (!hasOwn(newNode, 'dataPointer')) {

      // If newNode has a key, change it to a dataPointer
      if (hasOwn(newNode, 'key')) {
        newNode.dataPointer = newNode.key === '*' ? newNode.key :
          JsonPointer.compile(JsonPointer.parseObjectPath(newNode.key), '-');
        delete newNode.key;

        // If newNode is an array, search for dataPointer in child nodes
      } else if (hasOwn(newNode, 'type') && newNode.type.slice(-5) === 'array') {
        const childDataPointer = findDataPointer(newNode);
        if (childDataPointer) {
          newNode.dataPointer =
            childDataPointer.slice(0, childDataPointer.lastIndexOf('/-'));
        }
      }
    }

    if (hasOwn(newNode, 'dataPointer')) {
      if (newNode.dataPointer === '*') {
        return buildLayoutFromSchema(jsf, widgetLibrary, jsf.formValues);
      }
      const nodeValue =
        JsonPointer.get(jsf.formValues, newNode.dataPointer.replaceAll('/-', '/1'));

      // TODO: Create function getFormValues(jsf, dataPointer, forRefLibrary)
      // check formOptions.setSchemaDefaults and formOptions.setLayoutDefaults
      // then set apropriate values from initialVaues, schema, or layout

      newNode.dataPointer =
        JsonPointer.toGenericPointer(newNode.dataPointer, jsf.arrayMap);
      const LastKey = JsonPointer.toKey(newNode.dataPointer);
      if (!newNode.name && isString(LastKey) && LastKey !== '-') {
        newNode.name = LastKey;
      }
      const shortDataPointer = removeRecursiveReferences(
        newNode.dataPointer, jsf.dataRecursiveRefMap, jsf.arrayMap
      );
      const recursive = !shortDataPointer.length ||
        shortDataPointer !== newNode.dataPointer;
      let schemaPointer: string;
      if (!jsf.dataMap.has(shortDataPointer)) {
        jsf.dataMap.set(shortDataPointer, new Map());
      }
      const nodeDataMap = jsf.dataMap.get(shortDataPointer);
      if (nodeDataMap.has('schemaPointer')) {
        schemaPointer = nodeDataMap.get('schemaPointer');
      } else {
        schemaPointer = JsonPointer.toSchemaPointer(shortDataPointer, jsf.schema);
        nodeDataMap.set('schemaPointer', schemaPointer);
      }
      nodeDataMap.set('disabled', !!newNode.options.disabled);
      nodeSchema = JsonPointer.get(jsf.schema, schemaPointer);
      if (nodeSchema) {
        if (!hasOwn(newNode, 'type')) {
          newNode.type = getInputType(nodeSchema, newNode);
        } else if (!widgetLibrary.hasWidget(newNode.type)) {
          const oldWidgetType = newNode.type;
          newNode.type = getInputType(nodeSchema, newNode);
          console.error(`error: widget type "${oldWidgetType}" ` +
            `not found in library. Replacing with "${newNode.type}".`);
        } else {
          newNode.type = checkInlineType(newNode.type, nodeSchema, newNode);
        }
        if (nodeSchema.type === 'object' && isArray(nodeSchema.required)) {
          nodeDataMap.set('required', nodeSchema.required);
        }
        newNode.dataType =
          nodeSchema.type || (hasOwn(nodeSchema, '$ref') ? '$ref' : null);
        updateInputOptions(newNode, nodeSchema, jsf);

        // Present checkboxes as single control, rather than array
        if (newNode.type === 'checkboxes' && hasOwn(nodeSchema, 'items')) {
          updateInputOptions(newNode, nodeSchema.items, jsf);
        } else if (newNode.dataType === 'array') {
          newNode.options.maxItems = Math.min(
            nodeSchema.maxItems || 1000, newNode.options.maxItems || 1000
          );
          newNode.options.minItems = Math.max(
            nodeSchema.minItems || 0, newNode.options.minItems || 0
          );
          newNode.options.listItems = Math.max(
            newNode.options.listItems || 0, isArray(nodeValue) ? nodeValue.length : 0
          );
          newNode.options.tupleItems =
            isArray(nodeSchema.items) ? nodeSchema.items.length : 0;
          if (newNode.options.maxItems < newNode.options.tupleItems) {
            newNode.options.tupleItems = newNode.options.maxItems;
            newNode.options.listItems = 0;
          } else if (newNode.options.maxItems <
            newNode.options.tupleItems + newNode.options.listItems
          ) {
            newNode.options.listItems =
              newNode.options.maxItems - newNode.options.tupleItems;
          } else if (newNode.options.minItems >
            newNode.options.tupleItems + newNode.options.listItems
          ) {
            newNode.options.listItems =
              newNode.options.minItems - newNode.options.tupleItems;
          }
          if (!nodeDataMap.has('maxItems')) {
            nodeDataMap.set('maxItems', newNode.options.maxItems);
            nodeDataMap.set('minItems', newNode.options.minItems);
            nodeDataMap.set('tupleItems', newNode.options.tupleItems);
            nodeDataMap.set('listItems', newNode.options.listItems);
          }
          if (!jsf.arrayMap.has(shortDataPointer)) {
            jsf.arrayMap.set(shortDataPointer, newNode.options.tupleItems);
          }
        }
        if (isInputRequired(jsf.schema, schemaPointer)) {
          newNode.options.required = true;
          jsf.fieldsRequired = true;
        }
      } else {
        // TODO: create item in FormGroup model from layout key (?)
        updateInputOptions(newNode, {}, jsf);
      }

      if (!newNode.options.title && !/^\d+$/.test(newNode.name)) {
        newNode.options.title = fixTitle(newNode.name);
      }

      if (hasOwn(newNode.options, 'copyValueTo')) {
        if (typeof newNode.options.copyValueTo === 'string') {
          newNode.options.copyValueTo = [newNode.options.copyValueTo];
        }
        if (isArray(newNode.options.copyValueTo)) {
          newNode.options.copyValueTo = newNode.options.copyValueTo.map(item =>
            JsonPointer.compile(JsonPointer.parseObjectPath(item), '-')
          );
        }
      }

      newNode.widget = widgetLibrary.getWidget(newNode.type);
      nodeDataMap.set('inputType', newNode.type);
      nodeDataMap.set('widget', newNode.widget);

      // The gate below tests the layout node, not the schema, so a layout entry
      // that names an array by key carries no 'items' and skipped the whole block:
      // no item nodes and no Add button. Fill the items from the schema instead.
      // Only for widgets that render them, since checkboxes ignores items entirely.
      if (newNode.dataType === 'array' && !hasOwn(newNode, 'items') &&
        !hasOwn(newNode, 'additionalItems') &&
        inArray(newNode.type, ['array', 'tabarray'])
      ) {
        const fromSchema = buildLayoutFromSchema(
          jsf, widgetLibrary, nodeValue, schemaPointer, newNode.dataPointer,
          newNode.arrayItem, newNode.arrayItemType, newNode.options.removable
        );
        if (fromSchema && isArray(fromSchema.items) && fromSchema.items.length) {
          newNode.items = fromSchema.items;
        }
      }

      if (newNode.dataType === 'array' &&
        (hasOwn(newNode, 'items') || hasOwn(newNode, 'additionalItems'))
      ) {
        const itemRefPointer = removeRecursiveReferences(
          newNode.dataPointer + '/-', jsf.dataRecursiveRefMap, jsf.arrayMap
        );
        if (!jsf.dataMap.has(itemRefPointer)) {
          jsf.dataMap.set(itemRefPointer, new Map());
        }
        jsf.dataMap.get(itemRefPointer).set('inputType', 'section');

        // Fix insufficiently nested array item groups
        if (newNode.items.length > 1) {
          const arrayItemGroup = [];
          for (let i = newNode.items.length - 1; i >= 0; i--) {
            const subItem = newNode.items[i];
            if (hasOwn(subItem, 'dataPointer') &&
              subItem.dataPointer.slice(0, itemRefPointer.length) === itemRefPointer
            ) {
              const arrayItem = newNode.items.splice(i, 1)[0];
              arrayItem.dataPointer = newNode.dataPointer + '/-' +
                arrayItem.dataPointer.slice(itemRefPointer.length);
              arrayItemGroup.unshift(arrayItem);
            } else {
              subItem.arrayItem = true;
              // A slot addressed by index is a fixed tuple position. It is only a
              // list item once it sits past the tuple, and a tuple position cannot
              // be removed: the framework components read arrayItemType === 'list'
              // to decide whether to render the remove control.
              // String() rather than a guard: a sub item with no dataPointer
              // reaches this branch too, and 'undefined' gives NaN, which is the
              // answer a missing pointer should produce.
              const slot = Number(String(subItem.dataPointer).split('/').pop());
              const tupleSlot = Number.isInteger(slot) &&
                slot < newNode.options.tupleItems;
              subItem.arrayItemType = tupleSlot ? 'tuple' : 'list';
              subItem.removable = !tupleSlot && newNode.options.removable !== false;
            }
          }
          if (arrayItemGroup.length) {
            newNode.items.push({
              _id: uniqueId(),
              arrayItem: true,
              arrayItemType: newNode.options.tupleItems > newNode.items.length ?
                'tuple' : 'list',
              items: arrayItemGroup,
              options: { removable: newNode.options.removable !== false, },
              dataPointer: newNode.dataPointer + '/-',
              type: 'section',
              widget: widgetLibrary.getWidget('section'),
            });
          }
        // Every statement below reads items[0], so an empty list has nothing to
        // do here. Falling through threw and took the whole form with it.
        } else if (newNode.items.length) {
          // TODO: Fix to hndle multiple items
          newNode.items[0].arrayItem = true;
          if (!newNode.items[0].dataPointer) {
            newNode.items[0].dataPointer =
              JsonPointer.toGenericPointer(itemRefPointer, jsf.arrayMap);
          }
          if (!JsonPointer.has(newNode, '/items/0/options/removable')) {
            newNode.items[0].options.removable = true;
          }
          if (newNode.options.orderable === false) {
            newNode.items[0].options.orderable = false;
          }
          newNode.items[0].arrayItemType =
            newNode.options.tupleItems ? 'tuple' : 'list';
        }

        if (isArray(newNode.items)) {
          const arrayListItems =
            newNode.items.filter(item => item.type !== '$ref').length -
            newNode.options.tupleItems;
          if (arrayListItems > newNode.options.listItems) {
            newNode.options.listItems = arrayListItems;
            nodeDataMap.set('listItems', arrayListItems);
          }
        }

        if (!hasOwn(jsf.layoutRefLibrary, itemRefPointer)) {
          const lastItem = newNode.items.at(-1);
          // The last existing item is only a template for a new one when it is
          // itself a list item. On a tuple array it is a fixed slot, so cloning
          // it gave every added item that slot's schema, title and pointer.
          let listItemSchemaPointer: string | null = null;
          if (isArray(nodeSchema?.items)) {
            listItemSchemaPointer = isObject(nodeSchema.additionalItems) ?
              schemaPointer + '/additionalItems' : null;
          } else if (isObject(nodeSchema?.items)) {
            listItemSchemaPointer = schemaPointer + '/items';
          }

          if (lastItem?.arrayItemType === 'tuple' && listItemSchemaPointer) {
            // Set to null first to prevent a recursive reference from looping.
            jsf.layoutRefLibrary[itemRefPointer] = null;
            jsf.layoutRefLibrary[itemRefPointer] = buildLayoutFromSchema( // NOSONAR
              jsf, widgetLibrary, null,
              removeRecursiveReferences(
                listItemSchemaPointer, jsf.schemaRecursiveRefMap, jsf.arrayMap
              ),
              recursive ? '' : newNode.dataPointer + '/-',
              true, 'list', newNode.options.removable !== false, true,
              recursive ? newNode.dataPointer + '/-' : ''
            );
            if (recursive && jsf.layoutRefLibrary[itemRefPointer]) {
              jsf.layoutRefLibrary[itemRefPointer].recursiveReference = true;
            }
          } else {
            jsf.layoutRefLibrary[itemRefPointer] = cloneDeep(lastItem);
            if (recursive) {
              jsf.layoutRefLibrary[itemRefPointer].recursiveReference = true;
            }
            // Only a cloned sibling needs this: it carries the id and the
            // absolute pointer of the node it was copied from. A node built
            // from the schema above already has neither.
            forEach(jsf.layoutRefLibrary[itemRefPointer], (item, key) => {
              if (hasOwn(item, '_id')) { item._id = null; }
              if (recursive) {
                if (hasOwn(item, 'dataPointer')) {
                  item.dataPointer = item.dataPointer.slice(itemRefPointer.length);
                }
              }
            }, 'top-down');
          }
        }

        // Add any additional default items
        if (!newNode.recursiveReference || newNode.options.required) {
          const arrayLength = Math.min(Math.max(
            newNode.options.tupleItems + newNode.options.listItems,
            isArray(nodeValue) ? nodeValue.length : 0
          ), newNode.options.maxItems);
          for (let i = newNode.items.length; i < arrayLength; i++) {
            newNode.items.push(getLayoutNode({
              $ref: itemRefPointer,
              dataPointer: newNode.dataPointer,
              recursiveReference: newNode.recursiveReference,
            }, jsf, widgetLibrary));
          }
        }

        // If needed, add button to add items to array
        if (newNode.options.addable !== false &&
          newNode.options.minItems < newNode.options.maxItems &&
          newNode.items.at(-1)?.type !== '$ref'
        ) {
          let buttonText = 'Add';
          if (newNode.options.title) {
            if (/^add\b/i.test(newNode.options.title)) {
              buttonText = newNode.options.title;
            } else {
              buttonText += ' ' + newNode.options.title;
            }
          } else if (newNode.name && !/^\d+$/.test(newNode.name)) {
            if (/^add\b/i.test(newNode.name)) {
              buttonText += ' ' + fixTitle(newNode.name);
            } else {
              buttonText = fixTitle(newNode.name);
            }

            // If newNode doesn't have a title, look for title of parent array item
          } else {
            const parentSchema =
              getFromSchema(jsf.schema, newNode.dataPointer, 'parentSchema');
            if (hasOwn(parentSchema, 'title')) {
              buttonText += ' to ' + parentSchema.title;
            } else {
              const pointerArray = JsonPointer.parse(newNode.dataPointer);
              buttonText += ' to ' + fixTitle(pointerArray.at(-2));
            }
          }
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
            recursiveReference: recursive,
            type: '$ref',
            widget: widgetLibrary.getWidget('$ref'),
            $ref: itemRefPointer,
          });
          if (isString(JsonPointer.get(newNode, '/style/add'))) {
            newNode.items.at(-1).options.fieldStyle =
              newNode.style.add;
            delete newNode.style.add;
            if (isEmpty(newNode.style)) { delete newNode.style; }
          }
        }
      } else {
        newNode.arrayItem = false;
      }
    } else if (hasOwn(newNode, 'type') || hasOwn(newNode, 'items')) {
      const parentType: string =
        JsonPointer.get(jsf.layout, layoutPointer, 0, -2).type;
      if (!hasOwn(newNode, 'type')) {
        newNode.type =
          inArray(parentType, ['tabs', 'tabarray']) ? 'tab' : 'array';
      }
      newNode.arrayItem = parentType === 'array';
      newNode.widget = widgetLibrary.getWidget(newNode.type);
      updateInputOptions(newNode, {}, jsf);
    }
    if (newNode.type === 'submit') { hasSubmitButton = true; }
    return newNode;
  });
  if (jsf.hasRootReference) {
    const fullLayout = cloneDeep(formLayout);
    if (fullLayout.at(-1).type === 'submit') { fullLayout.pop(); }
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
  if (!hasSubmitButton) {
    formLayout.push({
      _id: uniqueId(),
      options: { title: 'Submit' },
      type: 'submit',
      widget: widgetLibrary.getWidget('submit'),
    });
  }
  return formLayout;
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
  const { jsf, widgetLibrary } = context;
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
  if (!newNode.options.title && newNode.name && !/^[0-9]+$/.test(newNode.name)) {
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
  const additionalItemsSchemaPointer = buildTupleSchemaItems(
    context, newNode, schema, nodeValue, schemaPointer, dataPointer, data.shortDataPointer, removable
  );
  if (additionalItemsSchemaPointer) {
    buildAdditionalSchemaListItems(
      context, newNode, schema, nodeValue, schemaPointer, dataPointer, data.shortDataPointer,
      additionalItemsSchemaPointer, removable
    );
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

function buildTupleSchemaItems(
  context: SchemaLayoutContext,
  newNode: any,
  schema: any,
  nodeValue: any,
  schemaPointer: string,
  dataPointer: string,
  shortDataPointer: string,
  removable: boolean
): string | null {
  if (!isArray(schema.items)) return isObject(schema.items) ? schemaPointer + '/items' : null;
  newNode.items = [];
  for (let index = 0; index < newNode.options.tupleItems; index++) {
    const newItem = buildTupleSchemaItem(
      context, newNode, nodeValue, schemaPointer, dataPointer, shortDataPointer, index, removable
    );
    if (newItem) newNode.items.push(newItem);
  }
  return isObject(schema.additionalItems) ? schemaPointer + '/additionalItems' : null;
}

function buildTupleSchemaItem(
  context: SchemaLayoutContext,
  newNode: any,
  nodeValue: any,
  schemaPointer: string,
  dataPointer: string,
  shortDataPointer: string,
  index: number,
  removable: boolean
): any {
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
  const { jsf, widgetLibrary } = context;
  if (hasOwn(jsf.layoutRefLibrary, itemRefPointer)) return;
  jsf.layoutRefLibrary[itemRefPointer] = null;
  jsf.layoutRefLibrary[itemRefPointer] = buildSchemaLayout(
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

function buildAdditionalSchemaListItems(
  context: SchemaLayoutContext,
  newNode: any,
  schema: any,
  nodeValue: any,
  schemaPointer: string,
  dataPointer: string,
  shortDataPointer: string,
  additionalItemsSchemaPointer: string,
  removable: boolean
): void {
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
  jsf.layoutRefLibrary[itemRefPointer] = buildSchemaLayout(
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
  if (newNode.name && !/^[0-9]+$/.test(newNode.name)) {
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
