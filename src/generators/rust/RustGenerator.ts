import { AbstractGenerator, CommonGeneratorOptions, defaultGeneratorOptions } from '../AbstractGenerator';
import { snakeCase } from 'change-case';
import { Logger } from '../../utils/LoggingInterface';
import { TypeHelpers, ModelKind, FormatHelpers } from '../../helpers';
import { CommonModel, CommonInputModel, Draft4Schema, Draft6Schema, Draft7Schema, OpenapiV3Schema, AsyncapiV2Schema, SwaggerV2Schema, } from '../../models';
import { pascalCaseTransformMerge } from 'change-case';

import { RustPreset, RUST_DEFAULT_PRESET } from './RustPreset';
import { StructRenderer } from './renderers/StructRenderer';
import { TupleRenderer } from './renderers/TupleRenderer';
import { EnumRenderer } from './renderers/EnumRenderer';
import { isReservedRustKeyword, UNSTABLE_POLYMORPHIC_IMPLEMENTATION_WARNING } from './Constants';
import { RustRenderOutput, RustDependency, RustDependencyType } from './RustRenderOutput';

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
 * Rust-specific RustRenderOutput class
 * Adds module-scoped struct and enum dependency containers to base RustRenderOutput class
 */
export class RustRustRenderOutput { }

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

  isPolymorphic(inputModel: CommonInputModel): boolean {
    let result = false;
    if (inputModel.originalInput.allOf || inputModel.originalInput.anyOf || inputModel.originalInput.oneOf) {
      result = true;
    }
    if (typeof (inputModel.originalInput.properties) === 'object') {
      const properties = inputModel.originalInput.properties as { [key: string]: Draft4Schema | Draft6Schema | Draft7Schema | AsyncapiV2Schema | OpenapiV3Schema | SwaggerV2Schema };
      for (const [fieldName, field] of Object.entries(properties)) {
        if (field.allOf || field.anyOf || field.oneOf) {
          result = true;
          Logger.warn(UNSTABLE_POLYMORPHIC_IMPLEMENTATION_WARNING(fieldName));
          result = true;
        }
      }
    }
    return result;
  }

  render(model: CommonModel, inputModel: CommonInputModel): Promise<RustRenderOutput> {
    const kind = TypeHelpers.extractKind(model);
    // sanity-check and warn about unstable polymorphism
    this.isPolymorphic(inputModel);
    switch (kind) {
      case ModelKind.OBJECT:
        return this.renderStruct(model, inputModel);
      case ModelKind.ENUM:
        return this.renderEnum(model, inputModel);
    }
    Logger.warn(`Rust generator, cannot generate this type of model, ${model.$id}`);
    return Promise.resolve(RustRenderOutput.toRustRenderOutput({ result: '', renderedName: '', rustModuleDependencies: [] }));
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
    return RustRenderOutput.toRustRenderOutput({ result: outputContent, renderedName: outputModel.renderedName, rustModuleDependencies: outputModel.rustModuleDependencies });
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
    return RustRenderOutput.toRustRenderOutput({ result, renderedName: fieldName, rustModuleDependencies: renderer.rustModuleDependencies });
  }

  async renderEnum(model: CommonModel, inputModel: CommonInputModel): Promise<RustRenderOutput> {
    const presets = this.getPresets('enum');
    const renderer = new EnumRenderer(this.options, this, presets, model, inputModel);
    const result = await renderer.runSelfPreset();
    const renderedName = renderer.nameType(model.$id, model);
    return RustRenderOutput.toRustRenderOutput({ result, renderedName, rustModuleDependencies: renderer.rustModuleDependencies });
  }

  async renderStruct(model: CommonModel, inputModel: CommonInputModel): Promise<RustRenderOutput> {
    const presets = this.getPresets('struct');
    const renderer = new StructRenderer(this.options, this, presets, model, inputModel);
    const result = await renderer.runSelfPreset();
    const renderedName = renderer.nameType(model.$id, model);
    return RustRenderOutput.toRustRenderOutput({ result, renderedName, rustModuleDependencies: renderer.rustModuleDependencies });
  }
}
