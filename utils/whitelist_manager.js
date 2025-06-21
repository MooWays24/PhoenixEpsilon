import { readFileSync, writeFileSync } from "fs";
/**
 * Loads the whitelist from the JSON file
 * @returns The whitelist data
 */
export function loadWhitelist() {
    return JSON.parse(readFileSync("whitelist.json", "utf-8"));
}
/**
 * Adds a player to the whitelist
 * @param name Player name to add
 * @returns Updated whitelist data
 */
export function addToWhitelist(name) {
    const whitelistData = loadWhitelist();
    whitelistData.whitelist.push(name);
    saveWhitelist(whitelistData);
    console.log(`Added ${name} to the whitelist.`);
    return whitelistData;
}
/**
 * Removes a player from the whitelist
 * @param name Player name to remove
 * @returns Updated whitelist data
 */
export function removeFromWhitelist(name) {
    const whitelistData = loadWhitelist();
    whitelistData.whitelist = whitelistData.whitelist.filter((n) => n !== name);
    saveWhitelist(whitelistData);
    console.log(`Removed ${name} from the whitelist.`);
    return whitelistData;
}
/**
 * Saves the whitelist to the JSON file
 * @param whitelistData The whitelist data to save
 */
function saveWhitelist(whitelistData) {
    writeFileSync("whitelist.json", JSON.stringify(whitelistData, null, 2), "utf-8");
}
/**
 * Handles whitelist commands from Discord
 * @param message The message containing the whitelist command
 * @param isAdmin Whether the user is an admin
 * @param isAnticheatChannel Whether the command is sent in the anticheat channel
 * @returns Updated whitelist data or null if command is not processed
 */
export function handleWhitelistCommand(message, isAdmin, isAnticheatChannel) {
    if (!isAdmin || !isAnticheatChannel)
        return null;
    const content = message.content.replace("$", "");
    if (content === "reboot") {
        console.log("Forcing a reconnect.");
        process.exit();
        return null;
    }
    if (content.endsWith("-r")) {
        const name = content.replace("-r", "");
        return removeFromWhitelist(name);
    }
    return addToWhitelist(content);
}
