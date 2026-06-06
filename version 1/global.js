import { api, configureApi, globalConfig } from "./api.js";

globalThis.GET = api.get;
globalThis.DELETE = api.delete;
globalThis.POST = api.post;
globalThis.PUT = api.put;
globalThis.PATCH = api.patch;

globalThis.API_CONFIG = globalConfig;