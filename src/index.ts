#!/usr/bin/env node

import { Command } from "commander";
import { init } from "./command/init";
import { gent } from "./command/gent";

const program = new Command();

program
  .name("ctf")
  .description("A CLI tool for generating contract testing code")
  .version("0.0.1");

init(program);
gent(program);

if (!process.argv.slice(2).length) {
  program.outputHelp();
  process.exit(0);
}

program.parse(process.argv);
