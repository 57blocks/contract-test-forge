import * as fs from "fs";
import * as yaml from "js-yaml";
import OpenAI from "openai";
import { ContractFunction, AiConfig, TestAnalysis, TestCase } from "../types";
import {
  CONTRACT_ANALYZE_SYSTEM_PROMPT,
  contractAnalyzePrompt,
} from "../prompt";

export class AiService {
  private config: AiConfig;
  private openai: OpenAI;

  constructor(configPath: string) {
    this.config = this.loadConfig(configPath);
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

  async analyzeFunction(func: ContractFunction): Promise<TestAnalysis> {
    const prompt = contractAnalyzePrompt(func.code);

    try {
      const response = await this.callAiApi(prompt);
      return this.parseAiResponse(response, func.name);
    } catch (error) {
      throw new Error(`Failed to analyze function: ${error}`);
    }
  }

  private async callAiApi(prompt: string): Promise<string> {
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
