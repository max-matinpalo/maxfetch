// @ts-nocheck

function isJsonBody(v) {
	if (Array.isArray(v)) return true;
	if (!v || typeof v !== "object") return false;
	const p = Object.getPrototypeOf(v);
	return p === Object.prototype || p === null;
}

function logRequest(path, req, res) {
	console.log(`${res.ok ? "🟢" : "🔴"} ${req.method} ${path}`, res.data);
}

function requestError(path, req, res) {
	let data = res.data;
	if (!data || typeof data !== "object") data = { message: String(data || "") };

	const msg = data.message || `Request failed: ${res.status}`;
	return Object.assign(new Error(`${req.method} ${path} - ${msg}`), {
		name: "RequestError",
		status: res.status,
		data
	});
}

function checkUrl(url) {
	if (url && !/^[a-z]+:\/\//i.test(url) && !url.startsWith("/"))
		console.warn(`⚠️ maxfetch: baseUrl "${url}" must start with http/https or /`);
}

export function setupApi(instanceConfig = {}) {
	const baseConfig = {
		baseUrl: "",
		timeout: 5000,
		log: true,
		...instanceConfig,
		headers: { ...instanceConfig.headers }
	};

	const requestCbs = [];
	const responseCbs = [];
	const errorCbs = [];

	checkUrl(baseConfig.baseUrl);

	async function request(path, opts = {}) {
		if (!path) throw new Error("path undefined");
		const originalPath = path;

		// 1. Merge configs
		const config = { method: "GET", ...baseConfig, ...opts };
		config.method = config.method.toUpperCase();
		config.headers = { ...baseConfig.headers, ...opts.headers };
		config.credentials = opts.credentials ?? "include";

		for (const cb of requestCbs) await cb(config);

		// 2. Process params
		if (config.params) {
			const query = new URLSearchParams(config.params).toString();
			if (query) path += (path.includes("?") ? "&" : "?") + query;
		}

		// 3. Stringify json body
		if (config.body && isJsonBody(config.body)) {
			const hasContentType = Object.keys(config.headers).some(
				k => k.toLowerCase() === "content-type"
			);
			if (!hasContentType) config.headers["Content-Type"] = "application/json";
			config.body = JSON.stringify(config.body);
		}

		// 4. Set timeout and preserve caller signal
		const controller = new AbortController();
		const timer = setTimeout(() => controller.abort(), config.timeout);

		const onAbort = () => controller.abort();
		if (opts.signal?.aborted) controller.abort();
		else if (opts.signal) opts.signal.addEventListener("abort", onAbort, { once: true });

		config.signal = controller.signal;

		// 5. Shoot requests
		let res;
		try {
			const url = config.baseUrl
				? config.baseUrl.replace(/\/$/, "") + "/" + path.replace(/^\//, "")
				: path;

			res = await fetch(url, config);

			// 6. Process response
			const ct = res.headers.get("Content-Type") || "";
			if (ct.includes("application/json")) res.data = await res.json().catch(() => ({}));
			else if (ct.includes("text/")) res.data = await res.text();
			else res.data = await res.blob();
		} catch (err) {
			if (!res) {
				res = { ok: false, status: err.name, data: { message: err.message } };
			} else {
				res = {
					ok: false,
					status: res.status,
					headers: res.headers,
					data: { message: err.message }
				};
			}
		} finally {
			clearTimeout(timer);
			if (opts.signal) opts.signal.removeEventListener("abort", onAbort);
		}

		// 7. Handle logging, interceptors, and errors
		if (config.log) logRequest(path, config, res);

		if (!res.ok) {
			const err = requestError(path, config, res);
			let retryResult;
			const retry = (rOpts = {}) => retryResult = request(originalPath, { ...config, ...rOpts });

			for (const cb of errorCbs) {
				await cb(err, config, retry);
				if (retryResult) break;
			}
			if (retryResult) return retryResult;
			throw err;
		}

		for (const cb of responseCbs) await cb(res);
		return res.data;
	}

	return {
		get: (path, opt) => request(path, { ...opt, method: "GET" }),
		delete: (path, opt) => request(path, { ...opt, method: "DELETE" }),
		post: (path, body, opt) => request(path, { ...opt, body, method: "POST" }),
		put: (path, body, opt) => request(path, { ...opt, body, method: "PUT" }),
		patch: (path, body, opt) => request(path, { ...opt, body, method: "PATCH" }),
		onRequest: cb => requestCbs.push(cb),
		onResponse: cb => responseCbs.push(cb),
		onError: cb => errorCbs.push(cb),
		config: (newConfig = {}) => {
			const headers = { ...baseConfig.headers, ...newConfig.headers };
			for (const key in headers) if (headers[key] === undefined) delete headers[key];
			Object.assign(baseConfig, newConfig, { headers });
			checkUrl(baseConfig.baseUrl);
		}
	};
}

export default setupApi;