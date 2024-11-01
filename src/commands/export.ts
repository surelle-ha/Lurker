import { Command } from "commander";
import chalk from "chalk";
import path from "path";
import ora from "ora";
import crypto from "crypto";
import archiver from "archiver";
import fsSync from "fs";
import fs from "fs/promises";
import { ALGORITHM, IVECTOR } from "../constants.js";

async function fileExists(filePath: string) {
    try {
        await fs.access(filePath);
        return true;
    } catch {
        return false;
    }
}

async function exportDirectory(
    file_name: string,
    options: { password?: string; directory?: string }
) {
    if (!options.password) {
        console.error(
            chalk.red(
                "No password provided. Please enter your password to proceed."
            )
        );
        process.exit(0);
    }

    const directory = path.join(
        process.cwd(),
        options.directory ? options.directory : file_name
    );
    const outputPath = path.join(process.cwd(), `${file_name}.dx`);

    if (!(await fileExists(directory))) {
        console.log(chalk.red("Directory not found."));
        return;
    }

    const spinner = ora("Encrypting directory...").start();

    const archive = archiver("zip", { zlib: { level: 9 } });
    const zipPath = `${outputPath}.zip`;

    const outputZip = fsSync.createWriteStream(zipPath);
    archive.pipe(outputZip);
    archive.directory(directory, false);
    await archive.finalize();

    const input = fsSync.createReadStream(zipPath);
    const output = fsSync.createWriteStream(outputPath);
    const cipher = crypto.createCipheriv(
        ALGORITHM,
        crypto.createHash("sha256").update(options.password).digest(),
        IVECTOR
    );

    input.pipe(cipher).pipe(output);

    output.on("finish", () => {
        spinner.succeed(
            `Directory encrypted and saved as ${file_name}.dx file`
        );
        fsSync.unlinkSync(zipPath);
    });
}

export const exportCommand = new Command("export")
    .argument("[file_name]", "Name of the output file")
    .description("Encrypt and save the directory as a .dx file.")
    .option("-p, --password <password>", "Key for encrypting the file")
    .option(
        "-d, --directory <directory>",
        "Directory that needs to be encrypted."
    )
    .action(exportDirectory);
