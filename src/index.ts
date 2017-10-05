import * as path from "path";
import { ParseConfig, RawTsExtractorConfig } from "./contracts/config";
import { ReadPackageJson } from "./utils/package-json";
import { GetCompilerOptions } from "./utils/tsconfig-json";

import { Extractor } from "./extractor";

const config = ParseConfig({
    projectPath: "examples/simple"
} as RawTsExtractorConfig);

async function main(): Promise<void> {
    const packageJson = await ReadPackageJson(config.packageJsonPath);
    const compilerOptions = await GetCompilerOptions(config.tsConfigPath);

    // console.info(packageJson);
    // console.info(compilerOptions);

    const extractor = new Extractor({
        compilerOptions: compilerOptions
    });

    const extract = extractor.Extract([path.resolve("examples/simple/index.ts")]);
    console.log(JSON.stringify(extract));
}

main();
