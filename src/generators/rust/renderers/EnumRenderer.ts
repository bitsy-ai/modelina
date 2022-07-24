import { RustRenderer, RustRenderFieldTypeOptions } from '../RustRenderer';
import { EnumPreset, CommonModel } from '../../../models';
import { FormatHelpers } from '../../../helpers';
import { pascalCaseTransformMerge } from 'change-case';
import { isReservedRustKeyword } from '../Constants';

/**
 * Renderer for Rust's `enum` type
 * 
 * @extends RustRenderer
 */
export class EnumRenderer extends RustRenderer {
  public defaultSelf(): string {
    const formattedName = this.nameType(this.model.$id);
    const enumType = typeof (this.model.type) === 'object' ? `[${this.model.type}]` : this.enumType(this.model);
    const doc = formattedName && this.renderCommentForEnumType(formattedName, enumType);

    const enumValues: string[] = [];
    if (this.isEnumUniform(this.model)) {
      enumValues.push(this.renderUniformEnum(this.model));
    } else {
      enumValues.push(this.renderHeterogenousEnum(this.model));
    }
    return `${doc}
${this.renderEnumTypeMacro()}
pub enum ${formattedName} {
${this.indent(this.renderBlock(enumValues))}
}`;
  }

  renderEnumTypeMacro(): string {
    return '#[derive(Clone, Copy, Debug, Eq, PartialEq, Ord, PartialOrd, Hash, Serialize, Deserialize)]';
  }

  renderEnumMemberMacro(field: string): string {
    return `#[serde(rename = "${field}")]`;
  }

  isEnumUniform(model: CommonModel): boolean {
    if (model.enum === undefined) { return false; }
    const matchType = model.enum ? typeof (model.enum[0]) : typeof ('');
    return model.enum?.every(v => typeof (v) === matchType);
  }

  isEnumString(model: CommonModel): boolean {
    return model.type === 'string';
  }

  renderUniformEnum(model: CommonModel): string {
    if (model.enum === undefined) { return ''; }
    const result = model.enum.map(v => {
      let enumMember = v.toString();
      // if we're not rendering an Enum of Strings, add safe prefix/suffixes to avoid syntax errors from integers and other values enum values
      if (!this.isEnumString(model) && this.options?.namingConvention?.enumMember !== undefined) {
        enumMember = this.options.namingConvention.enumMember(v, { model, inputModel: this.inputModel, reservedKeywordCallback: isReservedRustKeyword });
      }
      const macroContent = this.renderEnumMemberMacro(v);
      const valueContent = `${FormatHelpers.toPascalCase(enumMember, { transform: pascalCaseTransformMerge })},`;
      return [macroContent, valueContent];
    });
    return this.renderBlock(result.flat());
  }

  renderHeterogenousEnum(model: CommonModel): string {
    if (model.enum === undefined) { return ''; }
    const result = model.enum.map((v, idx) => {
      if (typeof (v) === 'object') {
        const macroContent = this.renderEnumMemberMacro(idx.toString());
        const outerType = 'HashMap(HashMap<String,String>)';
        return [macroContent, outerType];
      }
      const innerType = this.toRustType(typeof v, model, { required: true } as RustRenderFieldTypeOptions);
      const outerType = innerType === 'String' ? v : innerType;
      const macroContent = this.renderEnumMemberMacro(idx.toString());
      const valueContent = FormatHelpers.toPascalCase(outerType, { transform: pascalCaseTransformMerge });
      return [macroContent, `${valueContent}(${innerType}),`];
    });
    return this.renderBlock(result.flat());
  }

  enumType(model: CommonModel): string {
    return this.toRustType(this.model.type, model, { required: true } as RustRenderFieldTypeOptions);
  }

  renderCommentForEnumType(name: string, type: string): string {
    return this.renderComments(`${name} enum of type: ${type}`);
  }
}

export const RUST_DEFAULT_ENUM_PRESET: EnumPreset<EnumRenderer> = {
  self({ renderer }) {
    return renderer.defaultSelf();
  },
};
