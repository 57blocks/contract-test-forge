import { exec } from "child_process";
import * as util from "util";
import * as fs from "fs";

const execAsync = util.promisify(exec);

async function buildLinuxAmd64() {
  try {
    console.log("Building Linux AMD64 binary...");
    await execAsync("pkg . --target node18-linux-x64 --output bin/ctf");
    fs.renameSync("bin/ctf", "bin/ctf_linux_amd64");
    console.log("Linux AMD64 binary built successfully");
  } catch (error) {
    console.error("Failed to build Linux binary:", error);
    throw error;
  }
}

async function buildDarwinArm64() {
  try {
    console.log("Building macOS ARM64 binary...");
    await execAsync("pkg . --target node18-darwin-arm64 --output bin/ctf");
    fs.renameSync("bin/ctf", "bin/ctf_darwin_arm64");
    console.log("macOS ARM64 binary built successfully");
  } catch (error) {
    console.error("Failed to build macOS binary:", error);
    throw error;
  }
}

async function build() {
  try {
    // first compile TypeScript
    console.log("Compiling TypeScript...");
    await execAsync("npm run build");

    // create bin directory
    if (!fs.existsSync("bin")) {
      fs.mkdirSync("bin");
    }

    // build platform specific binaries
    const platform = process.platform;
    if (platform === "darwin") {
      await buildDarwinArm64();
    } else {
      await buildLinuxAmd64();
    }

    console.log("Build complete! Binaries are in the bin directory");
  } catch (error) {
    console.error("Build failed:", error);
    process.exit(1);
  }
}

build(); 