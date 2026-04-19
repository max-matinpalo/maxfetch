<div align="center">
	<img src="assets/logo.png" alt="Logo" width="200" height="200">
</div>

# maxfetch

**Simpler browser API client.**

```
npm install maxfetch
```

```js
const user = await GET("/user")
const res  = await POST("/users", { name: "peter" })
const msgs = await GET("/messages", {status: "new"})
```

**Simplicity of `fetch` with essential conveniences of API clients**

- auto JSON parse/stringify
- define globals configs: baseUrl, headers...
- request timeouts
- serializes params into URL query string
- improved errors and logs
- very lightweight (min gzipped ~0.9kb)

## Setup

### Basic
``` JS
import { api } from "maxfetch";
const user = await api.get("/user");
```

### Global
``` JS
import "maxfetch/global"
const user = await GET("/user");
```
Import once at app start and use `GET()`, `POST()`, `PATCH()`...  
anywhere without writing any other imports.

## Configs
- Base configs for all requests can be registered `configureApi()`
- Supports all options of `fetch API` and in addition the following options:


| Option    | Type      | Description                            | Default | Example    |
|-----------|-----------|----------------------------------------|---------|------------|
| `baseUrl` | `string`  | Base URL prepended to request paths.   | `""`    | `"/api"`   |
| `timeout` | `number`  | Request timeout in milliseconds.       | `5000`  | `10000`    |
| `log`     | `boolean` | Log requests to console.               | `true`  | `true`     |


``` JS
import { configureApi } from "maxfetch";

const config = {
	baseUrl: import.meta.env.DEV ? "localhost:3000" : "example.com",
	headers: { Authorization: "Bearer ..." }
}

configureApi(config);
```

## Syntax
```JS
await GET    (path, params?, configs?)
await DELETE (path, params?, configs?)

await POST   (path, body?, configs?)
await PUT    (path, body?, configs?)
await PATCH  (path, body?, configs?)
```
Body, params and config are optional.

```js
const user = await GET("/user")
const msgs = await GET("/messages", { status: "new", page: 1 })
```

### Details
If the body is a plain object, array, or object with a null prototype, it is automatically JSON-stringified and `Content-Type: application/json` is added unless you already set it. Non-JSON bodies such as `FormData`, `Blob`, and strings are passed through untouched.