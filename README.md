# ts-extractor

[![NPM version](https://img.shields.io/npm/v/ts-extractor.svg)](https://www.npmjs.com/package/ts-extractor)
[![Build Status](https://travis-ci.org/SimplrJS/ts-extractor.svg?branch=master)](https://travis-ci.org/SimplrJS/ts-extractor)
[![Coverage Status](https://coveralls.io/repos/github/SimplrJS/ts-extractor/badge.svg?branch=master)](https://coveralls.io/github/SimplrJS/ts-extractor?branch=master)
[![dependencies Status](https://david-dm.org/SimplrJS/ts-extractor/status.svg)](https://david-dm.org/SimplrJS/ts-extractor)
[![devDependencies Status](https://david-dm.org/SimplrJS/ts-extractor/dev-status.svg)](https://david-dm.org/SimplrJS/ts-extractor?type=dev)
[![devDependencies Status](https://img.shields.io/npm/l/ts-extractor.svg)](https://npmjs.org/package/ts-extractor)

TypeScript AST extractor to useful JSON structure.

The purpose of this package is to extract AST into flat JSON structures.

Later on, it can be used for documentation generation tool, easier code analysis with without compiler, etc.

## Usage example

```ts
import * as path from "path";
import * as process from "process";
import { Extractor, GetCompilerOptions } from "ts-extractor";

async function Main(): Promise<void> {
    // Absolute path to projectDirectory
    const projectDirectory = process.cwd();
    const pathToTsconfig = path.join(projectDirectory, "./tsconfig.json");

    const compilerOptions = await GetCompilerOptions(pathToTsconfig);

    const extractor = new Extractor({
        CompilerOptions: compilerOptions,
        ProjectDirectory: projectDirectory
    });

    const extractedOutput = extractor.Extract(["./src/index.ts", "./src/another-entry-file.ts"]);
    console.log(extractedOutput);
}

Main();
```
