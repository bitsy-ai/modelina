import { RustRenderer } from '../RustRenderer';
import { EnumPreset, CommonModel } from '../../../models';
import { FormatHelpers } from '../../../helpers';
import { pascalCaseTransformMerge } from 'change-case';
import { isReservedRustKeyword } from '../Constants';
import { RenderedRustEnum } from '../RustPreset';

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

    let enumValues: RenderedRustEnum[] = [];
    if (this.isEnumUniform(this.model)) {
      enumValues = enumValues.concat(this.renderUniformEnum(this.model));
    } else {
      enumValues = enumValues.concat(this.renderHeterogenousEnum(this.model));
    }

    const implementation: string[] = [];
    if (this.options.renderDefaults) {
      implementation.push(this.renderDefaultImplementation(formattedName, this.model, enumValues));
    }

    const content = enumValues.map(v => [v.macroContent, v.memberContent]).flat();

    return `${doc}
${this.renderEnumTypeMacro()}
pub enum ${formattedName} {
${this.indent(this.renderBlock(content), 4)}
}
${this.renderBlock(implementation)}
`.trim();
  }
  getDefaultOrFirst(enumValues: RenderedRustEnum[]): RenderedRustEnum {
    const found = enumValues.find(v => v.isDefault);
    if (found === undefined) {
      return enumValues[0];
    }
    return found;
  }

  renderDefaultImplementation(formattedName: string, model: CommonModel, enumValues: RenderedRustEnum[]): string {
    const defaultValue = this.getDefaultOrFirst(enumValues);
    const memberValue = defaultValue.memberContent.replace(',', '');
    return `impl Default for ${formattedName} {
    fn default() -> ${formattedName}{
        Self::${memberValue}
    }
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

  renderUniformEnum(model: CommonModel): RenderedRustEnum[] {
    if (model.enum === undefined) { return []; }
    return model.enum.map(v => {
      const originalValue = v.toString();
      let enumMember = originalValue;
      // if we're not rendering an Enum of Strings, add safe prefix/suffixes to avoid syntax errors from integers and other values enum values
      if (!this.isEnumString(model) && this.options?.namingConvention?.enumMember !== undefined) {
        enumMember = this.options.namingConvention.enumMember(v, { model, inputModel: this.inputModel, reservedKeywordCallback: isReservedRustKeyword });
      }
      const macroContent = this.renderEnumMemberMacro(v);
      const memberContent = `${FormatHelpers.toPascalCase(enumMember, { transform: pascalCaseTransformMerge })},`;
      const isDefault = this.isDefaultValue(v, model);
      return {
        macroContent, memberContent, originalValue, isDefault
      } as RenderedRustEnum;
    });
  }

  isDefaultValue(value: any, model: CommonModel): boolean {
    return model.originalInput && model.originalInput.default ? model.originalInput.default === value : false;
  }

  renderHeterogenousEnum(model: CommonModel): RenderedRustEnum[] {
    if (model.enum === undefined) { return []; }
    return model.enum.map((originalValue, idx) => {
      const isDefault = this.isDefaultValue(originalValue, model);

      if (typeof (originalValue) === 'object') {
        const macroContent = this.renderEnumMemberMacro(idx.toString());
        const memberContent = 'HashMap(HashMap<String,String>)';
        return {
          macroContent, memberContent, originalValue, isDefault
        } as RenderedRustEnum;
      }
      const innerType = this.toRustType(typeof originalValue, model, '');
      const outerType = innerType === 'String' ? originalValue : innerType;
      const macroContent = this.renderEnumMemberMacro(idx.toString());
      const memberContent = FormatHelpers.toPascalCase(outerType, { transform: pascalCaseTransformMerge });
      return {
        macroContent,
        memberContent: `${memberContent}(${innerType}),`,
        originalValue,
        isDefault
      } as RenderedRustEnum;
    });
  }

  enumType(model: CommonModel): string {
    return this.toRustType(this.model.type, model, '');
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
