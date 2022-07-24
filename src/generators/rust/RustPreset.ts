/* eslint-disable @typescript-eslint/ban-types */
import { Preset, PresetArgs, EnumPreset, CommonModel, CommonPreset } from '../../models';
import { AbstractRenderer } from '../AbstractRenderer';

import { EnumRenderer, RUST_DEFAULT_ENUM_PRESET } from './renderers/EnumRenderer';
import { StructRenderer, RUST_DEFAULT_STRUCT_PRESET } from './renderers/StructRenderer';
import { TupleRenderer, RUST_DEFAULT_TUPLE_PRESET } from './renderers/TupleRenderer';
import { PackageRenderer, RUST_DEFAULT_PACKAGE_PRESET } from './renderers/PackageRenderer';

export enum FieldType {
    field,
    additionalProperty,
    patternProperties,
}
export interface FieldArgs {
    fieldName: string;
    field: CommonModel;
    type: FieldType;
    required: boolean
}

export interface TupleArgs {
    fieldName: string;
    originalFieldName: String;
    field: CommonModel;
    parent: CommonModel;
}

export interface RustManifestArgs {
    authors: string[];
    description: string;
    edition: string;
    homepage: string;
    license: string;
    packageName: string;
    packageVersion: string;
    repository: string;
}

export interface RustLibArgs {
    modelNames: string[];
}

export interface StructPreset<R extends AbstractRenderer, O extends object = any> extends CommonPreset<R, O> {
    field?: (args: PresetArgs<R, O> & FieldArgs) => Promise<string> | string;
}

export interface TuplePreset<R extends AbstractRenderer, O extends object = any> extends CommonPreset<R, O> {
    tuple?: (args: PresetArgs<R, O> & TupleArgs) => Promise<string> | string;
}

export interface PackagePreset<R extends AbstractRenderer, O extends object = any> extends CommonPreset<R, O> {
    manifest?: (args: PresetArgs<R, O> & RustManifestArgs) => Promise<string> | string;
    lib?: (args: PresetArgs<R, O> & RustLibArgs) => Promise<string> | string;
}

export type RustPreset<O extends object = any> = Preset<{
    struct: StructPreset<StructRenderer, O>;
    tuple: TuplePreset<TupleRenderer, O>;
    enum: EnumPreset<EnumRenderer, O>;
    package: PackagePreset<PackageRenderer, O>;
}>;

export const RUST_DEFAULT_PRESET: RustPreset = {
  struct: RUST_DEFAULT_STRUCT_PRESET,
  tuple: RUST_DEFAULT_TUPLE_PRESET,
  enum: RUST_DEFAULT_ENUM_PRESET,
  package: RUST_DEFAULT_PACKAGE_PRESET
};
