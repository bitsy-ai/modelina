/* eslint-disable sonarjs/no-nested-template-literals */
import * as path from 'path';
import { AbstractFileGenerator } from 'generators/AbstractFileGenerator';
import { CommonInputModel } from '../../models';
import { RustGenerator, RustOptions } from './RustGenerator';
import { FileHelpers } from '../../helpers';
import { RustOutputModel } from './RustOutput';

export class RustFileGenerator extends RustGenerator implements AbstractFileGenerator<RustOptions> {
  public async generateSupportFiles(generatedModels: RustOutputModel[], outputDirectory: string): Promise<void> {
    const manifest = await this.renderManifest();
    let filePath = path.resolve(outputDirectory, manifest.fileName);
    await FileHelpers.writerToFileSystem(manifest.result, filePath);

    const libModule = await this.renderLib(generatedModels.map(x => x.modelName));
    filePath = path.resolve(outputDirectory, libModule.fileName);
    await FileHelpers.writerToFileSystem(libModule.result, filePath);
  }
  /**
   * Generates all the models to an output directory. One Rust module is generated per model.
   * 
   * @param input
   * @param outputDirectory
   * @param options 
   */
  public async generateToFiles(input: CommonInputModel | Record<string, unknown>, outputDirectory: string, options: RustOptions): Promise<RustOutputModel[]> {
    this.options = { ...this.options, ...options };
    let generatedModels = await this.generateCompleteModels(input, options);
    generatedModels = generatedModels.filter(outputModel => { return outputModel.modelName !== undefined && outputModel.modelName !== ''; });
    for (const outputModel of generatedModels) {
      const filePath = path.join(outputDirectory, outputModel.fileName);
      await FileHelpers.writerToFileSystem(outputModel.result, filePath);
    }

    if (this.options.renderSupportingFiles) {
      await this.generateSupportFiles(generatedModels, outputDirectory);
    }

    return generatedModels;
  }
}
