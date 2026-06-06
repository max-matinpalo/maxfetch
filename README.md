
# maxfetch

**Axios simplified - 10x smaller**

- auto JSON parse/stringify
- globals configs: baseUrl, headers...
- request timeouts
- interceptors onRequest, onResponse, onError
- serializes params into URL query string
- improved errors and logs
- small, zero dependencies (min gzipped ~1.2kb)

## Installation

```bash
npm install maxfetch
```

---

## Quick Start

```javascript
import { setupApi } from "maxfetch";

// 1. Initialize instance
const api = setupApi({baseUrl: "https://example.com"});

// 2. Make requests
const users = await api.get("/users");
const newUser = await api.post("/users", { name: "John Doe" });
```


## Configs
Supports all configs of `fetch API` and in addition the following options:
<div style="height:12px"></div>

| Option    | Type      | Description                            | Default | Example    |
|-----------|-----------|----------------------------------------|---------|------------|
| `baseUrl` | `string`  | Base URL prepended to request paths.   | `""`    | `"https://example.com"`   |
| `timeout` | `number`  | Request timeout in milliseconds.       | `5000`  | `10000`    |
| `log`     | `boolean` | Log requests to console.               | `true`  | `true`     |
&nbsp;



## Interceptors & Configuration

### onRequest
Runs sequentially before a request is sent. Use it to dynamically modify request configurations, such as injecting authentication tokens or custom headers globally.
```javascript
api.onRequest(config => {
	if (localStorage.accessToken)
		config.headers["Authorization"] = `Bearer ${localStorage.accessToken}`;
});
```


### onResponse
Runs after a successful request completes and the response data has been parsed. Use it for global side-effects like logging, analytics, or tracking data metrics.
```javascript
api.onResponse((res) => {
	console.log("Data fetched:", res.data);
});
```


### onError
Runs when a request fails due to network issues or non-2xx HTTP status codes. It intercepts the execution chain, allows you to handle specific errors (like 401 Unauthorized), and exposes a retry() callback to seamlessly re-run the failed request.
```javascript
api.onError(async (err, config, retry) => {
	if (err.status === 401) {
		// 1. Perform async token refresh
		// 2. Retry the original request seamlessly
		return retry({ headers: { ...config.headers, Authorization: "Bearer new_token" } });
	}
});
```

### Global Config Updates

```javascript
// Dynamically update base config or headers at runtime
api.config({
	headers: { "X-Tenant-ID": "12345" }
});

```


### Details
If the body is a plain object, array, or object with a null prototype, it is automatically JSON-stringified and `Content-Type: application/json` is added unless you already set it. Non-JSON bodies such

<details> 
<summary>Instructions for AI</summary>

For all client-side api requests use:

await api.get(path, config?);
await api.delete(path, config?);
await api.post(path, body, config?);
await api.put(path, body, config?);
await api.patch(path, body, config?);

- Never manually stringify the request body.
- Never manually set the Content-Type: application/json header.
- Never manually prepend the base API URL.

</details>