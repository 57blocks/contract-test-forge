import { Command } from "commander";
import * as fs from "fs";
import * as path from "path";
import * as yaml from "js-yaml";
import { ProjectConfig } from "../types";
import { CONFIG_AI_FILE_NAME, CONFIG_PROJECT_FILE_NAME } from "../constants";

export function init(program: Command) {
  program
    .command("init")
    .description("Initialize the ctf configration for the project")
    .action(() => {
      const currentDir = process.cwd();

      let projectName = "your-project-name";
      let projectVersion = "1.0.0";

      // try to read package.json
      const packageJsonPath = path.join(currentDir, "package.json");
      if (fs.existsSync(packageJsonPath)) {
        try {
          const packageJson = JSON.parse(
            fs.readFileSync(packageJsonPath, "utf-8")
          );
          projectName = packageJson.name || projectName;
          projectVersion = packageJson.version || projectVersion;
        } catch (error) {
          console.warn(
            "Warning: Failed to parse package.json, using default values"
          );
        }
      }

      // check contracts directory
      const contractsPath = path.join(currentDir, "contracts");
      if (!fs.existsSync(contractsPath)) {
        console.error(
          "Error: contracts directory not found. Please ensure your project has a contracts directory."
        );
        process.exit(1);
      }

      // check and create test directory
      const testPath = path.join(currentDir, "test");
      if (!fs.existsSync(testPath)) {
        console.log("Creating test directory...");
        fs.mkdirSync(testPath);
      }

      // create .ctf directory
      const ctfPath = path.join(currentDir, ".ctf");
      if (!fs.existsSync(ctfPath)) {
        console.log("Creating .ctf directory...");
        fs.mkdirSync(ctfPath);
      }

      // create project.yaml
      const projectConfig: ProjectConfig = {
        name: projectName,
        version: projectVersion,
        contracts_dir: "./contracts",
        test_dir: "./test",
        test_framework: "hardhat",
      };

      if (!fs.existsSync(path.join(ctfPath, CONFIG_PROJECT_FILE_NAME))) {
        fs.writeFileSync(
          path.join(ctfPath, CONFIG_PROJECT_FILE_NAME),
          yaml.dump(projectConfig)
        );
      }

      // create ai.yaml
      const aiConfig = {
        model: "gpt-4",
        api_key: "",
      };

      if (!fs.existsSync(path.join(ctfPath, CONFIG_AI_FILE_NAME))) {
        fs.writeFileSync(path.join(ctfPath, CONFIG_AI_FILE_NAME), yaml.dump(aiConfig));
      }

      console.log("Initialization complete!");
    });
}
