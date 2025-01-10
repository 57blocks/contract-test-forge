import { Command } from "commander";
import * as fs from "fs";
import * as path from "path";
import * as yaml from "js-yaml";
import * as parser from "@solidity-parser/parser";
import { ProjectConfig, ContractFunction } from "../types";

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

      // read contract file content
      const contractContent = fs.readFileSync(contractFilePath, "utf-8");

      let functions: ContractFunction[] = [];
      try {
        const ast = parser.parse(contractContent, { loc: true });

        parser.visit(ast, {
          FunctionDefinition: function (node) {
            if (node.isConstructor) return; // skip constructor

            // Split content into lines and extract function code
            const lines = contractContent.split("\n");
            const functionLines = lines.slice(
              node.loc!.start.line - 1,
              node.loc!.end.line
            );

            const functionCode = functionLines.join("\n");

            const func: ContractFunction = {
              name: node.name || "",
              visibility: node.visibility || "public",
              params: node.parameters.map((param: any) => ({
                name: param.name,
                type: param.typeName.name,
              })),
              stateMutability: node.stateMutability || undefined,
              code: functionCode,
            };

            if (node.returnParameters) {
              func.returns = node.returnParameters.map((param: any) => ({
                type: param.typeName.name,
              }));
            }

            functions.push(func);
          },
        });

        if (functions.length === 0) {
          console.error(`Error: No functions found in ${file}`);
          process.exit(1);
        }

        if (!method) {
          // if no method is specified, show all methods
          console.log(`Found ${functions.length} functions in ${file}:`);
          functions.forEach((func) => {
            const params = func.params
              .map((p) => `${p.type} ${p.name}`)
              .join(", ");
            const returns = func.returns
              ? ` returns (${func.returns.map((r) => r.type).join(", ")})`
              : "";
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
          const targetFunction = functions.find((func) => func.name === method);
          if (!targetFunction) {
            console.error(
              `Error: Method ${method} not found in contract ${file}`
            );
            process.exit(1);
          }

          console.log(
            `- ${targetFunction.name} (${targetFunction.visibility}${
              targetFunction.stateMutability
                ? ` ${targetFunction.stateMutability}`
                : ""
            }):\n` + `${targetFunction.code}`
          );
        }
      } catch (error) {
        console.error("Error: Failed to parse Solidity file");
        console.error(error);
        process.exit(1);
      }
    });
}
