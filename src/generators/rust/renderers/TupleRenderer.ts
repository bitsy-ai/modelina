
import { RustRenderer, RustRenderFieldTypeOptions } from '../RustRenderer';
import { TuplePreset } from '../RustPreset';
import { CommonModel } from 'models';

/**
 * Renderer for a tuple constructed from Rust's `struct` type
 * 
 * @extends RustRenderer
 */
export class TupleRenderer extends RustRenderer {
  public async defaultSelf(): Promise<string> {
    return await this.renderTuples();
  }

  renderTupleFieldTypes(field: CommonModel, options: RustRenderFieldTypeOptions): string[] {
    if (field.items && Array.isArray(field.items)) {
      return field.items.map((item) => this.toRustType(item.type, item, options));
    }
    return [''];
  }
  renderTypeMacro(): string {
    return '#[derive(Clone, Debug, PartialEq, Default, Serialize, Deserialize)]';
  }
}

export const RUST_DEFAULT_TUPLE_PRESET: TuplePreset<TupleRenderer> = {
  self({ renderer }) {
    return renderer.defaultSelf();
  },

  tuple({ fieldName, field, renderer, parent }) {
    const options: RustRenderFieldTypeOptions = { required: true, originalFieldName: fieldName };

    const formattedName = renderer.nameTupleType(options);
    const doc = renderer.renderComments(`${formattedName} represents field ${fieldName} from ${parent.$id} model.`);
    const fields = renderer.renderTupleFieldTypes(field, options);

    return `${doc}
${renderer.renderTypeMacro()}
pub struct ${formattedName}(${fields.join(', ')});
`;
  }
};
