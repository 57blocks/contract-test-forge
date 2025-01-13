import { exec } from "child_process";
import * as util from "util";
import * as fs from "fs";
import * as path from "path";

const execAsync = util.promisify(exec);

async function build() {
  try {
    // first compile TypeScript
    console.log("Compiling TypeScript...");
    await execAsync("npm run build");

    // create bin directory
    if (!fs.existsSync("bin")) {
      fs.mkdirSync("bin");
    }

    // use pkg to package
    console.log("Packaging binaries...");
    await execAsync(
      "pkg . --targets node18-linux-x64,node18-darwin-arm64 --output bin/ctf"
    );

    // rename output files
    fs.renameSync("bin/ctf-linux-x64", "bin/ctf_linux_amd64");
    fs.renameSync("bin/ctf-macos-arm64", "bin/ctf_darwin_arm64");

    console.log("Build complete! Binaries are in the bin directory");
  } catch (error) {
    console.error("Build failed:", error);
    process.exit(1);
  }
}

build(); 