import { Command } from "commander";
import figlet from "figlet";
import chalk from "chalk";
import wrapAnsi from "wrap-ansi";
import { importCommand } from "./commands/import.js";
import { exportCommand } from "./commands/export.js";

const program = new Command();

program
    .name("lurker")
    .description(
        chalk.green(
            wrapAnsi(
                "Lurker is a CLI tool within the Bismuth project, enabling users to securely encrypt and decrypt directories.",
                65
            )
        )
    )
    .version("1.6.0");

program.addCommand(importCommand);
program.addCommand(exportCommand);

const isDefaultCommand = process.argv.length === 2;

if (isDefaultCommand) {
    figlet(
        "LURKER",
        {
            font: "cybermedium",
            width: 80,
        },
        (err, data) => {
            if (err) {
                console.log(chalk.red("Something went wrong..."));
                console.dir(err);
                return;
            }
            console.log(chalk.green(data));
            console.log(chalk.red(`\t  DEVELOPED BY BISMUTH DEVELOPERS`));
            program.parse(process.argv);
        }
    );
} else {
    program.parse(process.argv);
}
