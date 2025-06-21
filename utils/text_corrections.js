import { readFileSync } from "fs";
import { join } from "path";
import { logger } from "../core/logging/logger.js";
import { CSZETranslations } from "./CSZETranslations.js";
/**
 * Translates text from TTX encoding back to regular text
 * @param message The TTX encoded message
 * @returns Decoded regular text
 */
export function decodeTTX(message) {
    const chars = Array.from(message);
    let skipflag = 0;
    const originalMsg = [];
    for (let i = 0; i < chars.length; i++) {
        const c = chars[i];
        // Skip Minecraft formatting codes (§ followed by a character)
        if (c === "§") {
            originalMsg.push(c);
            skipflag = 1;
            continue;
        }
        if (skipflag === 1) {
            originalMsg.push(c);
            skipflag = 0;
            continue;
        }
        const code = c.charCodeAt(0);
        if (code >= 10273 && code <= 10366) {
            originalMsg.push(String.fromCharCode(code - 10240));
        }
        else {
            originalMsg.push(c);
        }
    }
    return originalMsg.join("");
}
/**
 * Encodes text to TTX format
 * @param message The regular message
 * @returns TTX encoded text
 */
export function encodeTTX(message) {
    const chars = Array.from(message);
    let skipflag = 0;
    const newMsg = [];
    for (let i = 0; i < chars.length; i++) {
        const c = chars[i];
        if (c === "§") {
            newMsg.push(c);
            skipflag = 1;
            continue;
        }
        if (skipflag === 1) {
            newMsg.push(c);
            skipflag = 0;
            continue;
        }
        const code = c.charCodeAt(0);
        if (code > 32 && code < 127) {
            newMsg.push(String.fromCharCode(code + 10240));
        }
        else {
            newMsg.push(c);
        }
    }
    return newMsg.join("");
}
/**
 * Detects if a message contains TTX encoded text
 * @param message The message to check
 * @returns True if the message contains TTX encoded text
 */
export function hasTTXEncoding(message) {
    return Array.from(message).some((c) => {
        const code = c.charCodeAt(0);
        return code >= 10273 && code <= 10366;
    });
}
/**
 * Load standard Minecraft localizations from the en_US.json file
 * @returns Parsed localization data
 */
function loadLocalizations() {
    try {
        const filePath = join(process.cwd(), "src", "../en_US.json");
        const fileContent = readFileSync(filePath, "utf-8");
        return JSON.parse(fileContent);
    }
    catch (error) {
        console.error("Error loading standard localizations:", error);
        return {};
    }
}
/**
 * Build correction map from localizations
 * @returns Correction map for text replacement
 */
function buildCorrectionMap() {
    // Start with the custom CSZE translations (higher priority)
    const correctionMap = { ...CSZETranslations };
    // Load standard localizations
    const localizations = loadLocalizations();
    // Process all keys in the CSZE translations for pattern matching
    for (const [key, value] of Object.entries(CSZETranslations)) {
        // Add pattern version with % wrapping
        correctionMap[`%${key}%`] = value;
    }
    // Process standard localizations (lower priority)
    for (const [key, entry] of Object.entries(localizations)) {
        // Skip if we already have a custom mapping for this key
        if (correctionMap[key] !== undefined) {
            continue;
        }
        // Skip if we already have a pattern mapping for this key
        if (correctionMap[`%${key}%`] !== undefined) {
            continue;
        }
        // Use the text as the replacement
        const replacement = entry.text;
        // Add both direct key and pattern mappings
        correctionMap[key] = replacement;
        correctionMap[`%${key}%`] = replacement;
    }
    return correctionMap;
}
/**
 * Map of text patterns to corrected versions
 * Built from the en_US.json and CSZETranslations
 */
export const correction = buildCorrectionMap();
/**
 * Format a parameterized message using standard Minecraft parameter format
 * @param template The message template with parameters like %1$s
 * @param params The parameters to insert
 * @returns Formatted message
 */
function formatParameterizedMessage(template, params) {
    if (!params || params.length === 0)
        return template;
    // Replace %1$s, %2$s, etc. with the respective parameters
    let formatted = template.replace(/%(\d+)\$s/g, (match, paramIndex) => {
        const index = parseInt(paramIndex, 10) - 1;
        return index >= 0 && index < params.length ? params[index] : match;
    });
    // Also handle simpler %s format (used in some messages)
    let paramIndex = 0;
    formatted = formatted.replace(/%s/g, () => {
        return paramIndex < params.length ? params[paramIndex++] : "%s";
    });
    return formatted;
}
/**
 * Corrects text by applying defined replacement patterns
 *
 * @param message The message to correct
 * @param params Optional parameters for parameterized messages
 * @returns The corrected message
 */
export function autoCorrect(message, params = []) {
    if (!message)
        return message;
    let correctedMessage = message;
    // Direct key check first (exact match for message keys)
    if (correction[message] !== undefined) {
        const value = correction[message];
        return formatParameterizedMessage(value, params);
    }
    // Look for translatable patterns in the message
    for (const [key, value] of Object.entries(correction)) {
        // Skip keys that are unlikely to be in the middle of text (optimization)
        if (!key.includes(".") && !key.startsWith("%"))
            continue;
        correctedMessage = correctedMessage.replace(new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"), // Escape special regex chars
        (match) => formatParameterizedMessage(value, params));
    }
    // Handle special Minecraft formatting codes (§)
    correctedMessage = correctedMessage.replace(/§[0-9a-fklmnor]/g, "");
    return correctedMessage;
}
/**
 * Comprehensive message processor that handles both TTX decoding and text corrections
 *
 * @param message The original message from Minecraft
 * @param params Optional parameters for parameterized messages
 * @returns Processed message with TTX decoded and text corrected
 */
export function processMinecraftMessage(message, params = []) {
    try {
        // Replace %s placeholders with actual values
        let processedMessage = message;
        params.forEach((param, index) => {
            processedMessage = processedMessage.replace(`%${index + 1}`, param);
        });
        // Handle special cases
        processedMessage = processedMessage
            .replace(/%entity/g, "A tamed Animal")
            .replace(/%d/g, "0")
            .replace(/%s/g, "");
        // Clean up any remaining placeholders
        processedMessage = processedMessage.replace(/%[a-zA-Z0-9]+/g, "");
        return processedMessage.trim();
    }
    catch (error) {
        logger.error(`Error processing Minecraft message: ${error.message}`);
        return message; // Return original message if processing fails
    }
}
