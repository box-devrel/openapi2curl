openapi2curl
============

Convert OpenAPI 3.0 to simple cURL examples.

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/openapi2curl.svg)](https://npmjs.org/package/openapi2curl)
[![Downloads/week](https://img.shields.io/npm/dw/openapi2curl.svg)](https://npmjs.org/package/openapi2curl)
[![License](https://img.shields.io/npm/l/openapi2curl.svg)](https://github.com/box-devrel/openapi2curl/blob/master/package.json)

# Installation

```bash
npm install -g openapi2curl
```

# Usage

```bash
USAGE
  $ openapi2curl

OPTIONS
  -h, --help           show CLI help
  -i, --input=input    (required) the input OpenAPI 3.X file
  -o, --output=output  [default: curl.md] the output file to write samples to
  -v, --version        show CLI version
  -x, --hiddenTag      Embed the operateionIDs as hidden comments in the markdown
```

## Examples

Loading from a remote URL:

```bash
openapi2curl -i https://opensource.box.com/box-openapi/openapi.json -o README.md
```

Loading from a local URL:

```bash
openapi2curl -i ./openapi.json -o CURL.md
```

# Limitations

* This project is currently mostly untested. 
* It only works with OpenAPI 3.0 JSON files.
* It does not support splitting the docs into multiple files
* It still has issues with rendering binary content in the request body
