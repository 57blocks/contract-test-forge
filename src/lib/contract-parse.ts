import * as fs from "fs";
import * as parser from "@solidity-parser/parser";
import { ContractFunction } from "../types";

export function parseContract(solFilePath: string): ContractFunction[] {
  let functions: ContractFunction[] = [];
  try {
    // read contract file content
    const contractContent = fs.readFileSync(solFilePath, "utf-8");
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
  } catch (error) {
    console.error("Error parsing Solidity file:", error);
  }

  return functions;
}
