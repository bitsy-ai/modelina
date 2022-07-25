import { AbstractRenderer } from '../AbstractRenderer';
import { CommonModel, CommonInputModel, Preset } from '../../models';
import { FormatHelpers } from '../../helpers/FormatHelpers';

import { RustGenerator, RustOptions } from './RustGenerator';
import { FieldType } from './RustPreset';
import { isReservedRustKeyword, UNSTABLE_FIELD_IMPLEMENTATION_WARNING } from './Constants';
import { Logger } from '../../utils';
import { RustDependency, RustDependencyType } from './RustRenderOutput';

/**
 * Options for rendering a Rust type
 */
export type RustRenderFieldTypeOptions = {
  originalFieldName: string
  required: boolean
  field: CommonModel
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
    public rustModuleDependencies: RustDependency[] = []
  ) {
    super(options, generator, presets, model, inputModel);
  }

  /**
 * Adds a RustDependency while ensuring that only one dependency is preset at a time.
 * @param dependency complete dependency string so it can be rendered as is.
 */
  addRustDependency(dependency: RustDependency): void {
    if (this.rustModuleDependencies.filter(d => d.type === dependency.type).length === 0) {
      this.rustModuleDependencies.push(dependency);
    }
  }

  /**
   * Renders the name of a module
   * @param name 
   * @param model 
   * @returns 
   */
  nameModule(name: string | undefined, model?: CommonModel): string {
    return this.options?.namingConvention?.module
      ? this.options.namingConvention.module(name, { model: model || this.model, inputModel: this.inputModel, reservedKeywordCallback: isReservedRustKeyword })
      : name || '';
  }

  nameModuleFile(name: string | undefined, model?: CommonModel): string {
    return `src/${this.nameModule(name, model)}.rs`;
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
   * Renders the type name for this model's additionalProperties
   * 
   */
  additionalPropertyTypeName(field: CommonModel): string {
    return this.options?.namingConvention?.additionalPropertyType ? this.options.namingConvention.additionalPropertyType({ model: field, inputModel: this.inputModel, reservedKeywordCallback: isReservedRustKeyword }) : '';
  }

  /**
   * Returns true if field is a tuple
   * @param field
   * @returns booolean
   */
  isTuple(field: CommonModel): boolean {
    return Array.isArray(field.items);
  }

  /**
   * Returns true if field can be represented by Vec<T>
   * @param field
   * @returns booolean
   */
  isVec(field: CommonModel): boolean {
    return field.items !== undefined && !Array.isArray(field.items);
  }

  isUniformType(field: CommonModel): boolean {
    // field.type is a single type, or array of the same type
    const testType = Array.isArray(field.type) ? field.type[0] : field.type;
    return !Array.isArray(field.type) || (Array.isArray(field.type) && field.type.every(v => v === testType));
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

  runTuplePreset(fieldName: string, originalFieldName: string, field: CommonModel, parent: CommonModel): Promise<string> {
    return this.runPreset('tuple', { fieldName, originalFieldName, field, parent });
  }
  // runFieldPreset(fieldName: string, field: CommonModel, type: FieldType = FieldType.field): Promise<string> {
  //   const required = (type === FieldType.additionalProperty || type === FieldType.patternProperties) ? true : this.isFieldRequired(fieldName);
  //   return this.runPreset('field', { fieldName, field, type, required });
  // }

  refToRustType(model: CommonModel): string {
    const formattedRef = this.nameType(model.$ref);
    return `Box<crate::${formattedRef}>`;
  }
  renderType(model: CommonModel, options: RustRenderFieldTypeOptions): string {
    let fieldType = '';
    if (model.$ref !== undefined) {
      fieldType = this.toRustType('$ref', model, options);
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

  /**
   * 
   * Outputs a native rust type
   * 
   * Box is used here to allocate heap memory, while only the pointer remains on the stack.
   * Box allows us to support circular type references.
   * See chapter 4 of Rust docs for more information about the Stack and Heap in the context of memory ownership
  * https://doc.rust-lang.org/book/ch04-01-what-is-ownership.html#the-stack-and-the-heap

   * 
   * @param type 
   * @param field 
   * @param options 
   * @returns 
   */
  toRustType(type: undefined | string | string[] | FieldType, field: CommonModel, options: RustRenderFieldTypeOptions): string {
    switch (type) {
      case '$ref':
        return this.refToRustType(field);
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
      case 'array': {
        // handle single field.item where type is uniform
        if (this.isVec(field)) {
          const items = field.items as CommonModel;
          const innerType = this.renderType(items, { required: true } as RustRenderFieldTypeOptions);
          return `Vec<${innerType}>`;
          // handle tuple of heterogenous types by generating a tuple struct
        } else if (this.isTuple(field)) {
          const fieldName = this.nameTupleType(options);
          const dependency: RustDependency = { originalFieldName: options.originalFieldName, type: RustDependencyType.tuple, field, fieldName, parent: this.model };
          this.addRustDependency(dependency);
          this.addDependency(fieldName);
          return `Box<${fieldName}>`;
        }
        // we should never reach this return statement, but log a warning if we do.
        // end-user would have to implement their own serde strategy with From<serde_json::Value<T>>
        Logger.warn(UNSTABLE_FIELD_IMPLEMENTATION_WARNING(options.originalFieldName));
        return 'serde_json::Value';
      }
      case FieldType.additionalProperty:
        if (this.isUniformType(field)) {
          return `Option<std::collections::HashMap<String, ${this.toRustType(field.type, field, options)}>>`;
        }
        // end-user would have to implement their own serde strategy with From<serde_json::Value<T>>
        return 'Option<std::collections::HashMap<String, serde_json::Value>>';

      case 'object':
      default: {
        const fieldName = this.nameType(options.originalFieldName);
        const dependency: RustDependency = { originalFieldName: options.originalFieldName, type: RustDependencyType.struct, field, fieldName, parent: this.model };
        this.addRustDependency(dependency);
        this.addDependency(fieldName);
        return `Box<crate::${fieldName}>`;
      }
    }
  }
}
