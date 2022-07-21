import { AbstractGenerator, CommonGeneratorOptions, defaultGeneratorOptions } from '../AbstractGenerator';
import { snakeCase } from 'change-case';
import { Logger } from '../../utils/LoggingInterface';
import { TypeHelpers, ModelKind, FormatHelpers } from '../../helpers';
import { CommonModel, CommonInputModel, RenderOutput } from '../../models';
import { pascalCaseTransformMerge } from 'change-case';

import { RustPreset, RUST_DEFAULT_PRESET } from './RustPreset';
import { StructRenderer } from './renderers/StructRenderer';
import { TupleRenderer } from './renderers/TupleRenderer';
import { EnumRenderer } from './renderers/EnumRenderer';
import { isReservedRustKeyword } from './Constants';

/**
 * The Rust naming convention type
 */
export type RustNamingConvention = {
  type?: (name: string | undefined, ctx: { model: CommonModel, inputModel: CommonInputModel, reservedKeywordCallback?: (name: string) => boolean }) => string;
  field?: (name: string | undefined, ctx: { model: CommonModel, inputModel: CommonInputModel, field?: CommonModel, reservedKeywordCallback?: (name: string) => boolean }) => string;
};

/**
 * default RustNamingConvention implementation
 */
export const RustNamingConventionImplementation: RustNamingConvention = {
  type: (name: string | undefined, ctx) => {
    if (!name) { return ''; }
    let formattedName = FormatHelpers.toPascalCase(name, { transform: pascalCaseTransformMerge });
    if (ctx.reservedKeywordCallback !== undefined && ctx.reservedKeywordCallback(formattedName)) {
      formattedName = FormatHelpers.toPascalCase(`reserved_${formattedName}`);
    }
    return formattedName;
  },
  // eslint-disable-next-line sonarjs/no-identical-functions
  field: (name: string | undefined, ctx) => {
    if (!name) { return ''; }
    let formattedName = FormatHelpers.replaceSpecialCharacters(name);
    formattedName = snakeCase(name);
    if (ctx.reservedKeywordCallback !== undefined && ctx.reservedKeywordCallback(formattedName)) {
      formattedName = snakeCase(`reserved_${formattedName}`);
    }
    return formattedName;
  }
};

/**
 * Rust-specific RenderOutput class
 * Adds module-scoped struct and enum dependency containers to base RenderOutput class
 */
export class RustRenderOutput { }

export interface RustOptions extends CommonGeneratorOptions<RustPreset> {
  namingConvention?: RustNamingConvention;
}

export interface RustRenderCompleteModelOptions {
  packageName: string
}

export class RustGenerator extends AbstractGenerator<RustOptions, RustRenderCompleteModelOptions> {
  static defaultOptions: RustOptions = {
    ...defaultGeneratorOptions,
    defaultPreset: RUST_DEFAULT_PRESET,
    namingConvention: RustNamingConventionImplementation
  };
  constructor(
    options: RustOptions = RustGenerator.defaultOptions,
  ) {
    super('Rust', RustGenerator.defaultOptions, options);
  }
  reservedRustKeyword(name: string): boolean {
    return isReservedRustKeyword(name);
  }

  render(model: CommonModel, inputModel: CommonInputModel): Promise<RenderOutput> {
    const kind = TypeHelpers.extractKind(model);
    switch (kind) {
    case ModelKind.UNION:
      // We don't support union in Rust generator, however, if union is an object, we render it as a structs
      if (!model.type?.includes('object')) { break; }
      return this.renderStruct(model, inputModel);
    case ModelKind.OBJECT:
      return this.renderStruct(model, inputModel);
    case ModelKind.ENUM:
      return this.renderEnum(model, inputModel);
    }
    Logger.warn(`Rust generator, cannot generate this type of model, ${model.$id}`);
    return Promise.resolve(RenderOutput.toRenderOutput({ result: '', renderedName: '', dependencies: [] }));
  }

  /**
   * Render a complete model result where the model code, library and model dependencies are all bundled appropriately.
   *
   * @param model
   * @param inputModel
   * @param options
   */
  async renderCompleteModel(model: CommonModel, inputModel: CommonInputModel): Promise<RenderOutput> {
    const outputModel = await this.render(model, inputModel);

    let modelDependencies = '';
    if (outputModel.dependencies.length > 0) {
      const outputTuples = await this.renderTuples(model, inputModel);
      modelDependencies = outputTuples.result;
    }
    const outputContent = `${modelDependencies}
${outputModel.result}`;
    return RenderOutput.toRenderOutput({ result: outputContent, renderedName: outputModel.renderedName, dependencies: outputModel.dependencies });
  }

  async renderTuples(model: CommonModel, inputModel: CommonInputModel): Promise<RenderOutput> {
    const presets = this.getPresets('tuple');
    const renderer = new TupleRenderer(this.options, this, presets, model, inputModel);
    const result = await renderer.runSelfPreset();
    const renderedName = renderer.nameType(model.$id, model);
    return RenderOutput.toRenderOutput({ result, renderedName, dependencies: renderer.dependencies });
  }

  async renderEnum(model: CommonModel, inputModel: CommonInputModel): Promise<RenderOutput> {
    const presets = this.getPresets('enum');
    const renderer = new EnumRenderer(this.options, this, presets, model, inputModel);
    const result = await renderer.runSelfPreset();
    const renderedName = renderer.nameType(model.$id, model);
    return RenderOutput.toRenderOutput({ result, renderedName, dependencies: renderer.dependencies });
  }

  async renderStruct(model: CommonModel, inputModel: CommonInputModel): Promise<RenderOutput> {
    const presets = this.getPresets('struct');
    const renderer = new StructRenderer(this.options, this, presets, model, inputModel);
    const result = await renderer.runSelfPreset();
    const renderedName = renderer.nameType(model.$id, model);
    return RenderOutput.toRenderOutput({ result, renderedName, dependencies: renderer.dependencies });
  }
}
