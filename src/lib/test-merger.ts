import * as fs from "fs";
import * as path from "path";
import * as yaml from "js-yaml";
import OpenAI from "openai";
import { AiConfig, GeneratedTest } from "../types";
import { TEST_MERGE_SYSTEM_PROMPT, testMergePrompt } from "../prompt";
import { CONFIG_AI_FILE_NAME } from "../constants";

export class TestMerger {
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

  public async mergeTests(
    contractName: string,
    tests: GeneratedTest[]
  ): Promise<string> {
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

      return completion.choices[0]?.message?.content || "";
    } catch (error) {
      console.error("Failed to merge tests:", error);
      throw error;
    }
  }
}
