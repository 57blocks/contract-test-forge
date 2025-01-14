import * as fs from "fs";
import * as path from "path";
import * as yaml from "js-yaml";
import OpenAI from "openai";
import { TestGenerator, GeneratedTest, AiConfig, TestPattern } from "../types";
import { TEST_GENERATE_SYSTEM_PROMPT, testGeneratePrompt } from "../prompt";
import { CONFIG_AI_FILE_NAME } from "../constants";
import { testCraft } from "../pattern/test-craft";
import { eal } from "../pattern/eal";

export class TestGeneratorService {
  private openai: OpenAI;
  private config: AiConfig;
  private patterns: TestPattern;

  constructor(ctfPath: string) {
    const aiConfigPath = path.join(ctfPath, CONFIG_AI_FILE_NAME);
    this.config = this.loadConfig(aiConfigPath);
    this.patterns = this.loadTestPatterns();
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

  private loadTestPatterns(): TestPattern {
    return {
      evm_unit_test_principles: testCraft.evm_unit_test_principles,
      common_mistakes_to_avoid: eal.common_mistakes_to_avoid,
    };
  }

  async generateTest(data: TestGenerator): Promise<GeneratedTest> {
    const prompt = testGeneratePrompt(data);

    try {
      const completion = await this.openai.chat.completions.create({
        model: this.config.model,
        messages: [
          {
            role: "system",
            content: TEST_GENERATE_SYSTEM_PROMPT(this.patterns),
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
}
