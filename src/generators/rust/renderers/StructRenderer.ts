import { RustRenderer, RustRenderFieldTypeOptions } from '../RustRenderer';
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

    const renderedFields: FieldArgs[] = await this.renderFields()
    const renderedFieldsContent = renderedFields.map(f => f.rendered ? f.rendered.fieldContent : '');
    renderedFieldsContent.push(await this.runAdditionalContentPreset());

    const formattedName = this.nameType(this.model.$id);
    const doc = this.renderComments(`${formattedName} represents a ${formattedName} model.`);

    const implementation: string[] = []
    if (this.options.renderInitializer) {
      implementation.push(this.renderDefaultImplementation(formattedName, this.model))
    }

    return `${doc}
${this.renderStructTypeMacro()}
pub struct ${formattedName} {
${this.indent(this.renderBlock(renderedFieldsContent))}
}`;
  }

  functionSignature(fieldArgs: FieldArgs[]): string {
    return fieldArgs.filter(f => f.rendered !== undefined).map(f => `${f.rendered?.fieldName}: ${f.rendered?.rustType}`).join(', ')
  }

  renderDefaultImplementation(formattedName: string, fieldArgs: FieldArgs[]): string {
    return `
impl Default for ${formattedName} {
  fn default() -> ${formattedName}{

  }
}
`
  }

  async renderFields(): Promise<FieldArgs[]> {
    const fields = this.model.properties || {};
    const results: RenderedFieldArgs[] = [];

    for (const [fieldName, field] of Object.entries(fields)) {
      const rendered = await this.renderField(fieldName, field);
      results.push(rendered)
    }

    if (this.model.additionalProperties !== undefined) {
      const propertyName = this.additionalPropertyTypeName(this.model,);
      const additionalProperty = await this.runFieldPreset(propertyName, this.model.additionalProperties, FieldType.additionalProperty);
      results.push(additionalProperty);
    }


    return results
  }

  async renderField(fieldName: name, field: CommonModel): Promise<RenderedFieldArgs> {
    const required = this.isFieldRequired(fieldName);
    let fieldArgs = { field, fieldName, required, fieldType: FieldType.field } as FieldArgs
    const renderedFieldName = await this.runPreset('fieldName', { fieldName, field, fieldType: FieldType.field, required });
    const renderedFieldType = await this.runPreset('fieldType', { fieldName, field, fieldType: FieldType.field, required });
    const renderedFieldMacro = await this.runPreset('fieldMacro', { fieldName, field, fieldType: FieldType.field, required });
    const renderedFieldContent = `${renderedFieldMacro}
pub ${renderedFieldName}: ${renderedFieldType}
    `
    const rendered = { fieldName: renderedFieldName, rustType: renderedFieldType, fieldMacro: renderedFieldMacro, fieldContent: renderedFieldContent }
    return { rendered, ...fieldArgs } as RenderedFieldArgs
  }

  async renderAdditionalPropertiesField(field: CommonModel)



  // if (this.model.patternProperties !== undefined) {
  //   for (const [pattern, patternModel] of Object.entries(this.model.patternProperties)) {
  //     const propertyName = getUniquePropertyName(this.model, `${pattern}${DefaultPropertyNames.patternProperties}`);
  //     const renderedPatternProperty = await this.runFieldPreset(propertyName, patternModel, FieldType.patternProperties);
  //     content.push(renderedPatternProperty);
  //   }
  // }
  // return this.renderBlock(content);
  //   }

  renderFieldMacro(options: RustRenderFieldTypeOptions): string {
    const { originalFieldName, required } = options;
    let serdeArgs = `rename = "${originalFieldName}"`;
    if (!required) {
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

  fieldMacro({ required, fieldName, renderer, fieldType }) {
    const options = { originalFieldName: fieldName, required } as RustRenderFieldTypeOptions;
    if (fieldType === FieldType.additionalProperty) {
      options.originalFieldName = 'additionalProperty';
    } else if (fieldType == FieldType.patternProperties) {
      options.originalFieldName = "PatternProperties"
    }
    return renderer.renderFieldMacro(options);
  },

  fieldType({ field, rendered, renderer, fieldName, required, fieldType }) {

    const outFieldName = rendered?.fieldName
    const options = { originalFieldName: fieldName, required } as RustRenderFieldTypeOptions;

    let fieldType = renderer.renderType(field, options);
    if (type === FieldType.additionalProperty || type === FieldType.patternProperties) {
      options.originalFieldName = 'additionalProperty';
      macro = renderer.renderFieldMacro(options);
      fieldType = renderer.toRustType(type, field, options);
    }
    return fieldType
    const content = `${macro}
pub ${outFieldName}: ${fieldType},`;
    return {
      fieldContent: content,
      fieldName: outFieldName,
      rustType: fieldType
    } as RenderedRustField
  };

}
}
