import { RustRenderer, RustRenderFieldTypeOptions } from '../RustRenderer';
import { FieldType, StructPreset } from '../RustPreset';
/**
 * Renderer for Rust's `struct` type
 * 
 * @extends RustRenderer
 */
export class StructRenderer extends RustRenderer {
  public async defaultSelf(): Promise<string> {
    const fieldContent = [
      await this.renderFields(),
      await this.runAdditionalContentPreset()
    ];

    const formattedName = this.nameType(this.model.$id);
    const doc = this.renderComments(`${formattedName} represents a ${formattedName} model.`);

    return `${doc}
${this.renderStructTypeMacro()}
pub struct ${formattedName} {
${this.indent(this.renderBlock(fieldContent))}
}`;
  }

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

  field({ fieldName, field, renderer, type, required }) {
    const outFieldName = renderer.nameField(fieldName, field);
    const options = { originalFieldName: fieldName, required } as RustRenderFieldTypeOptions;

    let fieldType = renderer.renderType(field, options);
    let macro = renderer.renderFieldMacro(options);
    if (type === FieldType.additionalProperty || type === FieldType.patternProperties) {
      options.originalFieldName = 'additionalProperty';
      macro = renderer.renderFieldMacro(options);
      fieldType = renderer.toRustType(type, field, options);
    }
    return `${macro}
pub ${outFieldName}: ${fieldType},`;
  },
};
