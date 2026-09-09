/**
 * Minimal logger.
 *
 * Deliberately not a library (ARCHITECTURE.md §1.4 / IDEA.md §32.11): the app
 * needs timestamped, levelled console output and nothing more. Swapping in
 * pino or winston later means changing this one file.
 */
const stamp = () => new Date().toISOString();

export const logger = {
  info: (msg, ...rest) => console.log(`[${stamp()}] INFO  ${msg}`, ...rest),
  warn: (msg, ...rest) => console.warn(`[${stamp()}] WARN  ${msg}`, ...rest),
  error: (msg, ...rest) => console.error(`[${stamp()}] ERROR ${msg}`, ...rest),
};

export default logger;
