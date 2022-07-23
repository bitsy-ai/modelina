import { RustGenerator } from '../../src';

const generator = new RustGenerator();
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
        }
      }
    }
  }
};

export async function generate(): Promise<void> {
  const models = await generator.generate(AsyncAPIDocument);
  for (const model of models) {
    console.log(model.result);
  }
}
generate();
