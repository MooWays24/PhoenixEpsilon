import { REST, Routes } from "discord.js";
import { data as translateContextMenu } from "./translateContextMenu.js";
import { loadConfig } from "../core/config/configLoader.js";
const config = loadConfig();
const commands = [translateContextMenu.toJSON()];
export async function registerCommands() {
    // Make sure we have a token and clientId
    if (!config.token) {
        console.error("Discord bot token is missing - cannot register commands");
        return;
    }
    if (!config.clientId) {
        console.error("Discord client ID is missing - cannot register commands");
        return;
    }
    // Create the REST instance with the token explicitly set
    const rest = new REST({ version: "10" }).setToken(config.token);
    try {
        console.log("Started refreshing application (/) commands.");
        await rest.put(Routes.applicationGuildCommands(config.clientId, config.guild), { body: commands });
        console.log("Successfully reloaded application (/) commands.");
    }
    catch (error) {
        console.error("Error registering commands:", error);
    }
}
