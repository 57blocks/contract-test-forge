import { Command } from "commander";
import * as fs from "fs";
import * as path from "path";
import * as yaml from "js-yaml";
import * as readline from "readline";
import chalk from "chalk";
import { parseContract } from "../lib/contract-parse";
import { ProjectConfig, TestGenerator } from "../types";
import { TestAnalyzer} from "../lib/test-analyzer";
import { CONFIG_PROJECT_FILE_NAME } from "../constants";
import { TestGeneratorService } from "../lib/test-generator";

function askForConfirmation(question: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === "y" || answer.toLowerCase() === "yes");
    });
  });
}

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
    .option(
      "-y, --yes",
      "Automatically confirm the test cases"
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

      console.log(
        chalk.yellow(
          `Start generating test cases for ${file} ${
            method ? `method: ${method}` : ""
          }`
        )
      );

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
      console.log(chalk.yellow("Parsing contract file..."));
      const functions = parseContract(contractFilePath);

      if (functions.length === 0) {
        console.error(`Error: No functions found in ${file}`);
        process.exit(1);
      }

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

      console.log(chalk.yellow("Analyzing test cases for contract file..."));
      const aiService = new TestAnalyzer(ctfPath);
      const analyzedFunctions = [];

      for (const func of targetFunctions) {
        console.debug(
          chalk.cyan(`- method ${func.name}`) +
            chalk.gray(
              ` (${func.visibility}${
                func.stateMutability ? ` ${func.stateMutability}` : ""
              }) source code:\n`
            ) +
            chalk.white(`${func.code}\n`)
        );

        try {
          console.log(chalk.yellow(`Analyze the test cases for method ${func.name}...`));
          const analysis = await aiService.analyzeFunction(func, file);

          // show analysis result
          aiService.showAnalysis(analysis);

          // ask user to confirm
          if (!options.yes) {
            const confirmed = await askForConfirmation(
              chalk.yellow("Are these test cases good? (y/n): ")
            );

            if (!confirmed) {
              console.log(chalk.red("Analysis cancelled by user"));
              process.exit(0);
            }
          }

          // save confirmed analysis
          analyzedFunctions.push({
            code: func.code,
            analysis,
          });

          console.log(chalk.green("Analysis saved for test generation\n"));
        } catch (error) {
          console.error(chalk.red(`Failed to analyze ${func.name}: ${error}`));
        }
      }

      // generate test cases
      console.log(chalk.yellow("Generating test cases..."));
      const testGenerator = new TestGeneratorService(ctfPath);
      const generateTests = [];
      const contractName = path.basename(file, path.extname(file));
      for (const analyzedFunction of analyzedFunctions) {
        console.log(
          chalk.yellow(
            `Generating test for ${contractName} - ${analyzedFunction.analysis.methodName}`
          )
        );
        try {
          const testData: TestGenerator = {
            contractName,
            code: analyzedFunction.code,
            analysis: analyzedFunction.analysis,
          };

          const generatedTest = await testGenerator.generateTest(testData);
          generateTests.push(generatedTest);
          console.log(chalk.green("Test case generated"));
        } catch (error) {
          console.error(chalk.red("Failed to generate test file:", error));
          throw error;
        }
      }

      if (generateTests.length === 0) {
        console.log(chalk.red("No test cases to generate"));
        process.exit(0);
      }

      console.log(chalk.yellow("Generating the final test file..."));
      await testGenerator.writeTestFile(
        path.join(currentDir, projectConfig.test_dir),
        file,
        generateTests
      );

      console.log(
        chalk.green(
          `\nTest file generated: ${path.join(
            projectConfig.test_dir,
            path.basename(file, path.extname(file)) + ".test.ts"
          )}`
        )
      );
    });
}
