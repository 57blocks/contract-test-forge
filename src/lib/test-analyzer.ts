import path from "path";
import * as fs from "fs";
import * as yaml from "js-yaml";
import OpenAI from "openai";
import { ContractFunction, AiConfig, TestAnalysis } from "../types";
import {
  CONTRACT_ANALYZE_SYSTEM_PROMPT,
  contractAnalyzePrompt,
} from "../prompt";
import { CacheManager } from "./cache-manager";
import { CONFIG_AI_FILE_NAME } from "../constants";
import chalk from "chalk";

export class TestAnalyzer {
  private config: AiConfig;
  private openai: OpenAI;
  private cacheManager: CacheManager;

  constructor(ctfPath: string) {
    const aiConfigPath = path.join(ctfPath, CONFIG_AI_FILE_NAME);
    this.config = this.loadConfig(aiConfigPath);
    if (!this.config.api_key) {
      throw new Error("API key is required, please set it in ai.yaml");
    }
    this.openai = new OpenAI({
      apiKey: this.config.api_key,
    });
    this.cacheManager = new CacheManager(ctfPath);
  }

  private loadConfig(configPath: string): AiConfig {
    try {
      return yaml.load(fs.readFileSync(configPath, "utf-8")) as AiConfig;
    } catch (error) {
      throw new Error("Failed to load AI configuration");
    }
  }

  async analyzeFunction(
    func: ContractFunction,
    contractFile: string
  ): Promise<TestAnalysis> {
    // Try to get from cache first
    const cachedAnalysis = this.cacheManager.getCache(contractFile, func.name);
    if (cachedAnalysis) {
      console.log(`Using cached analysis for ${func.name}`);
      return cachedAnalysis;
    }

    console.log(`No cache found for ${func.name}, analyzing with AI...`);
    const prompt = contractAnalyzePrompt(func.code);

    try {
      const response = await this.analyze(prompt);
      const analysis = this.parseAiResponse(response, func.name);

      // Save to cache
      this.cacheManager.saveCache(contractFile, func.name, analysis);

      return analysis;
    } catch (error) {
      throw new Error(`Failed to analyze function: ${error}`);
    }
  }

  showAnalysis(analysis: TestAnalysis) {
    console.log(chalk.blue("\nSuggested test cases:"));
    console.log(
      chalk.green(`describe('${analysis.methodName}', () => {`)
    );

    analysis.testCases.forEach((testCase) => {
      console.log(
        chalk.green(`  it('${testCase.type}: ${testCase.description}');`)
      );
    });

    console.log(chalk.blue("});\n"));
  }

  private async analyze(prompt: string): Promise<string> {
    try {
      const completion = await this.openai.chat.completions.create({
        model: this.config.model,
        messages: [
          {
            role: "system",
            content: CONTRACT_ANALYZE_SYSTEM_PROMPT,
          },
          {
            role: "user",
            content: prompt,
          },
        ],
      });

      return completion.choices[0]?.message?.content || "";
    } catch (error) {
      console.error("OpenAI API Error:", error);
      throw new Error("Failed to call OpenAI API");
    }
  }

  private parseAiResponse(response: string, methodName: string): TestAnalysis {
    try {
      // try to parse JSON response
      const testCases = JSON.parse(response).map((item: any) => ({
        type: item.type as "positive" | "negative",
        description: item.description,
      }));

      if (testCases.length === 0) {
        console.warn("Warning: No test cases found in AI response");
        console.warn("Raw response:", response);
      }

      return {
        methodName,
        testCases,
      };
    } catch (error) {
      console.error("Failed to parse AI response as JSON:", error);
      console.error("Raw response:", response);
      return {
        methodName,
        testCases: [],
      };
    }
  }
}
