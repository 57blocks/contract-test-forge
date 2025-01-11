import { Command } from "commander";
import * as fs from "fs";
import * as path from "path";
import * as yaml from "js-yaml";
import { parseContract } from "../lib/contract-parse";
import { ProjectConfig } from "../types";
import { AiService } from "../lib/ai-service";
import { CONFIG_AI_FILE_NAME, CONFIG_PROJECT_FILE_NAME } from "../constants";

export function gent(program: Command) {
  program
    .command("gent")
    .description(
      `
Generate test cases for the project.

example:

ctf gentest -f MyContract.sol -m myMethod
    `
    )
    .option("-f, --file <file>", "The contract file to generate test cases")
    .option(
      "-m, --method <method>",
      "The contract method to generate test cases"
    )
    .action(async (options) => {
      const { file, method } = options;
      if (!file) {
        console.error(
          "Error: Please provide the contract file name when generating test cases"
        );
        process.exit(1);
      }

      const currentDir = process.cwd();
      const ctfPath = path.join(currentDir, ".ctf");

      // Check if .ctf directory exists
      if (!fs.existsSync(ctfPath)) {
        console.error(
          "Error: .ctf directory not found. Please run 'ctf init' first"
        );
        process.exit(1);
      }

      // Read project.yaml
      const projectYamlPath = path.join(ctfPath, CONFIG_PROJECT_FILE_NAME);
      if (!fs.existsSync(projectYamlPath)) {
        console.error(
          `Error: ${CONFIG_PROJECT_FILE_NAME} not found. Please run 'ctf init' first`
        );
        process.exit(1);
      }

      let projectConfig: ProjectConfig;
      try {
        projectConfig = yaml.load(
          fs.readFileSync(projectYamlPath, "utf-8")
        ) as ProjectConfig;
      } catch (error) {
        console.error("Error: Failed to parse project.yaml");
        process.exit(1);
      }

      const contractsPath = path.join(currentDir, projectConfig.contracts_dir);
      const contractFilePath = path.join(contractsPath, file);

      // check if file exists
      if (!fs.existsSync(contractFilePath)) {
        console.error(
          `Error: Contract file ${file} not found in contracts directory`
        );
        process.exit(1);
      }

      // parse contract file
      const functions = parseContract(contractFilePath);

      if (functions.length === 0) {
        console.error(`Error: No functions found in ${file}`);
        process.exit(1);
      }

      const aiConfigPath = path.join(ctfPath, CONFIG_AI_FILE_NAME);
      const aiService = new AiService(aiConfigPath);

      let targetFunctions = functions;
      if (method) {
        // if method is specified, find the corresponding method
        targetFunctions = targetFunctions.filter(
          (func) => func.name === method
        );
        if (targetFunctions.length === 0) {
          console.error(
            `Error: Method ${method} not found in contract ${file}`
          );
          process.exit(1);
        }
      }

      for (const func of targetFunctions) {
        console.log(
          `- ${func.name} (${func.visibility}${
            func.stateMutability ? ` ${func.stateMutability}` : ""
          }):\n${func.code}\n`
        );

        try {
          console.log("start analyze...");
          const analysis = await aiService.analyzeFunction(func);
          console.log("\nSuggested test cases:");
          console.log(`describe('${analysis.methodName}', () => {`);
          analysis.testCases.forEach((testCase) => {
            console.log(`  it('${testCase.type}: ${testCase.description}');`);
          });
          console.log("});\n");
        } catch (error) {
          console.error(`Failed to analyze ${func.name}: ${error}`);
        }
      }
    });
}
