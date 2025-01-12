import * as fs from "fs";
import * as path from "path";
import * as yaml from "js-yaml";
import OpenAI from "openai";
import { TestGenerator, GeneratedTest, AiConfig } from "../types";
import { TEST_GENERATE_SYSTEM_PROMPT, testGeneratePrompt, TEST_MERGE_SYSTEM_PROMPT, testMergePrompt } from "../prompt";
import { CONFIG_AI_FILE_NAME } from "../constants";

export class TestGeneratorService {
  private openai: OpenAI;
  private config: AiConfig;

  constructor(ctfPath: string) {
    const aiConfigPath = path.join(ctfPath, CONFIG_AI_FILE_NAME);
    this.config = this.loadConfig(aiConfigPath);
    if (!this.config.api_key) {
      throw new Error("API key is required, please set it in ai.yaml");
    }
    this.openai = new OpenAI({
      apiKey: this.config.api_key,
    });
  }

  private loadConfig(configPath: string): AiConfig {
    try {
      return yaml.load(fs.readFileSync(configPath, "utf-8")) as AiConfig;
    } catch (error) {
      throw new Error("Failed to load AI configuration");
    }
  }

  async generateTest(data: TestGenerator): Promise<GeneratedTest> {
    const prompt = testGeneratePrompt(data);

    try {
      const completion = await this.openai.chat.completions.create({
        model: this.config.model,
        messages: [
          {
            role: "system",
            content: TEST_GENERATE_SYSTEM_PROMPT,
          },
          {
            role: "user",
            content: prompt,
          },
        ],
      });

      const response = completion.choices[0]?.message?.content || "";
      return this.parseTestResponse(response);
    } catch (error) {
      throw new Error(`Failed to generate test: ${error}`);
    }
  }

  private parseTestResponse(response: string): GeneratedTest {
    try {
      return JSON.parse(response) as GeneratedTest;
    } catch (error) {
      console.error("Failed to parse test response:", error);
      console.error("Response:", response);
      throw error;
    }
  }

  public async writeTestFile(
    testDir: string,
    contractFile: string,
    tests: GeneratedTest[]
  ): Promise<void> {
    const contractName = path.basename(contractFile, path.extname(contractFile));
    const testFilePath = path.join(testDir, `${contractName}.test.ts`);

    const mergedTest = await this.mergeTests(contractName, tests);
    const testContent = this.formatTestContent(mergedTest);
    fs.writeFileSync(testFilePath, testContent);
  }

  private async mergeTests(
    contractName: string,
    tests: GeneratedTest[]
  ): Promise<GeneratedTest> {
    try {
      const completion = await this.openai.chat.completions.create({
        model: this.config.model,
        messages: [
          {
            role: "system",
            content: TEST_MERGE_SYSTEM_PROMPT,
          },
          {
            role: "user",
            content: testMergePrompt(contractName, tests),
          },
        ],
      });

      const response = completion.choices[0]?.message?.content || "";
      return this.parseTestResponse(response);
    } catch (error) {
      console.error("Failed to merge tests:", error);
      return this.fallbackMergeTests(tests);
    }
  }

  private fallbackMergeTests(tests: GeneratedTest[]): GeneratedTest {
    return {
      imports: Array.from(new Set(tests.flatMap((test) => test.imports))).sort(),
      setupCode: Array.from(new Set(tests.map((test) => test.setupCode))).join("\n\n"),
      testCases: tests.map((test) => test.testCases).join("\n\n"),
    };
  }

  private formatTestContent(test: GeneratedTest): string {
    return `
${test.imports.join("\n")}

${test.setupCode}

${test.testCases}
`.trim();
  }
}
