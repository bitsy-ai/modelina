import { AbstractGenerator, CommonGeneratorOptions, defaultGeneratorOptions } from '../AbstractGenerator';
import { snakeCase } from 'change-case';
import { Logger } from '../../utils/LoggingInterface';
import { TypeHelpers, ModelKind, FormatHelpers } from '../../helpers';
import { CommonModel, CommonInputModel } from '../../models';
import { pascalCaseTransformMerge } from 'change-case';
import { DefaultPropertyNames, getUniquePropertyName } from '../../helpers';

import { RustPreset, RUST_DEFAULT_PRESET } from './RustPreset';
import { StructRenderer } from './renderers/StructRenderer';
import { TupleRenderer } from './renderers/TupleRenderer';
import { EnumRenderer } from './renderers/EnumRenderer';
import { isReservedRustKeyword } from './Constants';
import { RustRenderOutput, RustDependency, RustDependencyType } from './RustRenderOutput';
import { PackageRenderer } from './renderers/PackageRenderer';
import { RustOutputModel } from './RustOutput';
/**
 * The Rust naming convention type
 */
export type RustNamingConvention = {
  additionalPropertyType?: (ctx: { model: CommonModel, inputModel: CommonInputModel, reservedKeywordCallback?: (name: string) => boolean }) => string;
  enumMember?: (name: string | undefined, ctx: { model: CommonModel, inputModel: CommonInputModel, reservedKeywordCallback?: (name: string) => boolean }) => string;
  type?: (name: string | undefined, ctx: { model: CommonModel, inputModel: CommonInputModel, reservedKeywordCallback?: (name: string) => boolean }) => string;
  field?: (name: string | undefined, ctx: { model: CommonModel, inputModel: CommonInputModel, field?: CommonModel, reservedKeywordCallback?: (name: string) => boolean }) => string;
  module?: (name: string | undefined, ctx: { model: CommonModel, inputModel: CommonInputModel, field?: CommonModel, reservedKeywordCallback?: (name: string) => boolean }) => string;
};

/**
 * default RustNamingConvention implementation
 */
export const RustNamingConventionImplementation: RustNamingConvention = {
  additionalPropertyType: (ctx) => {
    if (ctx.model.$id === undefined) { return ''; }
    const propertyName = FormatHelpers.toPascalCase(getUniquePropertyName(ctx.model, DefaultPropertyNames.additionalProperties), { transform: pascalCaseTransformMerge });
    let formattedName = FormatHelpers.toPascalCase(ctx.model.$id + propertyName, { transform: pascalCaseTransformMerge });
    if (ctx.reservedKeywordCallback !== undefined && ctx.reservedKeywordCallback(formattedName)) {
      formattedName = FormatHelpers.toPascalCase(`reserved_${formattedName}`, { transform: pascalCaseTransformMerge });
    }
    return formattedName;
  },
  enumMember: (name: string | undefined, ctx) => {
    if (name === undefined) { return ''; }
    const formattedName = FormatHelpers.toPascalCase(FormatHelpers.replaceSpecialCharacters(name.toString()), { transform: pascalCaseTransformMerge });
    const prefix = ctx.model.$id || 'EnumMember';
    return FormatHelpers.toPascalCase(prefix + formattedName, { transform: pascalCaseTransformMerge });
  },
  module: (name: string | undefined, ctx) => {
    if (name === undefined) { return ''; }
    let formattedName = FormatHelpers.replaceSpecialCharacters(name);
    formattedName = snakeCase(name);
    if (ctx.reservedKeywordCallback !== undefined && ctx.reservedKeywordCallback(formattedName)) {
      formattedName = snakeCase(`reserved_${formattedName}`);
    }
    return formattedName;
  },
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

export enum RustPackageFeatures {
  json,
  jwt
}

export interface RustOptions extends CommonGeneratorOptions<RustPreset> {
  namingConvention?: RustNamingConvention;
  packageName: string;
  packageVersion: string;
  authors: string[];
  homepage: string;
  repository: string;
  license: string;
  description: string;
  edition: string;
  packageFeatures: RustPackageFeatures[]
}

export interface RustRenderCompleteModelOptions {
  renderSupportingFiles: boolean
}

export const defaultRustRenderCompleteModelOptions: RustRenderCompleteModelOptions = {
  renderSupportingFiles: true
};

export class RustGenerator extends AbstractGenerator<RustOptions, RustRenderCompleteModelOptions> {
  static defaultOptions: RustOptions = {
    ...defaultGeneratorOptions,
    defaultPreset: RUST_DEFAULT_PRESET,
    namingConvention: RustNamingConventionImplementation,
    packageName: 'asyncapi-rs-models',
    packageVersion: '0.0.0',
    authors: ['AsyncAPI Rust Champions'],
    homepage: 'https://www.asyncapi.com/tools/modelina',
    repository: 'https://github.com/asyncapi/modelina',
    license: 'Apache-2.0',
    description: 'Rust models generated by AsyncAPI Modelina',
    edition: '2018',
    packageFeatures: [] as RustPackageFeatures[]
  };
  constructor(
    options: RustOptions = RustGenerator.defaultOptions,
  ) {
    super('Rust', RustGenerator.defaultOptions, options);
  }
  reservedRustKeyword(name: string): boolean {
    return isReservedRustKeyword(name);
  }

  render(model: CommonModel, inputModel: CommonInputModel): Promise<RustRenderOutput> {
    const kind = TypeHelpers.extractKind(model);
    switch (kind) {
    case ModelKind.UNION:
      return this.renderEnum(model, inputModel);
    case ModelKind.OBJECT:
      return this.renderStruct(model, inputModel);
    case ModelKind.ENUM:
      return this.renderEnum(model, inputModel);
    }
    Logger.warn(`Rust generator, cannot generate this type of model, ${model.$id}`);
    return Promise.resolve(RustRenderOutput.toRustRenderOutput({ fileName: '', result: '', renderedName: '', rustModuleDependencies: [] }));
  }

  /**
   * Render a complete model result where the model code, library and model dependencies are all bundled appropriately.
   *
   * @param model
   * @param inputModel
   * @param options
   */
  async renderCompleteModel(model: CommonModel, inputModel: CommonInputModel): Promise<RustRenderOutput> {
    const outputModel = await this.render(model, inputModel);

    let rustModuleDependencies = '';
    if (outputModel.rustModuleDependencies.length > 0) {
      const dependencyOutputs: RustRenderOutput[] = await this.renderDependencies(model, inputModel, outputModel.rustModuleDependencies, []);
      rustModuleDependencies += dependencyOutputs.map(o => o.result).join('\n');
    }
    const outputContent = `${rustModuleDependencies}${outputModel.result}`;

    return RustRenderOutput.toRustRenderOutput({ fileName: outputModel.fileName, result: outputContent, renderedName: outputModel.renderedName, rustModuleDependencies: outputModel.rustModuleDependencies });
  }

  /**
   * Generates the full output of a model, instead of a scattered model.
   * 
   * OutputModels result is no longer the model itself, but including package, package dependencies and model dependencies.
   * 
   * @param input 
   * @param options to use for rendering full output
   */
  public async generateCompleteModels(input: Record<string, unknown> | CommonInputModel, options: RustRenderCompleteModelOptions): Promise<RustOutputModel[]> {
    Logger.info('Generating models from options: ', options);
    const inputModel = input instanceof CommonInputModel ? input : await this.process(input);
    const modules = await Promise.all(Object.values(inputModel.models).map(async (model) => {
      const renderedOutput = await this.renderCompleteModel(model, inputModel);
      return RustOutputModel.toOutputModel({
        fileName: renderedOutput.fileName,
        result: renderedOutput.result,
        modelName: renderedOutput.renderedName,
        dependencies: renderedOutput.dependencies,
        model,
        inputModel
      });
    }));
    return Promise.all(modules);
  }

  /**
   * Render supporting Cargo.toml manifest file, similar to OpenAPI's SupportingFiles concept
   * https://openapi-generator.tech/docs/customization/
   */
  public async renderManifest(): Promise<RustRenderOutput> {
    const presets = this.getPresets('package');
    const renderer = new PackageRenderer(this.options, this, presets, new CommonModel(), new CommonInputModel());
    const { authors, description, edition, homepage, license, packageName, packageVersion, repository } = this.options;
    const result = await renderer.runPreset('manifest', { authors, description, edition, homepage, license, packageName, packageVersion, repository });
    const fileName = 'Cargo.toml';

    return RustRenderOutput.toRustRenderOutput({ result, fileName, renderedName: fileName, rustModuleDependencies: [] });
  }

  /**
 * Render supporting lib.rs content
 * https://openapi-generator.tech/docs/customization/
 */
  public async renderLib(modelNames: string[]): Promise<RustRenderOutput> {
    const presets = this.getPresets('package');
    const renderer = new PackageRenderer(this.options, this, presets, new CommonModel(), new CommonInputModel());
    const result = await renderer.runPreset('lib', { modelNames });
    const fileName = 'src/lib.rs';

    return RustRenderOutput.toRustRenderOutput({ result, fileName, renderedName: fileName, rustModuleDependencies: [] });
  }

  /**
   * Render all module-level dependencies
   */
  async renderDependencies(model: CommonModel, inputModel: CommonInputModel, dependencies: RustDependency[], accumulator: RustRenderOutput[]): Promise<RustRenderOutput[]> {
    await Promise.all(dependencies.map(async (dependency: RustDependency) => {
      switch (dependency.type) {
      case RustDependencyType.tuple: {
        const { parent, fieldName, originalFieldName, field } = dependency;
        const result = await this.renderTuple(fieldName, originalFieldName, field, parent, inputModel);
        accumulator.push(result);
        if (result.rustModuleDependencies.length > 0) {
          await this.renderDependencies(dependency.field, inputModel, result.rustModuleDependencies, accumulator);
        }
        return accumulator;
      }
      case RustDependencyType.struct:
        return accumulator;
      default:
        return accumulator;
      }
    }));
    return accumulator;
  }

  async renderTuple(fieldName: string, originalFieldName: string, field: CommonModel, parent: CommonModel, inputModel: CommonInputModel): Promise<RustRenderOutput> {
    const presets = this.getPresets('tuple');
    const renderer = new TupleRenderer(this.options, this, presets, parent, inputModel);
    const result = await renderer.runTuplePreset(fieldName, originalFieldName, field, parent);
    const fileName = renderer.nameModuleFile(fieldName);
    return RustRenderOutput.toRustRenderOutput({ result, fileName, renderedName: fieldName, rustModuleDependencies: renderer.rustModuleDependencies });
  }

  async renderEnum(model: CommonModel, inputModel: CommonInputModel): Promise<RustRenderOutput> {
    const presets = this.getPresets('enum');
    const renderer = new EnumRenderer(this.options, this, presets, model, inputModel);
    const result = await renderer.runSelfPreset();
    const renderedName = renderer.nameType(model.$id, model);
    const fileName = renderer.nameModuleFile(renderedName);

    return RustRenderOutput.toRustRenderOutput({ fileName, result, renderedName, rustModuleDependencies: renderer.rustModuleDependencies });
  }

  async renderStruct(model: CommonModel, inputModel: CommonInputModel): Promise<RustRenderOutput> {
    const presets = this.getPresets('struct');
    const renderer = new StructRenderer(this.options, this, presets, model, inputModel);
    const result = await renderer.runSelfPreset();
    const renderedName = renderer.nameType(model.$id, model);
    const fileName = renderer.nameModuleFile(renderedName);

    return RustRenderOutput.toRustRenderOutput({ fileName, result, renderedName, rustModuleDependencies: renderer.rustModuleDependencies });
  }
}
