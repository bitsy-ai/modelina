import { defaultRustOptions, RustFileGenerator } from '../../src';
import * as path from 'path';

import asyncApiSchema from '../../test/blackbox/docs/AsyncAPI-2_4/dummy.json';

export async function generate(): Promise<void> {
  const generator = new RustFileGenerator();
  const outDir = path.join(__dirname, 'output');
  const inputModel = await generator.process(asyncApiSchema);
  const models = await generator.generateToFiles(inputModel, outDir, defaultRustOptions);
  for (const model of models) {
    console.log(model.result);
  }
}
if (require.main === module) {
  generate();
}
