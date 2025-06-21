/**
 * TTX Translation System
 * Encodes/decodes text using a simple character transposition algorithm
 * that shifts ASCII characters by adding 10240 to their code points
 */
/**
 * Translates text from TTX encoding back to regular text
 * @param msg The TTX encoded message
 * @returns Decoded regular text
 */
export function translateFromTTX(msg) {
    const chars = Array.from(msg);
    let skipflag = 0;
    const originalMsg = [];
    for (let i = 0; i < chars.length; i++) {
        // Skip Minecraft formatting codes (§ followed by a character)
        if (chars[i] === "§") {
            skipflag = 1;
            originalMsg.push(chars[i]);
            continue;
        }
        else if (skipflag === 1) {
            originalMsg.push(chars[i]);
            skipflag = 0;
            continue;
        }
        const code = chars[i].charCodeAt(0);
        // Check if character is in TTX range
        if (code >= 10240 + 33 && code <= 10240 + 126) {
            originalMsg.push(String.fromCharCode(code - 10240));
        }
        else {
            originalMsg.push(chars[i]);
        }
    }
    return originalMsg.join("");
}
/**
 * Translates regular text to TTX encoding
 * @param msg The regular message
 * @returns TTX encoded text
 */
export function translateToTTX(msg) {
    const chars = Array.from(msg);
    let skipflag = 0;
    const encodedMsg = [];
    for (let i = 0; i < chars.length; i++) {
        // Skip Minecraft formatting codes (§ followed by a character)
        if (chars[i] === "§") {
            skipflag = 1;
            encodedMsg.push(chars[i]);
            continue;
        }
        else if (skipflag === 1) {
            encodedMsg.push(chars[i]);
            skipflag = 0;
            continue;
        }
        const code = chars[i].charCodeAt(0);
        // Only encode printable ASCII characters
        if (code >= 33 && code <= 126) {
            encodedMsg.push(String.fromCharCode(code + 10240));
        }
        else {
            encodedMsg.push(chars[i]);
        }
    }
    return encodedMsg.join("");
}
/**
 * Utility function to detect if a string is TTX encoded
 * @param text The text to analyze
 * @returns Boolean indicating if the text is TTX encoded
 */
export function isTTXEncoded(text) {
    return Array.from(text).some((c) => {
        const code = c.charCodeAt(0);
        return code >= 10240 + 33 && code <= 10240 + 126;
    });
}
