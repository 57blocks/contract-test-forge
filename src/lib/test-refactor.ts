import * as fs from "fs";
import * as path from "path";
import * as yaml from "js-yaml";
import OpenAI from "openai";
import { AiConfig } from "../types";
import { TEST_REFACTOR_SYSTEM_PROMPT, testRefactorPrompt } from "../prompt";
import { CONFIG_AI_FILE_NAME } from "../constants";

export class TestRefactor {
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

  public async refactorTests(
    contractName: string,
    testCode: string
  ): Promise<string> {
    try {
      const completion = await this.openai.chat.completions.create({
        model: this.config.model,
        messages: [
          {
            role: "system",
            content: TEST_REFACTOR_SYSTEM_PROMPT,
          },
          {
            role: "user",
            content: testRefactorPrompt(contractName, testCode),
          },
        ],
      });

      const refactoredCode = completion.choices[0]?.message?.content || "";

      if (!refactoredCode) {
        console.warn("No refactored code received, using original code");
        return testCode;
      }

      return refactoredCode;
    } catch (error) {
      console.error("Failed to refactor tests:", error);
      console.warn("Using original test code");
      return testCode;
    }
  }
}
