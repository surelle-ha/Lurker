import { Command } from "commander";
import chalk from "chalk";
import path from "path";
import inquirer from "inquirer";
import ora from "ora";
import crypto from "crypto";
import unzipper from "unzipper";
import fsSync from "fs";
import fs from "fs/promises";
import { ALGORITHM, IVECTOR } from "../constants.js";

async function fileExists(filePath: string): Promise<boolean> {
    try {
        await fs.access(filePath);
        return true;
    } catch {
        return false;
    }
}

async function importDirectory(
    file_name: string,
    options: { password?: string }
) {
    if (!options.password) {
        console.error(
            chalk.red(
                "No password provided. Please enter your password to proceed."
            )
        );
        process.exit(0);
    }

    const encryptedPath = path.join(process.cwd(), `${file_name}.dx`);
    const directory = path.join(process.cwd(), file_name);

    if (!(await fileExists(encryptedPath))) {
        console.log(chalk.red(`${file_name}.dx file not found.`));
        return;
    }

    if (await fileExists(directory)) {
        console.log(chalk.yellow("Directory already exists."));
        const { overwrite } = await inquirer.prompt([
            {
                type: "confirm",
                name: "overwrite",
                message: "Overwrite existing directory?",
                default: false,
            },
        ]);
        if (!overwrite) {
            console.log(chalk.red("Operation canceled by the user."));
            return;
        }
    }

    const spinner = ora("Decrypting and extracting directory...").start();

    const input = fsSync.createReadStream(encryptedPath);
    const outputZip = `${directory}.zip`;
    const output = fsSync.createWriteStream(outputZip);
    const decipher = crypto.createDecipheriv(
        ALGORITHM,
        crypto.createHash("sha256").update(options.password).digest(),
        IVECTOR
    );

    input.pipe(decipher).pipe(output);

    decipher.on("error", (err) => {
        spinner.fail("Decryption failed: Invalid password or corrupted file.");
        console.error(chalk.red(err.message));
        return;
    });

    output.on("finish", async () => {
        fsSync
            .createReadStream(outputZip)
            .pipe(unzipper.Extract({ path: directory }))
            .on("close", () => {
                spinner.succeed("Directory decrypted and extracted");
                fsSync.unlinkSync(outputZip);
            });
    });
}

export const importCommand = new Command("import")
    .argument("[file_name]", "Name of the encrypted file without extension")
    .description("Decrypt the .dx file to restore the directory.")
    .option("-p, --password <password>", "Key for decrypting the file")
    .action(importDirectory);
