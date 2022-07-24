import { CommonModel, RenderOutput } from '../../models';

export enum RustDependencyType {
  tuple,
  struct
}

/**
* Represents a module-level Rust dependency
*/
export type RustDependency = {
  originalFieldName: string
  fieldName: string
  type: RustDependencyType
  field: CommonModel
  parent: CommonModel
}

export interface ToRustRenderOutputArg {
  result: string;
  renderedName: string;
  rustModuleDependencies?: RustDependency[];
}

/**
 * Extends common RenderOutput representation to use RustDependency dependency representation
 */
export class RustRenderOutput extends RenderOutput {
  constructor(
    public readonly result: string,
    public readonly renderedName: string,
    public readonly rustModuleDependencies: RustDependency[] = []
  ) { super(result, renderedName, []); this.rustModuleDependencies = rustModuleDependencies; }

  static toRustRenderOutput(args: ToRustRenderOutputArg): RustRenderOutput {
    return new this(args.result, args.renderedName, args.rustModuleDependencies);
  }
}
