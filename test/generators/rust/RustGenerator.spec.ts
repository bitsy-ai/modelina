import { RustGenerator } from '../../../src/generators';

describe('RustGenerator', () => {
  let generator: RustGenerator;
  beforeEach(() => {
    generator = new RustGenerator();
  });

  it('shoud return true if the word is a reserved keyword', () => {
    expect(generator.reservedRustKeyword('as')).toBe(true);
    expect(generator.reservedRustKeyword('async')).toBe(true);
    expect(generator.reservedRustKeyword('await')).toBe(true);
    expect(generator.reservedRustKeyword('break')).toBe(true);
    expect(generator.reservedRustKeyword('const')).toBe(true);
    expect(generator.reservedRustKeyword('continue')).toBe(true);
    expect(generator.reservedRustKeyword('crate')).toBe(true);
    expect(generator.reservedRustKeyword('dyn')).toBe(true);
    expect(generator.reservedRustKeyword('else')).toBe(true);
    expect(generator.reservedRustKeyword('enum')).toBe(true);
    expect(generator.reservedRustKeyword('extern')).toBe(true);
    expect(generator.reservedRustKeyword('false')).toBe(true);
    expect(generator.reservedRustKeyword('fn')).toBe(true);
    expect(generator.reservedRustKeyword('for')).toBe(true);
    expect(generator.reservedRustKeyword('if')).toBe(true);
    expect(generator.reservedRustKeyword('impl')).toBe(true);
    expect(generator.reservedRustKeyword('in')).toBe(true);
    expect(generator.reservedRustKeyword('let')).toBe(true);
    expect(generator.reservedRustKeyword('loop')).toBe(true);
    expect(generator.reservedRustKeyword('match')).toBe(true);
    expect(generator.reservedRustKeyword('mod')).toBe(true);
    expect(generator.reservedRustKeyword('move')).toBe(true);
    expect(generator.reservedRustKeyword('mut')).toBe(true);
    expect(generator.reservedRustKeyword('pub')).toBe(true);
    expect(generator.reservedRustKeyword('ref')).toBe(true);
    expect(generator.reservedRustKeyword('return')).toBe(true);
    expect(generator.reservedRustKeyword('self')).toBe(true);
    expect(generator.reservedRustKeyword('Self')).toBe(true);
    expect(generator.reservedRustKeyword('static')).toBe(true);
    expect(generator.reservedRustKeyword('struct')).toBe(true);
    expect(generator.reservedRustKeyword('super')).toBe(true);
    expect(generator.reservedRustKeyword('trait')).toBe(true);
    expect(generator.reservedRustKeyword('true')).toBe(true);
    expect(generator.reservedRustKeyword('try')).toBe(true);
    expect(generator.reservedRustKeyword('type')).toBe(true);
    expect(generator.reservedRustKeyword('unsafe')).toBe(true);
    expect(generator.reservedRustKeyword('use')).toBe(true);
    expect(generator.reservedRustKeyword('where')).toBe(true);
    expect(generator.reservedRustKeyword('while')).toBe(true);
    expect(generator.reservedRustKeyword('union')).toBe(true);
    expect(generator.reservedRustKeyword('\'static')).toBe(true);
    expect(generator.reservedRustKeyword('macro_rules')).toBe(true);
    expect(generator.reservedRustKeyword('abstract')).toBe(true);
    expect(generator.reservedRustKeyword('become')).toBe(true);
    expect(generator.reservedRustKeyword('box')).toBe(true);
    expect(generator.reservedRustKeyword('do')).toBe(true);
    expect(generator.reservedRustKeyword('final')).toBe(true);
    expect(generator.reservedRustKeyword('macro')).toBe(true);
    expect(generator.reservedRustKeyword('override')).toBe(true);
    expect(generator.reservedRustKeyword('priv')).toBe(true);
    expect(generator.reservedRustKeyword('typeof')).toBe(true);
    expect(generator.reservedRustKeyword('unsized')).toBe(true);
    expect(generator.reservedRustKeyword('yield')).toBe(true);
  });

  it('should return false if the word is not a reserved keyword', () => {
    expect(generator.reservedRustKeyword('dinosaur')).toBe(false);
    expect(generator.reservedRustKeyword('class')).toBe(false);
  });
  test('serde should perserve original field name/case', async () => {
    const doc = {
      $id: '_address',
      type: 'object',
      properties: {
        // field is intentionally camel-cased here
        streetName: { type: 'string' },
      },
      required: ['streetName'],
      additionalProperties: false
    };

    // struct is expected to have snake-cased fields, but serde macro should provide rename=camelCase 
    const expected = `// Address represents a Address model.
#[derive(Clone, Debug, PartialEq, Default, Serialize, Deserialize)]
pub struct Address {
  #[serde(rename = "streetName")]
  pub street_name: String,
}`;
    const inputModel = await generator.process(doc);
    const model = inputModel.models['_address'];

    let structModel = await generator.renderStruct(model, inputModel);
    expect(structModel.result).toEqual(expected);
    expect(structModel.dependencies).toEqual([]);

    structModel = await generator.render(model, inputModel);
    expect(structModel.result).toEqual(expected);
    expect(structModel.dependencies).toEqual([]);
  });
  test('should render `struct` with uniform array types', async () => {
    const doc = {
      $id: '_address',
      type: 'object',
      properties: {
        street_name: { type: 'string' },
        city: { type: 'string', description: 'City description' },
        state: { type: 'string' },
        house_number: { type: 'number' },
        array_type: { type: 'array', items: { type: 'string' } },
      },
      required: ['street_name', 'city', 'state', 'house_number', 'array_type'],
      additionalProperties: {
        type: 'string'
      },
      patternProperties: {
        '^S(.?*)test&': {
          type: 'string'
        }
      },
    };
    const expected = `// Address represents a Address model.
#[derive(Clone, Debug, PartialEq, Default, Serialize, Deserialize)]
pub struct Address {
  #[serde(rename = "street_name")]
  pub street_name: String,
  #[serde(rename = "city")]
  pub city: String,
  #[serde(rename = "state")]
  pub state: String,
  #[serde(rename = "house_number")]
  pub house_number: f64,
  #[serde(rename = "array_type")]
  pub array_type: Vec<String>,
  #[serde(rename = "additionalProperties")]
  pub additional_properties: HashMap<String, String>,
  #[serde(rename = "^S(.?*)test&PatternProperties")]
  pub s_test_pattern_properties: HashMap<String, String>,
}`;

    const inputModel = await generator.process(doc);
    const model = inputModel.models['_address'];

    let structModel = await generator.renderStruct(model, inputModel);
    expect(structModel.result).toEqual(expected);
    expect(structModel.dependencies).toEqual([]);

    structModel = await generator.render(model, inputModel);
    expect(structModel.result).toEqual(expected);
    expect(structModel.dependencies).toEqual([]);
  });
  test('should render `struct` with anonymous tuple dependency', async () => {
    const doc = {
      $id: '_address',
      type: 'object',
      properties: {
        street_name: { type: 'string' },
        tuple_type: { type: 'array', items: [{ type: 'string' }, { type: 'number' }] },
      },
      required: ['street_name'],
      additionalProperties: false
    };
    const expectedStruct = `// Address represents a Address model.
#[derive(Clone, Debug, PartialEq, Default, Serialize, Deserialize)]
pub struct Address {
  #[serde(rename = "street_name")]
  pub street_name: String,
  #[serde(rename = "tuple_type", skip_serializing_if = "Option::is_none")]
  pub tuple_type: Option<Box<AddressTupleType>>,
}`;

    const expectedModule = `// AddressTupleType represents field tuple_type from _address model.
#[derive(Clone, Debug, PartialEq, Default, Serialize, Deserialize)]
pub struct AddressTupleType(String, f64);

// Address represents a Address model.
#[derive(Clone, Debug, PartialEq, Default, Serialize, Deserialize)]
pub struct Address {
  #[serde(rename = "street_name")]
  pub street_name: String,
  #[serde(rename = "tuple_type", skip_serializing_if = "Option::is_none")]
  pub tuple_type: Option<Box<AddressTupleType>>,
}`;

    const inputModel = await generator.process(doc);
    const model = inputModel.models['_address'];

    const structModel = await generator.renderStruct(model, inputModel);
    expect(structModel.result).toEqual(expectedStruct);
    expect(structModel.dependencies).toEqual(['AddressTupleType']);

    const module = await generator.renderCompleteModel(model, inputModel);
    expect(module.result).toEqual(expectedModule);
  });

  test('should render `enum` where members are same type', async () => {
    const doc = {
      $id: 'States',
      type: 'string',
      enum: ['Texas', 'Alabama', 'California'],
    };

    const inputModel = await generator.process(doc);
    const model = inputModel.models['States'];

    const expected = `States enum (type: String)
#[derive(Clone, Copy, Debug, Eq, PartialEq, Ord, PartialOrd, Hash, Serialize, Deserialize)]
pub enum States {
  #[serde(rename = "Texas")]
  Texas,
  #[serde(rename = "Alabama")]
  Alabama,
  #[serde(rename = "California")]
  California,
}`;
    const enumModel = await generator.renderEnum(model, inputModel);
    expect(enumModel.result).toEqual(expected);
    expect(enumModel.dependencies).toEqual([]);
  });

  test('should render `enum` where members are different types', async () => {
    const doc = {
      $id: 'States',
      type: 'string',
      enum: ['Texas', 1, '1', false, { test: 'test' }],
    };

    const inputModel = await generator.process(doc);
    const model = inputModel.models['States'];

    const expected = `States enum (type: String)
#[derive(Clone, Copy, Debug, Eq, PartialEq, Ord, PartialOrd, Hash, Serialize, Deserialize)]
pub enum States {
  #[serde(rename = "0")]
  Texas(String),
  #[serde(rename = "1")]
  F64(f64),
  #[serde(rename = "2")]
  1(String),
  #[serde(rename = "3")]
  Bool(bool),
  #[serde(rename = "4")]
  HashMap(HashMap<String,String>)
}`;
    const enumModel = await generator.renderEnum(model, inputModel);
    expect(enumModel.result).toEqual(expected);
    expect(enumModel.dependencies).toEqual([]);
  });
});
