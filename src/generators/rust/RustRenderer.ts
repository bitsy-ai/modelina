import { AbstractRenderer } from '../AbstractRenderer';
import { CommonModel, CommonInputModel, Preset } from '../../models';
import { FormatHelpers } from '../../helpers/FormatHelpers';
import { DefaultPropertyNames, getUniquePropertyName } from '../../helpers';

import { RustGenerator, RustOptions } from './RustGenerator';
import { FieldType } from './RustPreset';
import { isReservedRustKeyword, UNSTABLE_FIELD_IMPLEMENTATION_WARNING } from './Constants';
import { Logger } from '../../utils';

/**
 * Options for rendering a Rust type
 */
export type RustRenderFieldTypeOptions = {
  originalFieldName: string
  required: boolean
  containerStruct?: string
};

/**
 * Common renderer for Rust types
 * 
 * @extends AbstractRenderer`
 */
export abstract class RustRenderer extends AbstractRenderer<RustOptions> {
  constructor(
    options: RustOptions,
    generator: RustGenerator,
    presets: Array<[Preset, unknown]>,
    model: CommonModel,
    inputModel: CommonInputModel,
  ) {
    super(options, generator, presets, model, inputModel);
  }

  /**
   * A tuple is a collection of values of heterogenous types.
   * In Rust, Tuples are constructed from a struct with a defined type signature.
   * 
   * When an "anonymous" tuple is encountered, we must build a named struct 
   * "anonymous" here means a tuple defined in JSON schema, without a $ref to components object
   * 
   * 
   * https://doc.rust-lang.org/rust-by-example/primitives/tuples.html
   */
  async renderTuples(): Promise<string> {
    const fields = this.model?.properties || {};
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const tupleFields = Object.fromEntries(Object.entries(fields).filter(([_fieldName, field]) => this.isAnonymousTuple(field)));
    const content: string[] = [];
    for (const [fieldName, field] of Object.entries(tupleFields)) {
      const renderTuple = await this.runTuplePreset(fieldName, field);
      content.push(renderTuple);
    }
    return this.renderBlock(content);
  }

  async renderFields(): Promise<string> {
    const fields = this.model.properties || {};
    const content: string[] = [];

    for (const [fieldName, field] of Object.entries(fields)) {
      const renderField = await this.runFieldPreset(fieldName, field);
      content.push(renderField);
    }

    if (this.model.additionalProperties !== undefined) {
      const propertyName = getUniquePropertyName(this.model, DefaultPropertyNames.additionalProperties);
      const additionalProperty = await this.runFieldPreset(propertyName, this.model.additionalProperties, FieldType.additionalProperty);
      content.push(additionalProperty);
    }

    if (this.model.patternProperties !== undefined) {
      for (const [pattern, patternModel] of Object.entries(this.model.patternProperties)) {
        const propertyName = getUniquePropertyName(this.model, `${pattern}${DefaultPropertyNames.patternProperties}`);
        const renderedPatternProperty = await this.runFieldPreset(propertyName, patternModel, FieldType.patternProperties);
        content.push(renderedPatternProperty);
      }
    }
    return this.renderBlock(content);
  }

  /**
   * Renders the name of a type based on provided generator option naming convention type function.
   * 
   * This is used to render names of models and then later used if that class is referenced from other models.
   * 
   * @param name 
   * @param model 
   */
  nameType(name: string | undefined, model?: CommonModel): string {
    return this.options?.namingConvention?.type
      ? this.options.namingConvention.type(name, { model: model || this.model, inputModel: this.inputModel, reservedKeywordCallback: isReservedRustKeyword })
      : name || '';
  }
  /**
   * Renders the name of a field based on provided generator option naming convention field function.
   * 
   * @param fieldName 
   * @param field
   */
  // eslint-disable-next-line sonarjs/no-identical-functions
  nameField(fieldName: string | undefined, field?: CommonModel): string {
    return this.options?.namingConvention?.field
      ? this.options.namingConvention.field(fieldName, { model: this.model, inputModel: this.inputModel, field, reservedKeywordCallback: isReservedRustKeyword })
      : fieldName || '';
  }

  /**
   * Returns true if field is considered an "anonymous" tuple
   * An "anonymous" tuple is an array of heterogenous items without a $ref to component object
   * @param field
   * @returns 
   */
  isAnonymousTuple(field: CommonModel): boolean {
    return Array.isArray(field.items);
  }

  /**
   * Returns true if field is required
   * Rust uses Option enum to represent optional values
   * https://doc.rust-lang.org/std/option/enum.Option.html
   * @param originalFieldName 
   * @returns 
   */

  isFieldRequired(originalFieldName: string): boolean {
    return this.model.isRequired(originalFieldName) || this.model.required?.map(x => this.nameField(x)).includes(originalFieldName) || false;
  }

  runTuplePreset(fieldName: string, field: CommonModel): Promise<string> {
    const parent = this.model;
    return this.runPreset('tuple', { fieldName, field, parent });
  }
  runFieldPreset(fieldName: string, field: CommonModel, type: FieldType = FieldType.field): Promise<string> {
    const required = (type === FieldType.additionalProperty || type === FieldType.patternProperties) ? true : this.isFieldRequired(fieldName);
    return this.runPreset('field', { fieldName, field, type, required });
  }
  renderType(model: CommonModel, options: RustRenderFieldTypeOptions): string {
    let fieldType = '';
    if (model.$ref !== undefined) {
      const formattedRef = this.nameType(model.$ref);
      // Box is used here to allocate heap memory, while only the pointer remains on the stack.
      // Box allows us to support circular type references.
      // See chapter 4 of Rust docs for more information about the Stack and Heap in the context of memory ownership
      // https://doc.rust-lang.org/book/ch04-01-what-is-ownership.html#the-stack-and-the-heap
      fieldType = `Box<crate::models::${formattedRef}>`;
    } else {
      fieldType = this.toRustType(model?.type, model, options);
    }
    if (options.required === true) {
      return fieldType;
    }
    return `Option<${fieldType}>`;
  }

  renderComments(lines: string | string[]): string {
    lines = FormatHelpers.breakLines(lines);
    return lines.map(line => `// ${line}`).join('\n');
  }

  nameTupleType(options: RustRenderFieldTypeOptions): string {
    const prefix = this.nameType(this.model.$id);
    const suffix = this.nameType(options.originalFieldName);
    return `${prefix}${suffix}`;
  }

  nameTupleField(options: RustRenderFieldTypeOptions): string {
    return `Box<${this.nameTupleType(options)}>`;
  }

  /* eslint-disable sonarjs/no-duplicate-string */
  toRustType(type: undefined | string | string[], field: CommonModel, options: RustRenderFieldTypeOptions): string {
    switch (type) {
      case 'string':
        return 'String';
      case 'int32':
      case 'integer':
        return 'i32';
      case 'int64':
      case 'long':
        return 'i64';
      case 'number':
        return 'f64';
      case 'boolean':
        return 'bool';
      case 'object':
        // An "anonymous" struct-like object will result in a named struct being generated at module-level scope
        let fieldName = this.nameType(options.originalFieldName);
        this.dependencies.push(fieldName);
        return `Box<${fieldName}>`;
      case 'array': {
        // handle single field.item where type is uniform
        if (field.items && !Array.isArray(field.items)) {
          const innerType = this.renderType(field?.items, { required: true } as RustRenderFieldTypeOptions);
          return `Vec<${innerType}>`;
          // handle tuple of heterogenous types 
        } else if (this.isAnonymousTuple(field)) {
          this.dependencies.push(this.nameTupleType(options));
          return this.nameTupleField(options);
        }
        // we should never reach this return statement, but log a warning if we do.
        // end-user would have to implement their own serde strategy with From<serde_json::Value<T>>
        Logger.warn(UNSTABLE_FIELD_IMPLEMENTATION_WARNING(options.originalFieldName));
        return 'serde_json::Value';
      }
      default: {
        Logger.warn(UNSTABLE_FIELD_IMPLEMENTATION_WARNING(options.originalFieldName));
        // end-user must implement serde strategy with From<serde_json::Value<T>>
        return 'serde_json::Value';
      }
    }
  }
}
