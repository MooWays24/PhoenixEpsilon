// Gets information about Phoenix Epsilon itself
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { logger } from "../core/logging/logger.js";
function getPackageJson() {
    try {
        // Get current file's directory
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = dirname(__filename);
        // Read the package.json file - look at the project root
        const packagePath = join(__dirname, "..", "..", "package.json");
        const packageJson = JSON.parse(readFileSync(packagePath, "utf-8"));
        return packageJson;
    }
    catch (error) {
        // Fallback values if package.json cannot be read
        logger.error(`Failed to read package.json: ${error.message}`);
        return {
            name: "Phoenix Epsilon",
            version: "1.3.0",
        };
    }
}
export function getProgramName() {
    return getPackageJson().name;
}
export function getVersion() {
    return getPackageJson().version;
}
export const programName = getProgramName();
export const programVersion = getVersion();
