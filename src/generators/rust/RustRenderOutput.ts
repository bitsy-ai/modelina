import { CommonModel, RenderOutput } from '../../models';

export enum RustDependencyType {
  tuple,
  struct,
  generic
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
  rustModuleDependencies: RustDependency[];
  fileName: string;
}

/**
 * Extends common RenderOutput representation to use RustDependency dependency representation
 */
export class RustRenderOutput extends RenderOutput {
  constructor(
    public readonly result: string,
    public readonly renderedName: string,
    public readonly rustModuleDependencies: RustDependency[] = [],
    public readonly fileName: string = ''
  ) { super(result, renderedName, []); this.rustModuleDependencies = rustModuleDependencies; this.fileName = fileName; }

  static toRustRenderOutput(args: ToRustRenderOutputArg): RustRenderOutput {
    return new this(args.result, args.renderedName, args.rustModuleDependencies, args.fileName);
  }
}
