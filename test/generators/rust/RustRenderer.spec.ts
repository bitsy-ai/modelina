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
      expect(renderer.renderType(CommonModel.toCommonModel({ type: 'int32' }), '', false)).toEqual('Option<i32>');
      expect(renderer.renderType(CommonModel.toCommonModel({ type: 'integer' }), '', false)).toEqual('Option<i32>');
    });
    test('Should render required integer as i32 type', () => {
      expect(renderer.renderType(CommonModel.toCommonModel({ type: 'int32' }), '', true)).toEqual('i32');
      expect(renderer.renderType(CommonModel.toCommonModel({ type: 'integer' }), '', true)).toEqual('i32');
    });
    test('Should render optional long as Option<i64> type', () => {
      expect(renderer.renderType(CommonModel.toCommonModel({ type: 'int64' }), '', false)).toEqual('Option<i64>');
      expect(renderer.renderType(CommonModel.toCommonModel({ type: 'long' }), '', false)).toEqual('Option<i64>');
    });
    test('Should render required long as i64 type', () => {
      expect(renderer.renderType(CommonModel.toCommonModel({ type: 'int64' }), '', true)).toEqual('i64');
      expect(renderer.renderType(CommonModel.toCommonModel({ type: 'long' }), '', true)).toEqual('i64');
    });
    test('Should render optional number as Option<f64> type', () => {
      expect(renderer.renderType(CommonModel.toCommonModel({ type: 'number' }), '', false)).toEqual('Option<f64>');
    });
    test('Should render required number as f64 type', () => {
      expect(renderer.renderType(CommonModel.toCommonModel({ type: 'number' }), '', true)).toEqual('f64');
    });
    test('Should render optional string as Option<String> type', () => {
      expect(renderer.renderType(CommonModel.toCommonModel({ type: 'string' }), '', false)).toEqual('Option<String>');
    });
    test('Should render required string as String type', () => {
      expect(renderer.renderType(CommonModel.toCommonModel({ type: 'string' }), '', true)).toEqual('String');
    });
    test('Should render optional boolean as Option<bool> type', () => {
      expect(renderer.renderType(CommonModel.toCommonModel({ type: 'boolean' }), '', false)).toEqual('Option<bool>');
    });
    test('Should render required boolean as bool type', () => {
      expect(renderer.renderType(CommonModel.toCommonModel({ type: 'boolean' }), '', true)).toEqual('bool');
    });
    test('Should render optional uniform array as Option<Vec<T>>', () => {
      const model = CommonModel.toCommonModel({
        type: 'array',
        items: {
          type: 'string'
        },
      });
      expect(renderer.renderType(model, '', false)).toEqual('Option<Vec<String>>');
    });
    test('Should render required uniform array as Vec<T>', () => {
      const model = CommonModel.toCommonModel({
        type: 'array',
        items: {
          type: 'string'
        },
      });
      expect(renderer.renderType(model, '', true)).toEqual('Vec<String>');
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
      expect(renderer.renderType(model, 'labeled_coordinates', false)).toEqual('Option<Box<PlayerLabeledCoordinates>>');
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
      expect(renderer.renderType(model, 'labeled_coordinates', true)).toEqual('Box<PlayerLabeledCoordinates>');
    });

    test('Should render optional boxed ref in PascalCase', () => {
      const model = CommonModel.toCommonModel({
        $ref: '<anonymous-schema-1>'
      });
      expect(renderer.renderType(model, '', false)).toEqual('Option<Box<crate::AnonymousSchema1>>');
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
      expect(renderer.renderType(model, 'anonymousObject', true)).toEqual('Box<crate::AnonymousObject>');
    });

    test('Should render $ref with $id as reference to imported model', () => {
      const model = CommonModel.toCommonModel({
        $id: 'MyModel',
        type: 'object',
        properties: {
          Person: {
            $id: 'Person',
            type: 'object',
            description: 'An object without a $ref to a component schema',
            properties: {
              street_name: { type: 'string' },
            }
          }
        },
        additionalProperties: false
      });
      expect(renderer.renderType(model, 'Person', true)).toEqual('Box<crate::Person>');
    });
  });
});
