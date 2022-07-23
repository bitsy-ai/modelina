import { CommonInputModel, CommonModel, RustGenerator } from '../../../src';
import { RustRenderer, RustRenderFieldTypeOptions } from '../../../src/generators/rust/RustRenderer';

class MockRustRenderer extends RustRenderer {

}
describe('RustRenderer', () => {
  let renderer: RustRenderer;
  beforeEach(() => {
    renderer = new MockRustRenderer(RustGenerator.defaultOptions, new RustGenerator(), [], new CommonModel(), new CommonInputModel());
  });

  describe('renderType', () => {
    test('Should render optional integer as Option<i32> type', () => {
      expect(renderer.renderType(CommonModel.toCommonModel({ type: 'int32' }), { originalFieldName: '', required: false } as RustRenderFieldTypeOptions)).toEqual('Option<i32>');
      expect(renderer.renderType(CommonModel.toCommonModel({ type: 'integer' }), { originalFieldName: '', required: false } as RustRenderFieldTypeOptions)).toEqual('Option<i32>');
    });
    test('Should render required integer as i32 type', () => {
      expect(renderer.renderType(CommonModel.toCommonModel({ type: 'int32' }), { originalFieldName: '', required: true } as RustRenderFieldTypeOptions)).toEqual('i32');
      expect(renderer.renderType(CommonModel.toCommonModel({ type: 'integer' }), { originalFieldName: '', required: true } as RustRenderFieldTypeOptions)).toEqual('i32');
    });
    test('Should render optional long as Option<i64> type', () => {
      expect(renderer.renderType(CommonModel.toCommonModel({ type: 'int64' }), { originalFieldName: '', required: false } as RustRenderFieldTypeOptions)).toEqual('Option<i64>');
      expect(renderer.renderType(CommonModel.toCommonModel({ type: 'long' }), { originalFieldName: '', required: false } as RustRenderFieldTypeOptions)).toEqual('Option<i64>');
    });
    test('Should render required long as i64 type', () => {
      expect(renderer.renderType(CommonModel.toCommonModel({ type: 'int64' }), { originalFieldName: '', required: true } as RustRenderFieldTypeOptions)).toEqual('i64');
      expect(renderer.renderType(CommonModel.toCommonModel({ type: 'long' }), { originalFieldName: '', required: true } as RustRenderFieldTypeOptions)).toEqual('i64');
    });
    test('Should render optional number as Option<f64> type', () => {
      expect(renderer.renderType(CommonModel.toCommonModel({ type: 'number' }), { originalFieldName: '', required: false } as RustRenderFieldTypeOptions)).toEqual('Option<f64>');
    });
    test('Should render required number as f64 type', () => {
      expect(renderer.renderType(CommonModel.toCommonModel({ type: 'number' }), { originalFieldName: '', required: true } as RustRenderFieldTypeOptions)).toEqual('f64');
    });
    test('Should render optional string as Option<String> type', () => {
      expect(renderer.renderType(CommonModel.toCommonModel({ type: 'string' }), { originalFieldName: '', required: false } as RustRenderFieldTypeOptions)).toEqual('Option<String>');
    });
    test('Should render required string as String type', () => {
      expect(renderer.renderType(CommonModel.toCommonModel({ type: 'string' }), { originalFieldName: '', required: true } as RustRenderFieldTypeOptions)).toEqual('String');
    });
    test('Should render optional boolean as Option<bool> type', () => {
      expect(renderer.renderType(CommonModel.toCommonModel({ type: 'boolean' }), { originalFieldName: '', required: false } as RustRenderFieldTypeOptions)).toEqual('Option<bool>');
    });
    test('Should render required boolean as bool type', () => {
      expect(renderer.renderType(CommonModel.toCommonModel({ type: 'boolean' }), { originalFieldName: '', required: true } as RustRenderFieldTypeOptions)).toEqual('bool');
    });
    test('Should render optional uniform array as Option<Vec<T>>', () => {
      const model = CommonModel.toCommonModel({
        type: 'array',
        items: {
          type: 'string'
        },
      });
      expect(renderer.renderType(model, { originalFieldName: '', required: false } as RustRenderFieldTypeOptions)).toEqual('Option<Vec<String>>');
    });
    test('Should render required uniform array as Vec<T>', () => {
      const model = CommonModel.toCommonModel({
        type: 'array',
        items: {
          type: 'string'
        },
      });
      expect(renderer.renderType(model, { originalFieldName: '', required: true } as RustRenderFieldTypeOptions)).toEqual('Vec<String>');
    });
    test('Should render optional boxed named struct for anonymous tuple', () => {
      // 
      const parent = CommonModel.toCommonModel({
        $id: 'player',
        properties: {
          labeled_coordinates: {
            type: 'array',
            items: [
              {
                type: 'string'
              },
              {
                type: 'number'
              },
              {
                type: 'number'
              }
            ]

          }
        },
      });
      renderer = new MockRustRenderer(RustGenerator.defaultOptions, new RustGenerator(), [], parent, new CommonInputModel());
      const model = CommonModel.toCommonModel({
        type: 'array',
        items: [
          {
            type: 'string'
          },
          {
            type: 'number'
          },
          {
            type: 'number'
          }
        ]
      });
      expect(renderer.renderType(model, { originalFieldName: 'labeled_coordinates', required: false, } as RustRenderFieldTypeOptions)).toEqual('Option<Box<PlayerLabeledCoordinates>>');
    });
    test('Should render required boxed named struct for anonymous tuple', () => {
      // 
      const parent = CommonModel.toCommonModel({
        $id: 'player',
        properties: {
          labeled_coordinates: {
            type: 'array',
            items: [
              {
                type: 'string'
              },
              {
                type: 'number'
              },
              {
                type: 'number'
              }
            ]

          }
        },
      });
      renderer = new MockRustRenderer(RustGenerator.defaultOptions, new RustGenerator(), [], parent, new CommonInputModel());
      const model = CommonModel.toCommonModel({
        type: 'array',
        items: [
          {
            type: 'string'
          },
          {
            type: 'number'
          },
          {
            type: 'number'
          }
        ]
      });
      expect(renderer.renderType(model, { originalFieldName: 'labeled_coordinates', required: true, } as RustRenderFieldTypeOptions)).toEqual('Box<PlayerLabeledCoordinates>');
    });

    test('Should render optional boxed ref in PascalCase', () => {
      const model = CommonModel.toCommonModel({
        $ref: '<anonymous-schema-1>'
      });
      expect(renderer.renderType(model, { originalFieldName: '', required: false, } as RustRenderFieldTypeOptions)).toEqual('Option<Box<crate::models::AnonymousSchema1>>');
    });
    test('Should render required boxed ref in PascalCase', () => {
      const model = CommonModel.toCommonModel({
        $ref: '<anonymous-schema-1>'
      });
      expect(renderer.renderType(model, { originalFieldName: '', required: true, } as RustRenderFieldTypeOptions)).toEqual('Box<crate::models::AnonymousSchema1>');
    });
    test('Should render anonymous object as boxed ref to struct in the same module', () => {
      const model = CommonModel.toCommonModel({
        $id: 'MyModel',
        type: 'object',
        properties: {
          anonymousObject: {
            type: 'object',
            description: 'An object without a $ref to a component schema',
            properties: {
              street_name: { type: 'string' },
            }
          }
        }
      });
      expect(renderer.renderType(model, { originalFieldName: 'anonymousObject', required: true, })).toEqual('Box<AnonymousObject>');
    });
  });
});
