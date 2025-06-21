import { spawn } from "child_process";
import { logger } from "./core/logging/logger.js";
function startMain() {
    const mainProcess = spawn("node", ["main.js"]);
    mainProcess.on("exit", (code) => {
        logger.info(`main.js exited with code ${code}`);
        logger.info("Restarting main.js...");
        startMain();
    });
    mainProcess.stdout.on("data", (data) => {
        logger.info(`[PHX LOG] ${data}`);
    });
    mainProcess.stderr.on("data", (data) => {
        logger.error(`[PHX ERR] ${data}`);
    });
}
startMain();
