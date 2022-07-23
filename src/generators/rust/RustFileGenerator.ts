import * as path from 'path';
import { AbstractFileGenerator } from 'generators/AbstractFileGenerator';
import { CommonInputModel, OutputModel } from 'models';
import { RustGenerator, RustRenderCompleteModelOptions } from './RustGenerator';
import { FileHelpers } from '../../helpers';

export class RustFileGenerator extends RustGenerator implements AbstractFileGenerator<RustRenderCompleteModelOptions> {
  /**
   * Generates all the models to an output directory. One Rust module is generated per model.
   * 
   * @param input
   * @param outputDirectory
   * @param options 
   */
  public async generateToFiles(input: CommonInputModel | Record<string, unknown>, outputDirectory: string, options: RustRenderCompleteModelOptions): Promise<OutputModel[]> {
    let generatedModels = await this.generateCompleteModels(input, options);
    generatedModels = generatedModels.filter(outputModel => { return outputModel.modelName !== undefined && outputModel.modelName !== ''; });
    for (const outputModel of generatedModels) {
      const filePath = path.resolve(outputDirectory, `${outputModel.modelName}.rs`);
      await FileHelpers.writerToFileSystem(outputModel.result, filePath);
    }
    return generatedModels;
  }
}
