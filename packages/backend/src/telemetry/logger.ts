import { Logger } from "tslog";
import { fileTransport } from "tslog/transports/file";

function createLogger() {
  const log = new Logger({
    minLevel: "DEBUG",
    pretty: {
      template:
        "{{yyyy}}-{{mm}}-{{dd}} {{hh}}:{{MM}}:{{ss}}.{{ms}} {{logLevelName}} ",
      inspectOptions: { depth: 5 },
      // Debug should go to file but not console
      levelMethod: { DEBUG: () => {} },
    },
  });

  log.attachTransport(
    fileTransport({
      path: "logs/app.log",
      minLevel: "DEBUG",
      format: "pretty",
    }),
  );

  return log;
}

/** The global logger instance */
export const logger = createLogger();
