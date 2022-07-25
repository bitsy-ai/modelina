# Rust

<!-- toc is generated with GitHub Actions do not remove toc markers -->

<!-- toc -->

- [Language Features](#language-features)
- [Implement `new`](#implement-new)
- [Implement `default`](#implement-default)
- [Implement `From<String> (serde_json)`](#implement-from_json_string)
- [Implement `Into<String> (serde_json)`](#implement-to_json_stringn)
- [Implement `From<FramedByteStream> (tokio_serde)`](#implement-from-framed-byte-stream)
- [Implement `Into<FramedByteStream> (tokio_serde)`](#implement-into-framed-byte-stream)
<!-- tocstop -->

## Language Features

Generated code depends on the following Cargo features:

- derive
- alloc

## Implement `new`

The RustGenerator outputs a boilerplate `new` implementation for models. You can disable this behavior by passing `RustOptions` with `{ renderInitializer: false }` to `RustGenerator`.

```rust
// DummyInfo represents a DummyInfo model.
#[derive(Clone, Debug, PartialEq, Default, Serialize, Deserialize)]
pub struct DummyInfo {
    #[serde(rename = "prop1")]
    pub prop1: Box<crate::AnonymousSchema6>,
    #[serde(rename = "sentAt", skip_serializing_if = "Option::is_none")]
    pub sent_at: Option<String>,
    #[serde(rename = "additionalProperties", skip_serializing_if = "Option::is_none")]
    pub additional_properties: Option<std::collections::HashMap<String, serde_json::Value>>,
}

impl DummyInfo {
    pub fn new(prop1: crate::AnonymousSchema6) -> DummyInfo {
        DummyInfo {
            prop1: Box::new(prop1),
            sent_at: None,
            additional_properties: None,
        }
    }
}
```

## Implement `default`

The RustGenerator outputs a boilerplate `new` implementation for models. You can disable this behavior by passing `RustOptions` with `{ renderDefault: false }` to `RustGenerator`.

```rust
// DummyArrayValueRank enum of type: [integer,number]
#[derive(Clone, Copy, Debug, Eq, PartialEq, Ord, PartialOrd, Hash, Serialize, Deserialize)]
pub enum DummyArrayValueRank {
    #[serde(rename = "-1")]
    DummyArrayValueRankMinus1,
    #[serde(rename = "0")]
    DummyArrayValueRank0,
    #[serde(rename = "1")]
    DummyArrayValueRank1,
    #[serde(rename = "2")]
    DummyArrayValueRank2,
}
impl Default for DummyArrayValueRank {
    fn default() -> DummyArrayValueRank{
        Self::DummyArrayValueRankMinus1
    }
}
```

## Implement `From<String>` (serde_json)

TODO

## Implement `Into<String>` (serde_json)

TODO

## Implement `From<FramedByteStream>` (tokio_serde)

TODO

## [Implement `From<FramedByteStream>` (tokio_serde)

TOOD