let globalConfig = {
	baseUrl: "",
	timeout: 5000,
	log: true,
	headers: {}
};

export function configureApi(config) {
	globalConfig = { ...globalConfig, ...config };
}

function isJsonBody(v) {
	if (Array.isArray(v)) return true;
	if (!v || typeof v !== "object") return false;
	const p = Object.getPrototypeOf(v);
	return p === Object.prototype || p === null;
}

function logRequest(path, req, res) {
	const symbol = res.ok ? "🟢" : "🔴";
	console.log(`${symbol} ${req.method} ${path}`, res.data);
}

function requestError(path, req, res) {
	let msg = typeof res.data === "object" ? res.data.message : res.data;
	msg ||= `Request failed: ${res.status}`;
	const err = new Error(`${req.method} ${path} - ${msg}`);
	err.name = "RequestError";
	err.status = res.status;
	err.data = res.data;
	return err;
}

export async function api(path, opts = {}) {

	// 1. Merge configs
	const config = { ...globalConfig, ...opts };
	config.headers = { ...globalConfig.headers, ...opts.headers };
	config.credentials = opts.credentials ?? "include";

	if (!path) throw new Error("path undefined");

	// 2. Process params
	if (config.params) {
		const query = new URLSearchParams(config.params).toString();
		if (query) path += (path.includes("?") ? "&" : "?") + query;
	}

	// 3. Stringify json body
	if (config.body && isJsonBody(config.body)) {
		config.headers["Content-Type"] ||= "application/json";
		config.body = JSON.stringify(config.body);
	}

	// 4. Set timeout and preserve caller signal
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), config.timeout);
	if (opts.signal?.aborted) controller.abort();
	else if (opts.signal)
		opts.signal.addEventListener("abort", () => controller.abort(), { once: true });
	config.signal = controller.signal;

	// 5. Shoot requests
	let res;
	try { res = await fetch(config.baseUrl + path, config); }
	catch (err) {
		res = { ok: false, status: err.name, data: err.message };
		if (config.log) logRequest(path, config, res);
		throw requestError(path, config, res);
	}
	finally { clearTimeout(timer); }

	// 6. Process response
	const contentType = res.headers.get("Content-Type") || "";

	if (contentType.includes("application/json")) res.data = await res.json().catch(() => ({}));
	else if (contentType.includes("text/")) res.data = await res.text();
	else res.data = await res.blob();

	// 7. Handle logging and errors
	if (config.log) logRequest(path, config, res);
	if (!res.ok) throw requestError(path, config, res);

	return res.data;
}

api.get = (path, params, opt) => api(path, { ...opt, params, method: "GET" });
api.delete = (path, params, opt) => api(path, { ...opt, params, method: "DELETE" });

api.post = (path, body, opt) => api(path, { ...opt, body, method: "POST" });
api.put = (path, body, opt) => api(path, { ...opt, body, method: "PUT" });
api.patch = (path, body, opt) => api(path, { ...opt, body, method: "PATCH" });

export default api;