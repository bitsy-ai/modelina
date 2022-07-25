
import { RustRenderer } from '../RustRenderer';
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

  renderTupleFieldTypes(fieldName: string, field: CommonModel): string[] {
    if (field.items && Array.isArray(field.items)) {
      return field.items.map((item) => {
        if (item.$ref !== undefined) {
          return this.toRustType('$ref', item, item.$ref);
        }
        return this.toRustType(item.type, item, fieldName);
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
    const doc = renderer.renderComments(`${fieldName} represents field ${originalFieldName} from ${parent.$id} model.`);
    const fields = renderer.renderTupleFieldTypes(originalFieldName, field);

    return `${doc}
${renderer.renderTypeMacro()}
pub struct ${fieldName}(${fields.join(', ')});
`;
  }
};
