/* eslint-disable sonarjs/no-nested-template-literals */
import * as path from 'path';
import { snakeCase } from 'change-case';
import { AbstractFileGenerator } from 'generators/AbstractFileGenerator';
import { CommonInputModel, OutputModel } from '../../models';
import { RustGenerator, RustRenderCompleteModelOptions } from './RustGenerator';
import { FileHelpers } from '../../helpers';

export class RustFileGenerator extends RustGenerator implements AbstractFileGenerator<RustRenderCompleteModelOptions> {
  renderLibModule(moduleNames: string[]): string {
    const imports = moduleNames.map(model => {
      const mod = snakeCase(model);
      return `
pub mod ${mod};
pub use self::${mod}::*;
`;
    }).flat().join('\n');
    return `#[macro_use]
extern crate serde;
extern crate serde_json;
${imports}`;
  }

  renderManifest(options: RustRenderCompleteModelOptions): string {
    return `[package]
name = "${options.packageName}"
version = "${options.packageVersion}"
authors = [${options.authors.map(a => `"${a}"`).join(',')}]
homepage = "${options.homepage}"
repository = "${options.repository}"
license = "${options.license}"
description = "${options.description}"
edition = "${options.edition}"

[dependencies]
jsonwebtoken = {version="7", optional = true }
serde = { version = "1", features = ["derive"] }
serde_json = { version="1", optional = true }
thiserror = "1"

[dev-dependencies]

[features]
default = ["json", "jwt"]
json = ["dep:serde_json"]
jwt = ["dep:jsonwebtoken"]`;
  }

  public async generateSupportFiles(generatedModels: OutputModel[], outputDirectory: string, options: RustRenderCompleteModelOptions): Promise<void> {
    const manifest = await this.renderManifest(options);
    let filePath = path.resolve(outputDirectory, 'Cargo.toml');
    await FileHelpers.writerToFileSystem(manifest, filePath);

    const libModule = this.renderLibModule(generatedModels.map(x => x.modelName));
    filePath = path.resolve(outputDirectory, 'src/lib.rs');
    await FileHelpers.writerToFileSystem(libModule, filePath);
  }
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
      const filePath = path.resolve(outputDirectory, `src/${outputModel.modelName}.rs`);
      await FileHelpers.writerToFileSystem(outputModel.result, filePath);
    }
    return generatedModels;
  }
}
