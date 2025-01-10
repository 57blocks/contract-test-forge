import { Command } from "commander";
import * as fs from "fs";
import * as path from "path";
import * as yaml from "js-yaml";
import { parseContract } from "../lib/contract-parse";
import { ProjectConfig } from "../types";

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
    .action((options) => {
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
      const projectYamlPath = path.join(ctfPath, "project.yaml");
      if (!fs.existsSync(projectYamlPath)) {
        console.error(
          "Error: project.yaml not found. Please run 'ctf init' first"
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

      if (!method) {
        // if no method is specified, show all methods
        console.log(`Found ${functions.length} functions in ${file}:`);
        functions.forEach((func) => {
          const mutability = func.stateMutability
            ? ` ${func.stateMutability}`
            : "";

          console.log(
            `- ${func.name} (${func.visibility}${mutability}):\n` +
              `${func.code}`
          );
        });
      } else {
        // if method is specified, find the corresponding method
        const targetFunctions = functions.filter(
          (func) => func.name === method
        );
        if (targetFunctions.length === 0) {
          console.error(
            `Error: Method ${method} not found in contract ${file}`
          );
          process.exit(1);
        }

        targetFunctions.forEach((func) => {
          console.log(
            `- ${func.name} (${func.visibility}${
              func.stateMutability ? ` ${func.stateMutability}` : ""
            }):\n` + `${func.code}`
          );
        });
      }
    });
}
