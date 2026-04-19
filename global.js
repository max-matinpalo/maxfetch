import { api } from "./api.js";

globalThis.GET = api.get;
globalThis.DELETE = api.delete;
globalThis.POST = api.post;
globalThis.PUT = api.put;
globalThis.PATCH = api.patch;