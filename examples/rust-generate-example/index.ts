import { RustFileGenerator, RustRenderCompleteModelOptions } from '../../src';
import * as path from 'path';
const AsyncAPIDocument = {
  asyncapi: '2.4.0',
  info: {
    title: 'example',
    version: '0.1.0'
  },
  channels: {
    '/test': {
      subscribe: {
        message: {
          payload: {
            $schema: 'http://json-schema.org/draft-07/schema#',
            $id: 'Customer',
            type: 'object',
            additionalProperties: false,
            properties: {
              email: {
                type: 'string',
                format: 'email'
              },
              settings: {
                $ref: '#/components/schemas/Settings'
              }
            },
          }
        }
      }
    }
  },
  components: {
    schemas: {
      Settings: {
        $id: '#/components/schemas/Settings',
        $schema: 'http://json-schema.org/draft-07/schema#',
        type: 'object',
        additionalProperties: false,
        properties: {
          cities: {
            $id: 'cities',
            type: 'string',
            enum: ['London', 'Rome', 'Brussels'],
          },
          click_options: {
            $id: 'click_options',
            type: 'string',
            enum: ['click_and_play', 'click&pay'],
          },
          options: {
            $id: 'options',
            type: 'integer',
            enum: ['first_option', 'second_option'],
          },
          example_nested_object: {
            $id: 'ExampleNestedObjects',
            type: 'object',
            properties: {
              street_name: { type: 'string' },
            },
          },
          example_tuple_type: { type: 'array', items: [{ type: 'string' }, { type: 'number' }] },
        }
      }
    }
  }
};

export async function generate(): Promise<void> {
  const generator = new RustFileGenerator();
  const outDir = path.join(__dirname, "output");
  const renderModelOptions: RustRenderCompleteModelOptions = { packageName: 'rust-generate-example' };
  const models = await generator.generateToFiles(AsyncAPIDocument, outDir, renderModelOptions);
  for (const model of models) {
    console.log(model.result);
  }
}
generate();
