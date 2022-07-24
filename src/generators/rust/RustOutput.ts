import { OutputModel, ToOutputModelArg } from '../../models/OutputModel';
import { CommonInputModel } from '../../models/CommonInputModel';
import { CommonModel } from '../../models/CommonModel';

export interface ToRustOutputModelArg extends ToOutputModelArg {
  fileName: string
}

export class RustOutputModel extends OutputModel {
  constructor(
    public readonly result: string,
    public readonly model: CommonModel,
    public readonly modelName: string,
    public readonly inputModel: CommonInputModel,
    public readonly dependencies: string[],
    // fields added by rust output model
    public readonly fileName: string
  ) {
    super(result, model, modelName, inputModel, dependencies);
    this.fileName = fileName;
  }

  static toOutputModel(args: ToRustOutputModelArg): RustOutputModel;
  static toOutputModel(args: Array<ToRustOutputModelArg>): Array<RustOutputModel>;
  static toOutputModel(args: ToRustOutputModelArg | Array<ToRustOutputModelArg>): RustOutputModel | Array<RustOutputModel> {
    if (Array.isArray(args)) {
      return args.map(arg => new this(arg.result, arg.model, arg.modelName, arg.inputModel, arg.dependencies, arg.fileName));
    }
    return new this(args.result, args.model, args.modelName, args.inputModel, args.dependencies, args.fileName);
  }
}
