/**
 * Parses various color formats into a Discord.js compatible ColorResolvable
 *
 * @param color The color to parse. Can be a number, RGB array, hex string, or color name
 * @returns A ColorResolvable that Discord.js can use
 */
export function parseColor(color) {
    // If it's already a number, return it
    if (typeof color === "number") {
        return color;
    }
    // If it's an array of RGB values, convert to hex number
    if (Array.isArray(color) && color.length >= 3) {
        const [r, g, b] = color;
        return (r << 16) | (g << 8) | b;
    }
    // Handle hex colors (with or without #)
    if (typeof color === "string") {
        // If it's a hex string starting with #, convert to number
        if (color.startsWith("#")) {
            return parseInt(color.slice(1), 16);
        }
        // If it's a hex string without #, convert to number
        if (/^[0-9A-Fa-f]{6}$/.test(color)) {
            return parseInt(color, 16);
        }
        // Try to handle color names by returning the string
        return color;
    }
    // Default to a safe color (blue) if all else fails
    return 0x3498db;
}
