class Logger {
    log(message) {
        console.log(message);
    }

    info(message) {
        const formattedMessage = this.formatMessage(`[INFO] ${message}`);
        console.log(formattedMessage);
    }

    error(message) {
        const formattedMessage = this.formatMessage(`[ERROR] ${message}`);
        console.error(formattedMessage);
    }

    close() {
        // No file streams to close — noop
        process.exit(0);
    }

    formatMessage(message) {
        return `[${new Date().toISOString()}] ${message}`;
    }
}

export const logger = new Logger();
