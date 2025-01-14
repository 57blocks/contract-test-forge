import * as fs from "fs";
import * as path from "path";
import { GeneratedTest } from "../types";

export class FileManager {
  private buildDir: string;

  constructor(ctfPath: string) {
    this.buildDir = path.join(ctfPath, "build");
    this.ensureBuildDir();
  }

  private ensureBuildDir(): void {
    if (!fs.existsSync(this.buildDir)) {
      fs.mkdirSync(this.buildDir, { recursive: true });
    }
  }

  public saveGeneratedTests(
    contractName: string,
    tests: GeneratedTest[]
  ): void {
    const generatedDir = path.join(this.buildDir, "generated");
    if (!fs.existsSync(generatedDir)) {
      fs.mkdirSync(generatedDir);
    }

    tests.forEach((test, index) => {
      const methodName = test.methodName;
      const fileName = `${contractName}_${methodName}.json`;
      fs.writeFileSync(
        path.join(generatedDir, fileName),
        JSON.stringify(test, null, 2)
      );
    });
  }

  public saveMergedTest(contractName: string, mergedCode: string): void {
    const mergedDir = path.join(this.buildDir, "merged");
    if (!fs.existsSync(mergedDir)) {
      fs.mkdirSync(mergedDir);
    }

    fs.writeFileSync(
      path.join(mergedDir, `${contractName}.test.ts`),
      mergedCode
    );
  }
}
