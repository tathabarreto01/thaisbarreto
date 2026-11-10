// Versão do app, injetada pelo next.config.ts a partir do package.json.
export const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION ?? "";

/** "v0.1.0" — ou string vazia se a versão não estiver disponível. */
export const APP_VERSION_LABEL = APP_VERSION ? `v${APP_VERSION}` : "";
