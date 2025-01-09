#!/usr/bin/env node

import { Command } from 'commander';

const program = new Command();

program
  .name('ctf')
  .description('A CLI tool for generating contract testing code')
  .version('0.0.1');

program
  .command('init')
  .description('Initialize the ctf configration for the project')
  .option('-e, --enthusiastic', 'Add enthusiasm')
  .action((name: string, options: { enthusiastic?: boolean }) => {
    const greetingName = name || 'World';
    let greeting = `Hello, ${greetingName}!`;
    if (options.enthusiastic) {
      greeting = greeting.toUpperCase() + '!!!';
    }
    console.log(greeting);
  });

if (!process.argv.slice(2).length) {
  program.outputHelp();
  process.exit(0);
}

program.parse(process.argv);