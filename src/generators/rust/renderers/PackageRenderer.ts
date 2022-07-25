import { RustRenderer } from '../RustRenderer';
import { PackagePreset } from '../RustPreset';
/**
 * Renderer for Rust's supporting files
 * 
 * @extends RustRenderer
 */
export class PackageRenderer extends RustRenderer {
  public defaultSelf(): string {
    return '';
  }
}

export const RUST_DEFAULT_PACKAGE_PRESET: PackagePreset<PackageRenderer> = {
  self({ renderer }) {
    return renderer.defaultSelf();
  },

  lib({ modelNames, renderer }) {
    const imports = renderer.renderBlock(modelNames.map(model => {
      const mod = renderer.nameModule(model);
      return `
pub mod ${mod};
pub use self::${mod}::*;`;
    }).flat());

    return `#[macro_use]
extern crate serde;
extern crate serde_json;
${imports}`;
  },

  manifest({ packageName, packageVersion, homepage, authors, repository, description, license, edition }) {
    const authorsString = authors.map((a: string) => `"${a}"`).join(',');
    return `[package]
name = "${packageName}"
version = "${packageVersion}"
authors = [${authorsString}]
homepage = "${homepage}"
repository = "${repository}"
license = "${license}"
description = "${description}"
edition = "${edition}"

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
};
