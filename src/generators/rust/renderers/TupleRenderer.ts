
import { RustRenderer, RustRenderFieldTypeOptions } from '../RustRenderer';
import { TuplePreset } from '../RustPreset';
import { CommonModel } from 'models';

/**
 * Renderer for a tuple constructed from Rust's `struct` type
 * 
 * @extends RustRenderer
 */
export class TupleRenderer extends RustRenderer {
  public defaultSelf(): string {
    return '';
  }

  renderTupleFieldTypes(field: CommonModel, options: RustRenderFieldTypeOptions): string[] {
    if (field.items && Array.isArray(field.items)) {
      return field.items.map((item) => {
        if (item.$ref !== undefined) {
          return this.toRustType('$ref', item, options);
        }
        return this.toRustType(item.type, item, options);
      });
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

  tuple({ fieldName, originalFieldName, field, renderer, parent }) {
    const options: RustRenderFieldTypeOptions = { required: true, originalFieldName: fieldName };

    const doc = renderer.renderComments(`${fieldName} represents field ${originalFieldName} from ${parent.$id} model.`);
    const fields = renderer.renderTupleFieldTypes(field, options);

    return `${doc}
${renderer.renderTypeMacro()}
pub struct ${fieldName}(${fields.join(', ')});
`;
  }
};
