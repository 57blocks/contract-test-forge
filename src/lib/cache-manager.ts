import * as fs from "fs";
import * as path from "path";
import { TestAnalysis } from "../types";

export class CacheManager {
  private cacheDir: string;

  constructor(ctfPath: string) {
    this.cacheDir = path.join(ctfPath, "cache");
    this.ensureCacheDir();
  }

  private ensureCacheDir() {
    if (!fs.existsSync(this.cacheDir)) {
      fs.mkdirSync(this.cacheDir);
    }
  }

  private getCacheFilePath(contractFile: string, methodName: string): string {
    // Remove file extension and create cache file name
    const contractName = path.basename(
      contractFile,
      path.extname(contractFile)
    );
    return path.join(this.cacheDir, `${contractName}-${methodName}.json`);
  }

  public getCache(
    contractFile: string,
    methodName: string
  ): TestAnalysis | null {
    const cacheFile = this.getCacheFilePath(contractFile, methodName);

    if (fs.existsSync(cacheFile)) {
      try {
        const cacheContent = fs.readFileSync(cacheFile, "utf-8");
        return JSON.parse(cacheContent) as TestAnalysis;
      } catch (error) {
        console.warn(`Warning: Failed to read cache for ${methodName}:`, error);
        return null;
      }
    }
    return null;
  }

  public saveCache(
    contractFile: string,
    methodName: string,
    analysis: TestAnalysis
  ): void {
    const cacheFile = this.getCacheFilePath(contractFile, methodName);
    try {
      fs.writeFileSync(cacheFile, JSON.stringify(analysis, null, 2));
    } catch (error) {
      console.warn(`Warning: Failed to save cache for ${methodName}:`, error);
    }
  }
}
