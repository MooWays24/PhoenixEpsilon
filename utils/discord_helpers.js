/**
 * Sends a message to a Discord channel with proper error handling
 * @param channelId The Discord channel to send the message to
 * @param content The content to send (string, MessagePayload, or MessageCreateOptions)
 * @param errorMessage The error message to log if the channel is not found
 */
export function sendToChannel(channelId, content, errorMessage) {
    if (typeof channelId === "object") {
        channelId.send(content).catch((error) => {
            console.error(`Error sending message: ${error.message}`);
        });
    }
    else {
        console.log(errorMessage);
    }
}
