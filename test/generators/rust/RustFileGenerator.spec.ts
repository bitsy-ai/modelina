import * as path from 'path';
import { RustFileGenerator, FileHelpers, RustRenderCompleteModelOptions, OutputModel, CommonInputModel, CommonModel } from '../../../src';
describe('TypeScriptFileGenerator', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('generateToFile()', () => {
    const doc = {
      $id: 'CustomClass',
      type: 'object',
      additionalProperties: true,
      properties: {
        someProp: { type: 'string' },
        someEnum: {
          $id: 'CustomEnum',
          type: 'string',
          enum: ['Texas', 'Alabama', 'California'],
        },
        street_name: { type: 'string' },
        city: { type: 'string', description: 'City description' },
        state: { type: 'string' },
        house_number: { type: 'number' },
        members: { oneOf: [{ type: 'string' }, { type: 'number' }, { type: 'boolean' }], },
        array_type: { type: 'array', items: { type: 'string' } },
        required: ['street_name', 'city', 'state', 'house_number', 'array_type'],
      }
    };
    const renderModelOptions: RustRenderCompleteModelOptions = { packageName: 'my-test-package' };
    test('should throw accurate error if file cannot be written', async () => {
      const generator = new RustFileGenerator();
      const expectedError = new Error('write error');
      jest.spyOn(FileHelpers, 'writerToFileSystem').mockRejectedValue(expectedError);
      jest.spyOn(generator, 'generateCompleteModels').mockResolvedValue([new OutputModel('content', new CommonModel(), 'Test', new CommonInputModel(), [])]);

      await expect(generator.generateToFiles(doc, '/test/', renderModelOptions)).rejects.toEqual(expectedError);
      expect(generator.generateCompleteModels).toHaveBeenCalledTimes(1);
      expect(FileHelpers.writerToFileSystem).toHaveBeenCalledTimes(1);
    });
    test('should try and generate models to files', async () => {
      const generator = new RustFileGenerator();
      const outputDir = './test';
      const expectedOutputDirPath = path.resolve(outputDir);
      const expectedOutputFilePath = path.resolve(`${outputDir}/Test.rs`);
      const expectedWriteToFileParameters = [
        'content',
        expectedOutputFilePath,
      ];
      jest.spyOn(FileHelpers, 'writerToFileSystem').mockResolvedValue(undefined);
      jest.spyOn(generator, 'generateCompleteModels').mockResolvedValue([new OutputModel('content', new CommonModel(), 'Test', new CommonInputModel(), [])]);

      await generator.generateToFiles(doc, expectedOutputDirPath, renderModelOptions);
      expect(generator.generateCompleteModels).toHaveBeenCalledTimes(1);
      expect(FileHelpers.writerToFileSystem).toHaveBeenCalledTimes(1);
      expect((FileHelpers.writerToFileSystem as jest.Mock).mock.calls[0]).toEqual(expectedWriteToFileParameters);
    });

    test('should ignore models that have not been rendered', async () => {
      const generator = new RustFileGenerator();
      const outputDir = './test';
      const expectedOutputDirPath = path.resolve(outputDir);
      jest.spyOn(FileHelpers, 'writerToFileSystem').mockResolvedValue(undefined);
      jest.spyOn(generator, 'generateCompleteModels').mockResolvedValue([new OutputModel('content', new CommonModel(), '', new CommonInputModel(), [])]);

      const models = await generator.generateToFiles(doc, expectedOutputDirPath, renderModelOptions);
      expect(generator.generateCompleteModels).toHaveBeenCalledTimes(1);
      expect(FileHelpers.writerToFileSystem).toHaveBeenCalledTimes(0);
      expect(models).toHaveLength(0);
    });
  });
});