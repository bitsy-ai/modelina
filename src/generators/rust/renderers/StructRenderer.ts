import { RustRenderer } from '../RustRenderer';
import { FieldArgs, FieldType, RenderedFieldArgs, RenderedRustField, StructPreset } from '../RustPreset';
import { CommonModel } from 'models';
import { DefaultPropertyNames, getUniquePropertyName } from '../../../helpers';

/**
 * Renderer for Rust's `struct` type
 * 
 * @extends RustRenderer
 */
export class StructRenderer extends RustRenderer {
  public async defaultSelf(): Promise<string> {
    const renderedFields: RenderedFieldArgs[] = await this.renderFields();
    const renderedFieldsContent = renderedFields.map(f => f.rendered ? f.rendered.fieldContent : '');
    renderedFieldsContent.push(await this.runAdditionalContentPreset());

    const formattedName = this.nameType(this.model.$id);
    const doc = this.renderComments(`${formattedName} represents a ${formattedName} model.`);

    const implementation: string[] = [];
    if (this.options.renderInitializer) {
      implementation.push(this.renderNewImplementation(formattedName, this.model, renderedFields));
    }

    return `${doc}
${this.renderStructTypeMacro()}
pub struct ${formattedName} {
${this.indent(this.renderBlock(renderedFieldsContent), 4)}
}
${this.renderBlock(implementation)}
`.trim();
  }

  /**
   * Renders the function signature for model
   * 
   * impl Model {
   *     pub fn new(<this function>){ ... }
   * }
   * @param renderedFields 
   * @returns 
   */
  renderNewSignature(formattedName: string, renderedFields: RenderedFieldArgs[]): string {
    const inner = renderedFields.filter(f => f.required).map(f => {
      return `${f.rendered.fieldName}: ${this.unbox(f.rendered.rustType)}`;
    }).join(', ');
    return `pub fn new(${inner}) -> ${formattedName} {`;
  }
  /**
    * Renders the fields for model
    * 
    * impl Model {
    *     pub fn new(...){ Model {<this function>}}
    * }
    * @param renderedFields 
    * @returns 
    */
  renderNewFields(renderedFields: RenderedFieldArgs[]): string {
    return this.renderBlock(renderedFields.map(f => {
      if (f.required === false) {
        return `${f.rendered.fieldName}: None,`;
      } else if (this.isBoxed(f.rendered.rustType)) {
        return `${f.rendered.fieldName}: Box::new(${f.rendered.fieldName}),`;
      }
      return `${f.rendered.fieldName},`;
    }));
  }

  /***
   * Render new() initializer implementation for model
   */
  renderNewImplementation(formattedName: string, model: CommonModel, renderedFields: RenderedFieldArgs[]): string {
    const fnSignature = this.renderNewSignature(formattedName, renderedFields);
    const fieldArgs = this.renderNewFields(renderedFields);
    const returnSignature = `${formattedName} {`;
    return `
impl ${formattedName} {
${this.indent(fnSignature, 4)}
${this.indent(returnSignature, 8)}
${this.indent(fieldArgs, 12)}
${this.indent('}', 8)}
${this.indent('}', 4)}
} `;
  }

  async renderFields(): Promise<RenderedFieldArgs[]> {
    const fields = this.model.properties || {};
    const results: RenderedFieldArgs[] = [];

    for (const [fieldName, field] of Object.entries(fields)) {
      const rendered = await this.renderField(fieldName, field);
      results.push(rendered);
    }

    if (this.model.additionalProperties !== undefined) {
      results.push(await this.renderAdditionalProperties(this.model.additionalProperties));
    }
    if (this.model.patternProperties !== undefined) {
      results.concat(await this.renderPatternProperties(this.model.patternProperties));
    }
    return results;
  }

  async renderField(fieldName: string, field: CommonModel): Promise<RenderedFieldArgs> {
    const required = this.isFieldRequired(fieldName);
    const fieldArgs = { field, fieldName, required, fieldType: FieldType.field } as FieldArgs;
    const renderedFieldName = await this.runPreset('fieldName', { fieldName, field, fieldType: FieldType.field, required });
    const renderedFieldType = await this.runPreset('fieldType', { fieldName, field, fieldType: FieldType.field, required });
    const renderedFieldMacro = await this.runPreset('fieldMacro', { fieldName, field, fieldType: FieldType.field, required });
    const renderedFieldContent = this.renderFieldContent(renderedFieldName, renderedFieldType, renderedFieldMacro);
    const rendered = { fieldName: renderedFieldName, rustType: renderedFieldType, fieldMacro: renderedFieldMacro, fieldContent: renderedFieldContent };
    return { rendered, ...fieldArgs } as RenderedFieldArgs;
  }

  renderFieldContent(renderedFieldName: string, rustType: string, macro: string): string {
    return `${macro}
pub ${renderedFieldName}: ${rustType},`;
  }

  async renderAdditionalProperties(field: CommonModel): Promise<RenderedFieldArgs> {
    const fieldName = getUniquePropertyName(this.model, DefaultPropertyNames.additionalProperties);
    const fieldType = FieldType.additionalProperty;
    const required = false;
    const renderedFieldName = await this.runPreset('fieldName', { fieldName, field, fieldType, required });
    const renderedFieldType = await this.runPreset('fieldType', { fieldName, field, fieldType, required });
    const renderedFieldMacro = await this.runPreset('fieldMacro', { fieldName: 'additionalProperties', field, fieldType, required });
    const rendered = {
      fieldMacro: renderedFieldMacro,
      fieldName: renderedFieldName,
      rustType: renderedFieldType,
      fieldContent: this.renderFieldContent(renderedFieldName, renderedFieldType, renderedFieldMacro),
    } as RenderedRustField;
    return {
      fieldName,
      fieldType,
      required,
      field,
      rendered
    } as RenderedFieldArgs;
  }

  async renderPatternProperties(field: { [key: string]: CommonModel }): Promise<RenderedFieldArgs[]> {
    const fieldType = FieldType.patternProperties;
    const required = false;
    const results: RenderedFieldArgs[] = [];
    for (const [pattern, patternModel] of Object.entries(field)) {
      const fieldName = getUniquePropertyName(this.model, `${pattern}${DefaultPropertyNames.patternProperties} `);
      const renderedFieldName = await this.runPreset('fieldName', { fieldName, field: patternModel, fieldType, required });
      const renderedFieldType = await this.runPreset('fieldType', { fieldName, field: patternModel, fieldType, required });
      const renderedFieldMacro = await this.runPreset('fieldMacro', { fieldName, field: patternModel, fieldType, required });
      const rendered = {
        fieldMacro: renderedFieldMacro,
        fieldName: renderedFieldName,
        rustType: renderedFieldType,
        fieldContent: this.renderFieldContent(renderedFieldName, renderedFieldType, renderedFieldMacro),
      } as RenderedRustField;
      results.push({
        fieldName,
        fieldType,
        required,
        field: patternModel,
        rendered
      } as RenderedFieldArgs);
    }
    return results;
  }

  renderFieldMacro(originalFieldName: string, required: boolean): string {
    let serdeArgs = `rename = "${originalFieldName}"`;
    if (required === false) {
      serdeArgs += ', skip_serializing_if = "Option::is_none"';
    }
    return `#[serde(${serdeArgs})]`;
  }

  renderStructTypeMacro(): string {
    return '#[derive(Clone, Debug, PartialEq, Default, Serialize, Deserialize)]';
  }
}

export const RUST_DEFAULT_STRUCT_PRESET: StructPreset<StructRenderer> = {
  self({ renderer }) {
    return renderer.defaultSelf();
  },

  fieldName({ fieldName, field, renderer }) {
    return renderer.nameField(fieldName, field);
  },

  fieldMacro({ required, fieldName, renderer }) {
    return renderer.renderFieldMacro(fieldName, required);
  },

  fieldType({ field, renderer, fieldName, required, fieldType }) {
    if (fieldType === FieldType.additionalProperty || fieldType === FieldType.patternProperties) {
      return renderer.toRustType(fieldType, field, fieldName);
    }
    return renderer.renderType(field, fieldName, required);
  }
};
