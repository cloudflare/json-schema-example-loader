# JSON Schema Example Loader

[![Build Status](https://travis-ci.org/tajo/json-schema-example-loader.svg?branch=master)](https://travis-ci.org/tajo/json-schema-example-loader)
[![Code Climate](https://codeclimate.com/github/tajo/json-schema-example-loader/badges/gpa.svg)](https://codeclimate.com/github/tajo/json-schema-example-loader)
[![Test Coverage](https://codeclimate.com/github/tajo/json-schema-example-loader/badges/coverage.svg)](https://codeclimate.com/github/tajo/json-schema-example-loader)

Webpack loader that transforms JSON HyperSchema (without $refs) into a new (completely different) datastructure that contains examples and simplified definitions that you can use in order to create nice API docs.

Do you have references ($ref) in your schemas? Use [json-schema-loader](https://www.npmjs.com/package/json-schema-loader) first.
