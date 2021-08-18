var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __markAsModule = (target) => __defProp(target, "__esModule", { value: true });
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[Object.keys(fn)[0]])(fn = 0)), res;
};
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[Object.keys(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __export = (target, all) => {
  __markAsModule(target);
  for (var name2 in all)
    __defProp(target, name2, { get: all[name2], enumerable: true });
};
var __reExport = (target, module2, desc2) => {
  if (module2 && typeof module2 === "object" || typeof module2 === "function") {
    for (let key of __getOwnPropNames(module2))
      if (!__hasOwnProp.call(target, key) && key !== "default")
        __defProp(target, key, { get: () => module2[key], enumerable: !(desc2 = __getOwnPropDesc(module2, key)) || desc2.enumerable });
  }
  return target;
};
var __toModule = (module2) => {
  return __reExport(__markAsModule(__defProp(module2 != null ? __create(__getProtoOf(module2)) : {}, "default", module2 && module2.__esModule && "default" in module2 ? { get: () => module2.default, enumerable: true } : { value: module2, enumerable: true })), module2);
};

// node_modules/@sveltejs/kit/dist/install-fetch.js
function dataUriToBuffer(uri) {
  if (!/^data:/i.test(uri)) {
    throw new TypeError('`uri` does not appear to be a Data URI (must begin with "data:")');
  }
  uri = uri.replace(/\r?\n/g, "");
  const firstComma = uri.indexOf(",");
  if (firstComma === -1 || firstComma <= 4) {
    throw new TypeError("malformed data: URI");
  }
  const meta = uri.substring(5, firstComma).split(";");
  let charset = "";
  let base64 = false;
  const type = meta[0] || "text/plain";
  let typeFull = type;
  for (let i = 1; i < meta.length; i++) {
    if (meta[i] === "base64") {
      base64 = true;
    } else {
      typeFull += `;${meta[i]}`;
      if (meta[i].indexOf("charset=") === 0) {
        charset = meta[i].substring(8);
      }
    }
  }
  if (!meta[0] && !charset.length) {
    typeFull += ";charset=US-ASCII";
    charset = "US-ASCII";
  }
  const encoding = base64 ? "base64" : "ascii";
  const data = unescape(uri.substring(firstComma + 1));
  const buffer = Buffer.from(data, encoding);
  buffer.type = type;
  buffer.typeFull = typeFull;
  buffer.charset = charset;
  return buffer;
}
async function* read(parts) {
  for (const part of parts) {
    if ("stream" in part) {
      yield* part.stream();
    } else {
      yield part;
    }
  }
}
function isFormData(object) {
  return typeof object === "object" && typeof object.append === "function" && typeof object.set === "function" && typeof object.get === "function" && typeof object.getAll === "function" && typeof object.delete === "function" && typeof object.keys === "function" && typeof object.values === "function" && typeof object.entries === "function" && typeof object.constructor === "function" && object[NAME] === "FormData";
}
function getHeader(boundary, name2, field) {
  let header = "";
  header += `${dashes}${boundary}${carriage}`;
  header += `Content-Disposition: form-data; name="${name2}"`;
  if (isBlob(field)) {
    header += `; filename="${field.name}"${carriage}`;
    header += `Content-Type: ${field.type || "application/octet-stream"}`;
  }
  return `${header}${carriage.repeat(2)}`;
}
async function* formDataIterator(form, boundary) {
  for (const [name2, value] of form) {
    yield getHeader(boundary, name2, value);
    if (isBlob(value)) {
      yield* value.stream();
    } else {
      yield value;
    }
    yield carriage;
  }
  yield getFooter(boundary);
}
function getFormDataLength(form, boundary) {
  let length = 0;
  for (const [name2, value] of form) {
    length += Buffer.byteLength(getHeader(boundary, name2, value));
    if (isBlob(value)) {
      length += value.size;
    } else {
      length += Buffer.byteLength(String(value));
    }
    length += carriageLength;
  }
  length += Buffer.byteLength(getFooter(boundary));
  return length;
}
async function consumeBody(data) {
  if (data[INTERNALS$2].disturbed) {
    throw new TypeError(`body used already for: ${data.url}`);
  }
  data[INTERNALS$2].disturbed = true;
  if (data[INTERNALS$2].error) {
    throw data[INTERNALS$2].error;
  }
  let { body } = data;
  if (body === null) {
    return Buffer.alloc(0);
  }
  if (isBlob(body)) {
    body = body.stream();
  }
  if (Buffer.isBuffer(body)) {
    return body;
  }
  if (!(body instanceof import_stream.default)) {
    return Buffer.alloc(0);
  }
  const accum = [];
  let accumBytes = 0;
  try {
    for await (const chunk of body) {
      if (data.size > 0 && accumBytes + chunk.length > data.size) {
        const err = new FetchError(`content size at ${data.url} over limit: ${data.size}`, "max-size");
        body.destroy(err);
        throw err;
      }
      accumBytes += chunk.length;
      accum.push(chunk);
    }
  } catch (error3) {
    if (error3 instanceof FetchBaseError) {
      throw error3;
    } else {
      throw new FetchError(`Invalid response body while trying to fetch ${data.url}: ${error3.message}`, "system", error3);
    }
  }
  if (body.readableEnded === true || body._readableState.ended === true) {
    try {
      if (accum.every((c) => typeof c === "string")) {
        return Buffer.from(accum.join(""));
      }
      return Buffer.concat(accum, accumBytes);
    } catch (error3) {
      throw new FetchError(`Could not create Buffer from response body for ${data.url}: ${error3.message}`, "system", error3);
    }
  } else {
    throw new FetchError(`Premature close of server response while trying to fetch ${data.url}`);
  }
}
function fromRawHeaders(headers = []) {
  return new Headers(headers.reduce((result, value, index2, array) => {
    if (index2 % 2 === 0) {
      result.push(array.slice(index2, index2 + 2));
    }
    return result;
  }, []).filter(([name2, value]) => {
    try {
      validateHeaderName(name2);
      validateHeaderValue(name2, String(value));
      return true;
    } catch {
      return false;
    }
  }));
}
async function fetch(url, options_) {
  return new Promise((resolve2, reject) => {
    const request = new Request(url, options_);
    const options2 = getNodeRequestOptions(request);
    if (!supportedSchemas.has(options2.protocol)) {
      throw new TypeError(`node-fetch cannot load ${url}. URL scheme "${options2.protocol.replace(/:$/, "")}" is not supported.`);
    }
    if (options2.protocol === "data:") {
      const data = dataUriToBuffer$1(request.url);
      const response2 = new Response(data, { headers: { "Content-Type": data.typeFull } });
      resolve2(response2);
      return;
    }
    const send = (options2.protocol === "https:" ? import_https.default : import_http.default).request;
    const { signal } = request;
    let response = null;
    const abort = () => {
      const error3 = new AbortError("The operation was aborted.");
      reject(error3);
      if (request.body && request.body instanceof import_stream.default.Readable) {
        request.body.destroy(error3);
      }
      if (!response || !response.body) {
        return;
      }
      response.body.emit("error", error3);
    };
    if (signal && signal.aborted) {
      abort();
      return;
    }
    const abortAndFinalize = () => {
      abort();
      finalize();
    };
    const request_ = send(options2);
    if (signal) {
      signal.addEventListener("abort", abortAndFinalize);
    }
    const finalize = () => {
      request_.abort();
      if (signal) {
        signal.removeEventListener("abort", abortAndFinalize);
      }
    };
    request_.on("error", (err) => {
      reject(new FetchError(`request to ${request.url} failed, reason: ${err.message}`, "system", err));
      finalize();
    });
    request_.on("response", (response_) => {
      request_.setTimeout(0);
      const headers = fromRawHeaders(response_.rawHeaders);
      if (isRedirect(response_.statusCode)) {
        const location2 = headers.get("Location");
        const locationURL = location2 === null ? null : new URL(location2, request.url);
        switch (request.redirect) {
          case "error":
            reject(new FetchError(`uri requested responds with a redirect, redirect mode is set to error: ${request.url}`, "no-redirect"));
            finalize();
            return;
          case "manual":
            if (locationURL !== null) {
              try {
                headers.set("Location", locationURL);
              } catch (error3) {
                reject(error3);
              }
            }
            break;
          case "follow": {
            if (locationURL === null) {
              break;
            }
            if (request.counter >= request.follow) {
              reject(new FetchError(`maximum redirect reached at: ${request.url}`, "max-redirect"));
              finalize();
              return;
            }
            const requestOptions = {
              headers: new Headers(request.headers),
              follow: request.follow,
              counter: request.counter + 1,
              agent: request.agent,
              compress: request.compress,
              method: request.method,
              body: request.body,
              signal: request.signal,
              size: request.size
            };
            if (response_.statusCode !== 303 && request.body && options_.body instanceof import_stream.default.Readable) {
              reject(new FetchError("Cannot follow redirect with body being a readable stream", "unsupported-redirect"));
              finalize();
              return;
            }
            if (response_.statusCode === 303 || (response_.statusCode === 301 || response_.statusCode === 302) && request.method === "POST") {
              requestOptions.method = "GET";
              requestOptions.body = void 0;
              requestOptions.headers.delete("content-length");
            }
            resolve2(fetch(new Request(locationURL, requestOptions)));
            finalize();
            return;
          }
        }
      }
      response_.once("end", () => {
        if (signal) {
          signal.removeEventListener("abort", abortAndFinalize);
        }
      });
      let body = (0, import_stream.pipeline)(response_, new import_stream.PassThrough(), (error3) => {
        reject(error3);
      });
      if (process.version < "v12.10") {
        response_.on("aborted", abortAndFinalize);
      }
      const responseOptions = {
        url: request.url,
        status: response_.statusCode,
        statusText: response_.statusMessage,
        headers,
        size: request.size,
        counter: request.counter,
        highWaterMark: request.highWaterMark
      };
      const codings = headers.get("Content-Encoding");
      if (!request.compress || request.method === "HEAD" || codings === null || response_.statusCode === 204 || response_.statusCode === 304) {
        response = new Response(body, responseOptions);
        resolve2(response);
        return;
      }
      const zlibOptions = {
        flush: import_zlib.default.Z_SYNC_FLUSH,
        finishFlush: import_zlib.default.Z_SYNC_FLUSH
      };
      if (codings === "gzip" || codings === "x-gzip") {
        body = (0, import_stream.pipeline)(body, import_zlib.default.createGunzip(zlibOptions), (error3) => {
          reject(error3);
        });
        response = new Response(body, responseOptions);
        resolve2(response);
        return;
      }
      if (codings === "deflate" || codings === "x-deflate") {
        const raw = (0, import_stream.pipeline)(response_, new import_stream.PassThrough(), (error3) => {
          reject(error3);
        });
        raw.once("data", (chunk) => {
          if ((chunk[0] & 15) === 8) {
            body = (0, import_stream.pipeline)(body, import_zlib.default.createInflate(), (error3) => {
              reject(error3);
            });
          } else {
            body = (0, import_stream.pipeline)(body, import_zlib.default.createInflateRaw(), (error3) => {
              reject(error3);
            });
          }
          response = new Response(body, responseOptions);
          resolve2(response);
        });
        return;
      }
      if (codings === "br") {
        body = (0, import_stream.pipeline)(body, import_zlib.default.createBrotliDecompress(), (error3) => {
          reject(error3);
        });
        response = new Response(body, responseOptions);
        resolve2(response);
        return;
      }
      response = new Response(body, responseOptions);
      resolve2(response);
    });
    writeToStream(request_, request);
  });
}
var import_http, import_https, import_zlib, import_stream, import_util, import_crypto, import_url, src, dataUriToBuffer$1, Readable, wm, Blob, fetchBlob, Blob$1, FetchBaseError, FetchError, NAME, isURLSearchParameters, isBlob, isAbortSignal, carriage, dashes, carriageLength, getFooter, getBoundary, INTERNALS$2, Body, clone, extractContentType, getTotalBytes, writeToStream, validateHeaderName, validateHeaderValue, Headers, redirectStatus, isRedirect, INTERNALS$1, Response, getSearch, INTERNALS, isRequest, Request, getNodeRequestOptions, AbortError, supportedSchemas;
var init_install_fetch = __esm({
  "node_modules/@sveltejs/kit/dist/install-fetch.js"() {
    init_shims();
    import_http = __toModule(require("http"));
    import_https = __toModule(require("https"));
    import_zlib = __toModule(require("zlib"));
    import_stream = __toModule(require("stream"));
    import_util = __toModule(require("util"));
    import_crypto = __toModule(require("crypto"));
    import_url = __toModule(require("url"));
    src = dataUriToBuffer;
    dataUriToBuffer$1 = src;
    ({ Readable } = import_stream.default);
    wm = new WeakMap();
    Blob = class {
      constructor(blobParts = [], options2 = {}) {
        let size = 0;
        const parts = blobParts.map((element) => {
          let buffer;
          if (element instanceof Buffer) {
            buffer = element;
          } else if (ArrayBuffer.isView(element)) {
            buffer = Buffer.from(element.buffer, element.byteOffset, element.byteLength);
          } else if (element instanceof ArrayBuffer) {
            buffer = Buffer.from(element);
          } else if (element instanceof Blob) {
            buffer = element;
          } else {
            buffer = Buffer.from(typeof element === "string" ? element : String(element));
          }
          size += buffer.length || buffer.size || 0;
          return buffer;
        });
        const type = options2.type === void 0 ? "" : String(options2.type).toLowerCase();
        wm.set(this, {
          type: /[^\u0020-\u007E]/.test(type) ? "" : type,
          size,
          parts
        });
      }
      get size() {
        return wm.get(this).size;
      }
      get type() {
        return wm.get(this).type;
      }
      async text() {
        return Buffer.from(await this.arrayBuffer()).toString();
      }
      async arrayBuffer() {
        const data = new Uint8Array(this.size);
        let offset = 0;
        for await (const chunk of this.stream()) {
          data.set(chunk, offset);
          offset += chunk.length;
        }
        return data.buffer;
      }
      stream() {
        return Readable.from(read(wm.get(this).parts));
      }
      slice(start = 0, end = this.size, type = "") {
        const { size } = this;
        let relativeStart = start < 0 ? Math.max(size + start, 0) : Math.min(start, size);
        let relativeEnd = end < 0 ? Math.max(size + end, 0) : Math.min(end, size);
        const span = Math.max(relativeEnd - relativeStart, 0);
        const parts = wm.get(this).parts.values();
        const blobParts = [];
        let added = 0;
        for (const part of parts) {
          const size2 = ArrayBuffer.isView(part) ? part.byteLength : part.size;
          if (relativeStart && size2 <= relativeStart) {
            relativeStart -= size2;
            relativeEnd -= size2;
          } else {
            const chunk = part.slice(relativeStart, Math.min(size2, relativeEnd));
            blobParts.push(chunk);
            added += ArrayBuffer.isView(chunk) ? chunk.byteLength : chunk.size;
            relativeStart = 0;
            if (added >= span) {
              break;
            }
          }
        }
        const blob = new Blob([], { type: String(type).toLowerCase() });
        Object.assign(wm.get(blob), { size: span, parts: blobParts });
        return blob;
      }
      get [Symbol.toStringTag]() {
        return "Blob";
      }
      static [Symbol.hasInstance](object) {
        return object && typeof object === "object" && typeof object.stream === "function" && object.stream.length === 0 && typeof object.constructor === "function" && /^(Blob|File)$/.test(object[Symbol.toStringTag]);
      }
    };
    Object.defineProperties(Blob.prototype, {
      size: { enumerable: true },
      type: { enumerable: true },
      slice: { enumerable: true }
    });
    fetchBlob = Blob;
    Blob$1 = fetchBlob;
    FetchBaseError = class extends Error {
      constructor(message2, type) {
        super(message2);
        Error.captureStackTrace(this, this.constructor);
        this.type = type;
      }
      get name() {
        return this.constructor.name;
      }
      get [Symbol.toStringTag]() {
        return this.constructor.name;
      }
    };
    FetchError = class extends FetchBaseError {
      constructor(message2, type, systemError) {
        super(message2, type);
        if (systemError) {
          this.code = this.errno = systemError.code;
          this.erroredSysCall = systemError.syscall;
        }
      }
    };
    NAME = Symbol.toStringTag;
    isURLSearchParameters = (object) => {
      return typeof object === "object" && typeof object.append === "function" && typeof object.delete === "function" && typeof object.get === "function" && typeof object.getAll === "function" && typeof object.has === "function" && typeof object.set === "function" && typeof object.sort === "function" && object[NAME] === "URLSearchParams";
    };
    isBlob = (object) => {
      return typeof object === "object" && typeof object.arrayBuffer === "function" && typeof object.type === "string" && typeof object.stream === "function" && typeof object.constructor === "function" && /^(Blob|File)$/.test(object[NAME]);
    };
    isAbortSignal = (object) => {
      return typeof object === "object" && object[NAME] === "AbortSignal";
    };
    carriage = "\r\n";
    dashes = "-".repeat(2);
    carriageLength = Buffer.byteLength(carriage);
    getFooter = (boundary) => `${dashes}${boundary}${dashes}${carriage.repeat(2)}`;
    getBoundary = () => (0, import_crypto.randomBytes)(8).toString("hex");
    INTERNALS$2 = Symbol("Body internals");
    Body = class {
      constructor(body, {
        size = 0
      } = {}) {
        let boundary = null;
        if (body === null) {
          body = null;
        } else if (isURLSearchParameters(body)) {
          body = Buffer.from(body.toString());
        } else if (isBlob(body))
          ;
        else if (Buffer.isBuffer(body))
          ;
        else if (import_util.types.isAnyArrayBuffer(body)) {
          body = Buffer.from(body);
        } else if (ArrayBuffer.isView(body)) {
          body = Buffer.from(body.buffer, body.byteOffset, body.byteLength);
        } else if (body instanceof import_stream.default)
          ;
        else if (isFormData(body)) {
          boundary = `NodeFetchFormDataBoundary${getBoundary()}`;
          body = import_stream.default.Readable.from(formDataIterator(body, boundary));
        } else {
          body = Buffer.from(String(body));
        }
        this[INTERNALS$2] = {
          body,
          boundary,
          disturbed: false,
          error: null
        };
        this.size = size;
        if (body instanceof import_stream.default) {
          body.on("error", (err) => {
            const error3 = err instanceof FetchBaseError ? err : new FetchError(`Invalid response body while trying to fetch ${this.url}: ${err.message}`, "system", err);
            this[INTERNALS$2].error = error3;
          });
        }
      }
      get body() {
        return this[INTERNALS$2].body;
      }
      get bodyUsed() {
        return this[INTERNALS$2].disturbed;
      }
      async arrayBuffer() {
        const { buffer, byteOffset, byteLength } = await consumeBody(this);
        return buffer.slice(byteOffset, byteOffset + byteLength);
      }
      async blob() {
        const ct = this.headers && this.headers.get("content-type") || this[INTERNALS$2].body && this[INTERNALS$2].body.type || "";
        const buf = await this.buffer();
        return new Blob$1([buf], {
          type: ct
        });
      }
      async json() {
        const buffer = await consumeBody(this);
        return JSON.parse(buffer.toString());
      }
      async text() {
        const buffer = await consumeBody(this);
        return buffer.toString();
      }
      buffer() {
        return consumeBody(this);
      }
    };
    Object.defineProperties(Body.prototype, {
      body: { enumerable: true },
      bodyUsed: { enumerable: true },
      arrayBuffer: { enumerable: true },
      blob: { enumerable: true },
      json: { enumerable: true },
      text: { enumerable: true }
    });
    clone = (instance, highWaterMark) => {
      let p1;
      let p2;
      let { body } = instance;
      if (instance.bodyUsed) {
        throw new Error("cannot clone body after it is used");
      }
      if (body instanceof import_stream.default && typeof body.getBoundary !== "function") {
        p1 = new import_stream.PassThrough({ highWaterMark });
        p2 = new import_stream.PassThrough({ highWaterMark });
        body.pipe(p1);
        body.pipe(p2);
        instance[INTERNALS$2].body = p1;
        body = p2;
      }
      return body;
    };
    extractContentType = (body, request) => {
      if (body === null) {
        return null;
      }
      if (typeof body === "string") {
        return "text/plain;charset=UTF-8";
      }
      if (isURLSearchParameters(body)) {
        return "application/x-www-form-urlencoded;charset=UTF-8";
      }
      if (isBlob(body)) {
        return body.type || null;
      }
      if (Buffer.isBuffer(body) || import_util.types.isAnyArrayBuffer(body) || ArrayBuffer.isView(body)) {
        return null;
      }
      if (body && typeof body.getBoundary === "function") {
        return `multipart/form-data;boundary=${body.getBoundary()}`;
      }
      if (isFormData(body)) {
        return `multipart/form-data; boundary=${request[INTERNALS$2].boundary}`;
      }
      if (body instanceof import_stream.default) {
        return null;
      }
      return "text/plain;charset=UTF-8";
    };
    getTotalBytes = (request) => {
      const { body } = request;
      if (body === null) {
        return 0;
      }
      if (isBlob(body)) {
        return body.size;
      }
      if (Buffer.isBuffer(body)) {
        return body.length;
      }
      if (body && typeof body.getLengthSync === "function") {
        return body.hasKnownLength && body.hasKnownLength() ? body.getLengthSync() : null;
      }
      if (isFormData(body)) {
        return getFormDataLength(request[INTERNALS$2].boundary);
      }
      return null;
    };
    writeToStream = (dest, { body }) => {
      if (body === null) {
        dest.end();
      } else if (isBlob(body)) {
        body.stream().pipe(dest);
      } else if (Buffer.isBuffer(body)) {
        dest.write(body);
        dest.end();
      } else {
        body.pipe(dest);
      }
    };
    validateHeaderName = typeof import_http.default.validateHeaderName === "function" ? import_http.default.validateHeaderName : (name2) => {
      if (!/^[\^`\-\w!#$%&'*+.|~]+$/.test(name2)) {
        const err = new TypeError(`Header name must be a valid HTTP token [${name2}]`);
        Object.defineProperty(err, "code", { value: "ERR_INVALID_HTTP_TOKEN" });
        throw err;
      }
    };
    validateHeaderValue = typeof import_http.default.validateHeaderValue === "function" ? import_http.default.validateHeaderValue : (name2, value) => {
      if (/[^\t\u0020-\u007E\u0080-\u00FF]/.test(value)) {
        const err = new TypeError(`Invalid character in header content ["${name2}"]`);
        Object.defineProperty(err, "code", { value: "ERR_INVALID_CHAR" });
        throw err;
      }
    };
    Headers = class extends URLSearchParams {
      constructor(init2) {
        let result = [];
        if (init2 instanceof Headers) {
          const raw = init2.raw();
          for (const [name2, values] of Object.entries(raw)) {
            result.push(...values.map((value) => [name2, value]));
          }
        } else if (init2 == null)
          ;
        else if (typeof init2 === "object" && !import_util.types.isBoxedPrimitive(init2)) {
          const method = init2[Symbol.iterator];
          if (method == null) {
            result.push(...Object.entries(init2));
          } else {
            if (typeof method !== "function") {
              throw new TypeError("Header pairs must be iterable");
            }
            result = [...init2].map((pair) => {
              if (typeof pair !== "object" || import_util.types.isBoxedPrimitive(pair)) {
                throw new TypeError("Each header pair must be an iterable object");
              }
              return [...pair];
            }).map((pair) => {
              if (pair.length !== 2) {
                throw new TypeError("Each header pair must be a name/value tuple");
              }
              return [...pair];
            });
          }
        } else {
          throw new TypeError("Failed to construct 'Headers': The provided value is not of type '(sequence<sequence<ByteString>> or record<ByteString, ByteString>)");
        }
        result = result.length > 0 ? result.map(([name2, value]) => {
          validateHeaderName(name2);
          validateHeaderValue(name2, String(value));
          return [String(name2).toLowerCase(), String(value)];
        }) : void 0;
        super(result);
        return new Proxy(this, {
          get(target, p, receiver) {
            switch (p) {
              case "append":
              case "set":
                return (name2, value) => {
                  validateHeaderName(name2);
                  validateHeaderValue(name2, String(value));
                  return URLSearchParams.prototype[p].call(receiver, String(name2).toLowerCase(), String(value));
                };
              case "delete":
              case "has":
              case "getAll":
                return (name2) => {
                  validateHeaderName(name2);
                  return URLSearchParams.prototype[p].call(receiver, String(name2).toLowerCase());
                };
              case "keys":
                return () => {
                  target.sort();
                  return new Set(URLSearchParams.prototype.keys.call(target)).keys();
                };
              default:
                return Reflect.get(target, p, receiver);
            }
          }
        });
      }
      get [Symbol.toStringTag]() {
        return this.constructor.name;
      }
      toString() {
        return Object.prototype.toString.call(this);
      }
      get(name2) {
        const values = this.getAll(name2);
        if (values.length === 0) {
          return null;
        }
        let value = values.join(", ");
        if (/^content-encoding$/i.test(name2)) {
          value = value.toLowerCase();
        }
        return value;
      }
      forEach(callback) {
        for (const name2 of this.keys()) {
          callback(this.get(name2), name2);
        }
      }
      *values() {
        for (const name2 of this.keys()) {
          yield this.get(name2);
        }
      }
      *entries() {
        for (const name2 of this.keys()) {
          yield [name2, this.get(name2)];
        }
      }
      [Symbol.iterator]() {
        return this.entries();
      }
      raw() {
        return [...this.keys()].reduce((result, key) => {
          result[key] = this.getAll(key);
          return result;
        }, {});
      }
      [Symbol.for("nodejs.util.inspect.custom")]() {
        return [...this.keys()].reduce((result, key) => {
          const values = this.getAll(key);
          if (key === "host") {
            result[key] = values[0];
          } else {
            result[key] = values.length > 1 ? values : values[0];
          }
          return result;
        }, {});
      }
    };
    Object.defineProperties(Headers.prototype, ["get", "entries", "forEach", "values"].reduce((result, property) => {
      result[property] = { enumerable: true };
      return result;
    }, {}));
    redirectStatus = new Set([301, 302, 303, 307, 308]);
    isRedirect = (code) => {
      return redirectStatus.has(code);
    };
    INTERNALS$1 = Symbol("Response internals");
    Response = class extends Body {
      constructor(body = null, options2 = {}) {
        super(body, options2);
        const status = options2.status || 200;
        const headers = new Headers(options2.headers);
        if (body !== null && !headers.has("Content-Type")) {
          const contentType = extractContentType(body);
          if (contentType) {
            headers.append("Content-Type", contentType);
          }
        }
        this[INTERNALS$1] = {
          url: options2.url,
          status,
          statusText: options2.statusText || "",
          headers,
          counter: options2.counter,
          highWaterMark: options2.highWaterMark
        };
      }
      get url() {
        return this[INTERNALS$1].url || "";
      }
      get status() {
        return this[INTERNALS$1].status;
      }
      get ok() {
        return this[INTERNALS$1].status >= 200 && this[INTERNALS$1].status < 300;
      }
      get redirected() {
        return this[INTERNALS$1].counter > 0;
      }
      get statusText() {
        return this[INTERNALS$1].statusText;
      }
      get headers() {
        return this[INTERNALS$1].headers;
      }
      get highWaterMark() {
        return this[INTERNALS$1].highWaterMark;
      }
      clone() {
        return new Response(clone(this, this.highWaterMark), {
          url: this.url,
          status: this.status,
          statusText: this.statusText,
          headers: this.headers,
          ok: this.ok,
          redirected: this.redirected,
          size: this.size
        });
      }
      static redirect(url, status = 302) {
        if (!isRedirect(status)) {
          throw new RangeError('Failed to execute "redirect" on "response": Invalid status code');
        }
        return new Response(null, {
          headers: {
            location: new URL(url).toString()
          },
          status
        });
      }
      get [Symbol.toStringTag]() {
        return "Response";
      }
    };
    Object.defineProperties(Response.prototype, {
      url: { enumerable: true },
      status: { enumerable: true },
      ok: { enumerable: true },
      redirected: { enumerable: true },
      statusText: { enumerable: true },
      headers: { enumerable: true },
      clone: { enumerable: true }
    });
    getSearch = (parsedURL) => {
      if (parsedURL.search) {
        return parsedURL.search;
      }
      const lastOffset = parsedURL.href.length - 1;
      const hash2 = parsedURL.hash || (parsedURL.href[lastOffset] === "#" ? "#" : "");
      return parsedURL.href[lastOffset - hash2.length] === "?" ? "?" : "";
    };
    INTERNALS = Symbol("Request internals");
    isRequest = (object) => {
      return typeof object === "object" && typeof object[INTERNALS] === "object";
    };
    Request = class extends Body {
      constructor(input, init2 = {}) {
        let parsedURL;
        if (isRequest(input)) {
          parsedURL = new URL(input.url);
        } else {
          parsedURL = new URL(input);
          input = {};
        }
        let method = init2.method || input.method || "GET";
        method = method.toUpperCase();
        if ((init2.body != null || isRequest(input)) && input.body !== null && (method === "GET" || method === "HEAD")) {
          throw new TypeError("Request with GET/HEAD method cannot have body");
        }
        const inputBody = init2.body ? init2.body : isRequest(input) && input.body !== null ? clone(input) : null;
        super(inputBody, {
          size: init2.size || input.size || 0
        });
        const headers = new Headers(init2.headers || input.headers || {});
        if (inputBody !== null && !headers.has("Content-Type")) {
          const contentType = extractContentType(inputBody, this);
          if (contentType) {
            headers.append("Content-Type", contentType);
          }
        }
        let signal = isRequest(input) ? input.signal : null;
        if ("signal" in init2) {
          signal = init2.signal;
        }
        if (signal !== null && !isAbortSignal(signal)) {
          throw new TypeError("Expected signal to be an instanceof AbortSignal");
        }
        this[INTERNALS] = {
          method,
          redirect: init2.redirect || input.redirect || "follow",
          headers,
          parsedURL,
          signal
        };
        this.follow = init2.follow === void 0 ? input.follow === void 0 ? 20 : input.follow : init2.follow;
        this.compress = init2.compress === void 0 ? input.compress === void 0 ? true : input.compress : init2.compress;
        this.counter = init2.counter || input.counter || 0;
        this.agent = init2.agent || input.agent;
        this.highWaterMark = init2.highWaterMark || input.highWaterMark || 16384;
        this.insecureHTTPParser = init2.insecureHTTPParser || input.insecureHTTPParser || false;
      }
      get method() {
        return this[INTERNALS].method;
      }
      get url() {
        return (0, import_url.format)(this[INTERNALS].parsedURL);
      }
      get headers() {
        return this[INTERNALS].headers;
      }
      get redirect() {
        return this[INTERNALS].redirect;
      }
      get signal() {
        return this[INTERNALS].signal;
      }
      clone() {
        return new Request(this);
      }
      get [Symbol.toStringTag]() {
        return "Request";
      }
    };
    Object.defineProperties(Request.prototype, {
      method: { enumerable: true },
      url: { enumerable: true },
      headers: { enumerable: true },
      redirect: { enumerable: true },
      clone: { enumerable: true },
      signal: { enumerable: true }
    });
    getNodeRequestOptions = (request) => {
      const { parsedURL } = request[INTERNALS];
      const headers = new Headers(request[INTERNALS].headers);
      if (!headers.has("Accept")) {
        headers.set("Accept", "*/*");
      }
      let contentLengthValue = null;
      if (request.body === null && /^(post|put)$/i.test(request.method)) {
        contentLengthValue = "0";
      }
      if (request.body !== null) {
        const totalBytes = getTotalBytes(request);
        if (typeof totalBytes === "number" && !Number.isNaN(totalBytes)) {
          contentLengthValue = String(totalBytes);
        }
      }
      if (contentLengthValue) {
        headers.set("Content-Length", contentLengthValue);
      }
      if (!headers.has("User-Agent")) {
        headers.set("User-Agent", "node-fetch");
      }
      if (request.compress && !headers.has("Accept-Encoding")) {
        headers.set("Accept-Encoding", "gzip,deflate,br");
      }
      let { agent } = request;
      if (typeof agent === "function") {
        agent = agent(parsedURL);
      }
      if (!headers.has("Connection") && !agent) {
        headers.set("Connection", "close");
      }
      const search = getSearch(parsedURL);
      const requestOptions = {
        path: parsedURL.pathname + search,
        pathname: parsedURL.pathname,
        hostname: parsedURL.hostname,
        protocol: parsedURL.protocol,
        port: parsedURL.port,
        hash: parsedURL.hash,
        search: parsedURL.search,
        query: parsedURL.query,
        href: parsedURL.href,
        method: request.method,
        headers: headers[Symbol.for("nodejs.util.inspect.custom")](),
        insecureHTTPParser: request.insecureHTTPParser,
        agent
      };
      return requestOptions;
    };
    AbortError = class extends FetchBaseError {
      constructor(message2, type = "aborted") {
        super(message2, type);
      }
    };
    supportedSchemas = new Set(["data:", "http:", "https:"]);
  }
});

// node_modules/@sveltejs/adapter-netlify/files/shims.js
var init_shims = __esm({
  "node_modules/@sveltejs/adapter-netlify/files/shims.js"() {
    init_install_fetch();
  }
});

// node_modules/cookie/index.js
var require_cookie = __commonJS({
  "node_modules/cookie/index.js"(exports) {
    init_shims();
    "use strict";
    exports.parse = parse;
    exports.serialize = serialize;
    var decode = decodeURIComponent;
    var encode = encodeURIComponent;
    var pairSplitRegExp = /; */;
    var fieldContentRegExp = /^[\u0009\u0020-\u007e\u0080-\u00ff]+$/;
    function parse(str, options2) {
      if (typeof str !== "string") {
        throw new TypeError("argument str must be a string");
      }
      var obj = {};
      var opt = options2 || {};
      var pairs = str.split(pairSplitRegExp);
      var dec = opt.decode || decode;
      for (var i = 0; i < pairs.length; i++) {
        var pair = pairs[i];
        var eq_idx = pair.indexOf("=");
        if (eq_idx < 0) {
          continue;
        }
        var key = pair.substr(0, eq_idx).trim();
        var val = pair.substr(++eq_idx, pair.length).trim();
        if (val[0] == '"') {
          val = val.slice(1, -1);
        }
        if (obj[key] == void 0) {
          obj[key] = tryDecode(val, dec);
        }
      }
      return obj;
    }
    function serialize(name2, val, options2) {
      var opt = options2 || {};
      var enc = opt.encode || encode;
      if (typeof enc !== "function") {
        throw new TypeError("option encode is invalid");
      }
      if (!fieldContentRegExp.test(name2)) {
        throw new TypeError("argument name is invalid");
      }
      var value = enc(val);
      if (value && !fieldContentRegExp.test(value)) {
        throw new TypeError("argument val is invalid");
      }
      var str = name2 + "=" + value;
      if (opt.maxAge != null) {
        var maxAge = opt.maxAge - 0;
        if (isNaN(maxAge) || !isFinite(maxAge)) {
          throw new TypeError("option maxAge is invalid");
        }
        str += "; Max-Age=" + Math.floor(maxAge);
      }
      if (opt.domain) {
        if (!fieldContentRegExp.test(opt.domain)) {
          throw new TypeError("option domain is invalid");
        }
        str += "; Domain=" + opt.domain;
      }
      if (opt.path) {
        if (!fieldContentRegExp.test(opt.path)) {
          throw new TypeError("option path is invalid");
        }
        str += "; Path=" + opt.path;
      }
      if (opt.expires) {
        if (typeof opt.expires.toUTCString !== "function") {
          throw new TypeError("option expires is invalid");
        }
        str += "; Expires=" + opt.expires.toUTCString();
      }
      if (opt.httpOnly) {
        str += "; HttpOnly";
      }
      if (opt.secure) {
        str += "; Secure";
      }
      if (opt.sameSite) {
        var sameSite = typeof opt.sameSite === "string" ? opt.sameSite.toLowerCase() : opt.sameSite;
        switch (sameSite) {
          case true:
            str += "; SameSite=Strict";
            break;
          case "lax":
            str += "; SameSite=Lax";
            break;
          case "strict":
            str += "; SameSite=Strict";
            break;
          case "none":
            str += "; SameSite=None";
            break;
          default:
            throw new TypeError("option sameSite is invalid");
        }
      }
      return str;
    }
    function tryDecode(str, decode2) {
      try {
        return decode2(str);
      } catch (e) {
        return str;
      }
    }
  }
});

// .svelte-kit/netlify/entry.js
__export(exports, {
  handler: () => handler
});
init_shims();

// .svelte-kit/output/server/app.js
init_shims();

// node_modules/@sveltejs/kit/dist/ssr.js
init_shims();

// node_modules/@sveltejs/kit/dist/adapter-utils.js
init_shims();
function isContentTypeTextual(content_type) {
  if (!content_type)
    return true;
  const [type] = content_type.split(";");
  return type === "text/plain" || type === "application/json" || type === "application/x-www-form-urlencoded" || type === "multipart/form-data";
}

// node_modules/@sveltejs/kit/dist/ssr.js
function lowercase_keys(obj) {
  const clone2 = {};
  for (const key in obj) {
    clone2[key.toLowerCase()] = obj[key];
  }
  return clone2;
}
function error(body) {
  return {
    status: 500,
    body,
    headers: {}
  };
}
function is_string(s2) {
  return typeof s2 === "string" || s2 instanceof String;
}
async function render_endpoint(request, route) {
  const mod = await route.load();
  const handler2 = mod[request.method.toLowerCase().replace("delete", "del")];
  if (!handler2) {
    return;
  }
  const match = route.pattern.exec(request.path);
  if (!match) {
    return error("could not parse parameters from request path");
  }
  const params = route.params(match);
  const response = await handler2({ ...request, params });
  const preface = `Invalid response from route ${request.path}`;
  if (!response) {
    return;
  }
  if (typeof response !== "object") {
    return error(`${preface}: expected an object, got ${typeof response}`);
  }
  let { status = 200, body, headers = {} } = response;
  headers = lowercase_keys(headers);
  const type = headers["content-type"];
  const is_type_textual = isContentTypeTextual(type);
  if (!is_type_textual && !(body instanceof Uint8Array || is_string(body))) {
    return error(`${preface}: body must be an instance of string or Uint8Array if content-type is not a supported textual content-type`);
  }
  let normalized_body;
  if ((typeof body === "object" || typeof body === "undefined") && !(body instanceof Uint8Array) && (!type || type.startsWith("application/json"))) {
    headers = { ...headers, "content-type": "application/json; charset=utf-8" };
    normalized_body = JSON.stringify(typeof body === "undefined" ? {} : body);
  } else {
    normalized_body = body;
  }
  return { status, body: normalized_body, headers };
}
var chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_$";
var unsafeChars = /[<>\b\f\n\r\t\0\u2028\u2029]/g;
var reserved = /^(?:do|if|in|for|int|let|new|try|var|byte|case|char|else|enum|goto|long|this|void|with|await|break|catch|class|const|final|float|short|super|throw|while|yield|delete|double|export|import|native|return|switch|throws|typeof|boolean|default|extends|finally|package|private|abstract|continue|debugger|function|volatile|interface|protected|transient|implements|instanceof|synchronized)$/;
var escaped$1 = {
  "<": "\\u003C",
  ">": "\\u003E",
  "/": "\\u002F",
  "\\": "\\\\",
  "\b": "\\b",
  "\f": "\\f",
  "\n": "\\n",
  "\r": "\\r",
  "	": "\\t",
  "\0": "\\0",
  "\u2028": "\\u2028",
  "\u2029": "\\u2029"
};
var objectProtoOwnPropertyNames = Object.getOwnPropertyNames(Object.prototype).sort().join("\0");
function devalue(value) {
  var counts = new Map();
  function walk(thing) {
    if (typeof thing === "function") {
      throw new Error("Cannot stringify a function");
    }
    if (counts.has(thing)) {
      counts.set(thing, counts.get(thing) + 1);
      return;
    }
    counts.set(thing, 1);
    if (!isPrimitive(thing)) {
      var type = getType(thing);
      switch (type) {
        case "Number":
        case "String":
        case "Boolean":
        case "Date":
        case "RegExp":
          return;
        case "Array":
          thing.forEach(walk);
          break;
        case "Set":
        case "Map":
          Array.from(thing).forEach(walk);
          break;
        default:
          var proto = Object.getPrototypeOf(thing);
          if (proto !== Object.prototype && proto !== null && Object.getOwnPropertyNames(proto).sort().join("\0") !== objectProtoOwnPropertyNames) {
            throw new Error("Cannot stringify arbitrary non-POJOs");
          }
          if (Object.getOwnPropertySymbols(thing).length > 0) {
            throw new Error("Cannot stringify POJOs with symbolic keys");
          }
          Object.keys(thing).forEach(function(key) {
            return walk(thing[key]);
          });
      }
    }
  }
  walk(value);
  var names = new Map();
  Array.from(counts).filter(function(entry) {
    return entry[1] > 1;
  }).sort(function(a, b) {
    return b[1] - a[1];
  }).forEach(function(entry, i) {
    names.set(entry[0], getName(i));
  });
  function stringify(thing) {
    if (names.has(thing)) {
      return names.get(thing);
    }
    if (isPrimitive(thing)) {
      return stringifyPrimitive(thing);
    }
    var type = getType(thing);
    switch (type) {
      case "Number":
      case "String":
      case "Boolean":
        return "Object(" + stringify(thing.valueOf()) + ")";
      case "RegExp":
        return "new RegExp(" + stringifyString(thing.source) + ', "' + thing.flags + '")';
      case "Date":
        return "new Date(" + thing.getTime() + ")";
      case "Array":
        var members = thing.map(function(v, i) {
          return i in thing ? stringify(v) : "";
        });
        var tail = thing.length === 0 || thing.length - 1 in thing ? "" : ",";
        return "[" + members.join(",") + tail + "]";
      case "Set":
      case "Map":
        return "new " + type + "([" + Array.from(thing).map(stringify).join(",") + "])";
      default:
        var obj = "{" + Object.keys(thing).map(function(key) {
          return safeKey(key) + ":" + stringify(thing[key]);
        }).join(",") + "}";
        var proto = Object.getPrototypeOf(thing);
        if (proto === null) {
          return Object.keys(thing).length > 0 ? "Object.assign(Object.create(null)," + obj + ")" : "Object.create(null)";
        }
        return obj;
    }
  }
  var str = stringify(value);
  if (names.size) {
    var params_1 = [];
    var statements_1 = [];
    var values_1 = [];
    names.forEach(function(name2, thing) {
      params_1.push(name2);
      if (isPrimitive(thing)) {
        values_1.push(stringifyPrimitive(thing));
        return;
      }
      var type = getType(thing);
      switch (type) {
        case "Number":
        case "String":
        case "Boolean":
          values_1.push("Object(" + stringify(thing.valueOf()) + ")");
          break;
        case "RegExp":
          values_1.push(thing.toString());
          break;
        case "Date":
          values_1.push("new Date(" + thing.getTime() + ")");
          break;
        case "Array":
          values_1.push("Array(" + thing.length + ")");
          thing.forEach(function(v, i) {
            statements_1.push(name2 + "[" + i + "]=" + stringify(v));
          });
          break;
        case "Set":
          values_1.push("new Set");
          statements_1.push(name2 + "." + Array.from(thing).map(function(v) {
            return "add(" + stringify(v) + ")";
          }).join("."));
          break;
        case "Map":
          values_1.push("new Map");
          statements_1.push(name2 + "." + Array.from(thing).map(function(_a) {
            var k = _a[0], v = _a[1];
            return "set(" + stringify(k) + ", " + stringify(v) + ")";
          }).join("."));
          break;
        default:
          values_1.push(Object.getPrototypeOf(thing) === null ? "Object.create(null)" : "{}");
          Object.keys(thing).forEach(function(key) {
            statements_1.push("" + name2 + safeProp(key) + "=" + stringify(thing[key]));
          });
      }
    });
    statements_1.push("return " + str);
    return "(function(" + params_1.join(",") + "){" + statements_1.join(";") + "}(" + values_1.join(",") + "))";
  } else {
    return str;
  }
}
function getName(num) {
  var name2 = "";
  do {
    name2 = chars[num % chars.length] + name2;
    num = ~~(num / chars.length) - 1;
  } while (num >= 0);
  return reserved.test(name2) ? name2 + "_" : name2;
}
function isPrimitive(thing) {
  return Object(thing) !== thing;
}
function stringifyPrimitive(thing) {
  if (typeof thing === "string")
    return stringifyString(thing);
  if (thing === void 0)
    return "void 0";
  if (thing === 0 && 1 / thing < 0)
    return "-0";
  var str = String(thing);
  if (typeof thing === "number")
    return str.replace(/^(-)?0\./, "$1.");
  return str;
}
function getType(thing) {
  return Object.prototype.toString.call(thing).slice(8, -1);
}
function escapeUnsafeChar(c) {
  return escaped$1[c] || c;
}
function escapeUnsafeChars(str) {
  return str.replace(unsafeChars, escapeUnsafeChar);
}
function safeKey(key) {
  return /^[_$a-zA-Z][_$a-zA-Z0-9]*$/.test(key) ? key : escapeUnsafeChars(JSON.stringify(key));
}
function safeProp(key) {
  return /^[_$a-zA-Z][_$a-zA-Z0-9]*$/.test(key) ? "." + key : "[" + escapeUnsafeChars(JSON.stringify(key)) + "]";
}
function stringifyString(str) {
  var result = '"';
  for (var i = 0; i < str.length; i += 1) {
    var char = str.charAt(i);
    var code = char.charCodeAt(0);
    if (char === '"') {
      result += '\\"';
    } else if (char in escaped$1) {
      result += escaped$1[char];
    } else if (code >= 55296 && code <= 57343) {
      var next = str.charCodeAt(i + 1);
      if (code <= 56319 && (next >= 56320 && next <= 57343)) {
        result += char + str[++i];
      } else {
        result += "\\u" + code.toString(16).toUpperCase();
      }
    } else {
      result += char;
    }
  }
  result += '"';
  return result;
}
function noop() {
}
function safe_not_equal(a, b) {
  return a != a ? b == b : a !== b || (a && typeof a === "object" || typeof a === "function");
}
Promise.resolve();
var subscriber_queue = [];
function writable(value, start = noop) {
  let stop;
  const subscribers = [];
  function set(new_value) {
    if (safe_not_equal(value, new_value)) {
      value = new_value;
      if (stop) {
        const run_queue = !subscriber_queue.length;
        for (let i = 0; i < subscribers.length; i += 1) {
          const s2 = subscribers[i];
          s2[1]();
          subscriber_queue.push(s2, value);
        }
        if (run_queue) {
          for (let i = 0; i < subscriber_queue.length; i += 2) {
            subscriber_queue[i][0](subscriber_queue[i + 1]);
          }
          subscriber_queue.length = 0;
        }
      }
    }
  }
  function update(fn) {
    set(fn(value));
  }
  function subscribe(run2, invalidate = noop) {
    const subscriber = [run2, invalidate];
    subscribers.push(subscriber);
    if (subscribers.length === 1) {
      stop = start(set) || noop;
    }
    run2(value);
    return () => {
      const index2 = subscribers.indexOf(subscriber);
      if (index2 !== -1) {
        subscribers.splice(index2, 1);
      }
      if (subscribers.length === 0) {
        stop();
        stop = null;
      }
    };
  }
  return { set, update, subscribe };
}
function hash(value) {
  let hash2 = 5381;
  let i = value.length;
  if (typeof value === "string") {
    while (i)
      hash2 = hash2 * 33 ^ value.charCodeAt(--i);
  } else {
    while (i)
      hash2 = hash2 * 33 ^ value[--i];
  }
  return (hash2 >>> 0).toString(36);
}
var s$1 = JSON.stringify;
async function render_response({
  branch,
  options: options2,
  $session,
  page_config,
  status,
  error: error3,
  page
}) {
  const css2 = new Set(options2.entry.css);
  const js = new Set(options2.entry.js);
  const styles = new Set();
  const serialized_data = [];
  let rendered;
  let is_private = false;
  let maxage;
  if (error3) {
    error3.stack = options2.get_stack(error3);
  }
  if (page_config.ssr) {
    branch.forEach(({ node, loaded, fetched, uses_credentials }) => {
      if (node.css)
        node.css.forEach((url) => css2.add(url));
      if (node.js)
        node.js.forEach((url) => js.add(url));
      if (node.styles)
        node.styles.forEach((content) => styles.add(content));
      if (fetched && page_config.hydrate)
        serialized_data.push(...fetched);
      if (uses_credentials)
        is_private = true;
      maxage = loaded.maxage;
    });
    const session = writable($session);
    const props = {
      stores: {
        page: writable(null),
        navigating: writable(null),
        session
      },
      page,
      components: branch.map(({ node }) => node.module.default)
    };
    for (let i = 0; i < branch.length; i += 1) {
      props[`props_${i}`] = await branch[i].loaded.props;
    }
    let session_tracking_active = false;
    const unsubscribe = session.subscribe(() => {
      if (session_tracking_active)
        is_private = true;
    });
    session_tracking_active = true;
    try {
      rendered = options2.root.render(props);
    } finally {
      unsubscribe();
    }
  } else {
    rendered = { head: "", html: "", css: { code: "", map: null } };
  }
  const include_js = page_config.router || page_config.hydrate;
  if (!include_js)
    js.clear();
  const links = options2.amp ? styles.size > 0 || rendered.css.code.length > 0 ? `<style amp-custom>${Array.from(styles).concat(rendered.css.code).join("\n")}</style>` : "" : [
    ...Array.from(js).map((dep) => `<link rel="modulepreload" href="${dep}">`),
    ...Array.from(css2).map((dep) => `<link rel="stylesheet" href="${dep}">`)
  ].join("\n		");
  let init2 = "";
  if (options2.amp) {
    init2 = `
		<style amp-boilerplate>body{-webkit-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-moz-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-ms-animation:-amp-start 8s steps(1,end) 0s 1 normal both;animation:-amp-start 8s steps(1,end) 0s 1 normal both}@-webkit-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-moz-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-ms-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-o-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}</style>
		<noscript><style amp-boilerplate>body{-webkit-animation:none;-moz-animation:none;-ms-animation:none;animation:none}</style></noscript>
		<script async src="https://cdn.ampproject.org/v0.js"><\/script>`;
  } else if (include_js) {
    init2 = `<script type="module">
			import { start } from ${s$1(options2.entry.file)};
			start({
				target: ${options2.target ? `document.querySelector(${s$1(options2.target)})` : "document.body"},
				paths: ${s$1(options2.paths)},
				session: ${try_serialize($session, (error4) => {
      throw new Error(`Failed to serialize session data: ${error4.message}`);
    })},
				host: ${page && page.host ? s$1(page.host) : "location.host"},
				route: ${!!page_config.router},
				spa: ${!page_config.ssr},
				trailing_slash: ${s$1(options2.trailing_slash)},
				hydrate: ${page_config.ssr && page_config.hydrate ? `{
					status: ${status},
					error: ${serialize_error(error3)},
					nodes: [
						${(branch || []).map(({ node }) => `import(${s$1(node.entry)})`).join(",\n						")}
					],
					page: {
						host: ${page && page.host ? s$1(page.host) : "location.host"}, // TODO this is redundant
						path: ${s$1(page && page.path)},
						query: new URLSearchParams(${page ? s$1(page.query.toString()) : ""}),
						params: ${page && s$1(page.params)}
					}
				}` : "null"}
			});
		<\/script>`;
  }
  if (options2.service_worker) {
    init2 += `<script>
			if ('serviceWorker' in navigator) {
				navigator.serviceWorker.register('${options2.service_worker}');
			}
		<\/script>`;
  }
  const head = [
    rendered.head,
    styles.size && !options2.amp ? `<style data-svelte>${Array.from(styles).join("\n")}</style>` : "",
    links,
    init2
  ].join("\n\n		");
  const body = options2.amp ? rendered.html : `${rendered.html}

			${serialized_data.map(({ url, body: body2, json }) => {
    let attributes = `type="application/json" data-type="svelte-data" data-url="${url}"`;
    if (body2)
      attributes += ` data-body="${hash(body2)}"`;
    return `<script ${attributes}>${json}<\/script>`;
  }).join("\n\n			")}
		`.replace(/^\t{2}/gm, "");
  const headers = {
    "content-type": "text/html"
  };
  if (maxage) {
    headers["cache-control"] = `${is_private ? "private" : "public"}, max-age=${maxage}`;
  }
  if (!options2.floc) {
    headers["permissions-policy"] = "interest-cohort=()";
  }
  return {
    status,
    headers,
    body: options2.template({ head, body })
  };
}
function try_serialize(data, fail) {
  try {
    return devalue(data);
  } catch (err) {
    if (fail)
      fail(err);
    return null;
  }
}
function serialize_error(error3) {
  if (!error3)
    return null;
  let serialized = try_serialize(error3);
  if (!serialized) {
    const { name: name2, message: message2, stack } = error3;
    serialized = try_serialize({ ...error3, name: name2, message: message2, stack });
  }
  if (!serialized) {
    serialized = "{}";
  }
  return serialized;
}
function normalize(loaded) {
  const has_error_status = loaded.status && loaded.status >= 400 && loaded.status <= 599 && !loaded.redirect;
  if (loaded.error || has_error_status) {
    const status = loaded.status;
    if (!loaded.error && has_error_status) {
      return {
        status: status || 500,
        error: new Error()
      };
    }
    const error3 = typeof loaded.error === "string" ? new Error(loaded.error) : loaded.error;
    if (!(error3 instanceof Error)) {
      return {
        status: 500,
        error: new Error(`"error" property returned from load() must be a string or instance of Error, received type "${typeof error3}"`)
      };
    }
    if (!status || status < 400 || status > 599) {
      console.warn('"error" returned from load() without a valid status code \u2014 defaulting to 500');
      return { status: 500, error: error3 };
    }
    return { status, error: error3 };
  }
  if (loaded.redirect) {
    if (!loaded.status || Math.floor(loaded.status / 100) !== 3) {
      return {
        status: 500,
        error: new Error('"redirect" property returned from load() must be accompanied by a 3xx status code')
      };
    }
    if (typeof loaded.redirect !== "string") {
      return {
        status: 500,
        error: new Error('"redirect" property returned from load() must be a string')
      };
    }
  }
  return loaded;
}
var s = JSON.stringify;
async function load_node({
  request,
  options: options2,
  state,
  route,
  page,
  node,
  $session,
  context,
  prerender_enabled,
  is_leaf,
  is_error,
  status,
  error: error3
}) {
  const { module: module2 } = node;
  let uses_credentials = false;
  const fetched = [];
  let loaded;
  const page_proxy = new Proxy(page, {
    get: (target, prop, receiver) => {
      if (prop === "query" && prerender_enabled) {
        throw new Error("Cannot access query on a page with prerendering enabled");
      }
      return Reflect.get(target, prop, receiver);
    }
  });
  if (module2.load) {
    const load_input = {
      page: page_proxy,
      get session() {
        uses_credentials = true;
        return $session;
      },
      fetch: async (resource, opts = {}) => {
        let url;
        if (typeof resource === "string") {
          url = resource;
        } else {
          url = resource.url;
          opts = {
            method: resource.method,
            headers: resource.headers,
            body: resource.body,
            mode: resource.mode,
            credentials: resource.credentials,
            cache: resource.cache,
            redirect: resource.redirect,
            referrer: resource.referrer,
            integrity: resource.integrity,
            ...opts
          };
        }
        const resolved = resolve(request.path, url.split("?")[0]);
        let response;
        const filename = resolved.replace(options2.paths.assets, "").slice(1);
        const filename_html = `${filename}/index.html`;
        const asset = options2.manifest.assets.find((d) => d.file === filename || d.file === filename_html);
        if (asset) {
          response = options2.read ? new Response(options2.read(asset.file), {
            headers: asset.type ? {
              "content-type": asset.type
            } : {}
          }) : await fetch(`http://${page.host}/${asset.file}`, opts);
        } else if (resolved.startsWith(options2.paths.base || "/") && !resolved.startsWith("//")) {
          const relative = resolved.replace(options2.paths.base, "");
          const headers = { ...opts.headers };
          if (opts.credentials !== "omit") {
            uses_credentials = true;
            headers.cookie = request.headers.cookie;
            if (!headers.authorization) {
              headers.authorization = request.headers.authorization;
            }
          }
          if (opts.body && typeof opts.body !== "string") {
            throw new Error("Request body must be a string");
          }
          const search = url.includes("?") ? url.slice(url.indexOf("?") + 1) : "";
          const rendered = await respond({
            host: request.host,
            method: opts.method || "GET",
            headers,
            path: relative,
            rawBody: opts.body,
            query: new URLSearchParams(search)
          }, options2, {
            fetched: url,
            initiator: route
          });
          if (rendered) {
            if (state.prerender) {
              state.prerender.dependencies.set(relative, rendered);
            }
            response = new Response(rendered.body, {
              status: rendered.status,
              headers: rendered.headers
            });
          }
        } else {
          if (resolved.startsWith("//")) {
            throw new Error(`Cannot request protocol-relative URL (${url}) in server-side fetch`);
          }
          if (typeof request.host !== "undefined") {
            const { hostname: fetch_hostname } = new URL(url);
            const [server_hostname] = request.host.split(":");
            if (`.${fetch_hostname}`.endsWith(`.${server_hostname}`) && opts.credentials !== "omit") {
              uses_credentials = true;
              opts.headers = {
                ...opts.headers,
                cookie: request.headers.cookie
              };
            }
          }
          const external_request = new Request(url, opts);
          response = await options2.hooks.serverFetch.call(null, external_request);
        }
        if (response) {
          const proxy = new Proxy(response, {
            get(response2, key, receiver) {
              async function text() {
                const body = await response2.text();
                const headers = {};
                for (const [key2, value] of response2.headers) {
                  if (key2 !== "etag" && key2 !== "set-cookie")
                    headers[key2] = value;
                }
                if (!opts.body || typeof opts.body === "string") {
                  fetched.push({
                    url,
                    body: opts.body,
                    json: `{"status":${response2.status},"statusText":${s(response2.statusText)},"headers":${s(headers)},"body":${escape(body)}}`
                  });
                }
                return body;
              }
              if (key === "text") {
                return text;
              }
              if (key === "json") {
                return async () => {
                  return JSON.parse(await text());
                };
              }
              return Reflect.get(response2, key, response2);
            }
          });
          return proxy;
        }
        return response || new Response("Not found", {
          status: 404
        });
      },
      context: { ...context }
    };
    if (is_error) {
      load_input.status = status;
      load_input.error = error3;
    }
    loaded = await module2.load.call(null, load_input);
  } else {
    loaded = {};
  }
  if (!loaded && is_leaf && !is_error)
    return;
  if (!loaded) {
    throw new Error(`${node.entry} - load must return a value except for page fall through`);
  }
  return {
    node,
    loaded: normalize(loaded),
    context: loaded.context || context,
    fetched,
    uses_credentials
  };
}
var escaped = {
  "<": "\\u003C",
  ">": "\\u003E",
  "/": "\\u002F",
  "\\": "\\\\",
  "\b": "\\b",
  "\f": "\\f",
  "\n": "\\n",
  "\r": "\\r",
  "	": "\\t",
  "\0": "\\0",
  "\u2028": "\\u2028",
  "\u2029": "\\u2029"
};
function escape(str) {
  let result = '"';
  for (let i = 0; i < str.length; i += 1) {
    const char = str.charAt(i);
    const code = char.charCodeAt(0);
    if (char === '"') {
      result += '\\"';
    } else if (char in escaped) {
      result += escaped[char];
    } else if (code >= 55296 && code <= 57343) {
      const next = str.charCodeAt(i + 1);
      if (code <= 56319 && next >= 56320 && next <= 57343) {
        result += char + str[++i];
      } else {
        result += `\\u${code.toString(16).toUpperCase()}`;
      }
    } else {
      result += char;
    }
  }
  result += '"';
  return result;
}
var absolute = /^([a-z]+:)?\/?\//;
function resolve(base, path) {
  const base_match = absolute.exec(base);
  const path_match = absolute.exec(path);
  if (!base_match) {
    throw new Error(`bad base path: "${base}"`);
  }
  const baseparts = path_match ? [] : base.slice(base_match[0].length).split("/");
  const pathparts = path_match ? path.slice(path_match[0].length).split("/") : path.split("/");
  baseparts.pop();
  for (let i = 0; i < pathparts.length; i += 1) {
    const part = pathparts[i];
    if (part === ".")
      continue;
    else if (part === "..")
      baseparts.pop();
    else
      baseparts.push(part);
  }
  const prefix = path_match && path_match[0] || base_match && base_match[0] || "";
  return `${prefix}${baseparts.join("/")}`;
}
function coalesce_to_error(err) {
  return err instanceof Error ? err : new Error(JSON.stringify(err));
}
async function respond_with_error({ request, options: options2, state, $session, status, error: error3 }) {
  const default_layout = await options2.load_component(options2.manifest.layout);
  const default_error = await options2.load_component(options2.manifest.error);
  const page = {
    host: request.host,
    path: request.path,
    query: request.query,
    params: {}
  };
  const loaded = await load_node({
    request,
    options: options2,
    state,
    route: null,
    page,
    node: default_layout,
    $session,
    context: {},
    prerender_enabled: is_prerender_enabled(options2, default_error, state),
    is_leaf: false,
    is_error: false
  });
  const branch = [
    loaded,
    await load_node({
      request,
      options: options2,
      state,
      route: null,
      page,
      node: default_error,
      $session,
      context: loaded ? loaded.context : {},
      prerender_enabled: is_prerender_enabled(options2, default_error, state),
      is_leaf: false,
      is_error: true,
      status,
      error: error3
    })
  ];
  try {
    return await render_response({
      options: options2,
      $session,
      page_config: {
        hydrate: options2.hydrate,
        router: options2.router,
        ssr: options2.ssr
      },
      status,
      error: error3,
      branch,
      page
    });
  } catch (err) {
    const error4 = coalesce_to_error(err);
    options2.handle_error(error4);
    return {
      status: 500,
      headers: {},
      body: error4.stack
    };
  }
}
function is_prerender_enabled(options2, node, state) {
  return options2.prerender && (!!node.module.prerender || !!state.prerender && state.prerender.all);
}
async function respond$1(opts) {
  const { request, options: options2, state, $session, route } = opts;
  let nodes;
  try {
    nodes = await Promise.all(route.a.map((id) => id ? options2.load_component(id) : void 0));
  } catch (err) {
    const error4 = coalesce_to_error(err);
    options2.handle_error(error4);
    return await respond_with_error({
      request,
      options: options2,
      state,
      $session,
      status: 500,
      error: error4
    });
  }
  const leaf = nodes[nodes.length - 1].module;
  let page_config = get_page_config(leaf, options2);
  if (!leaf.prerender && state.prerender && !state.prerender.all) {
    return {
      status: 204,
      headers: {},
      body: ""
    };
  }
  let branch = [];
  let status = 200;
  let error3;
  ssr:
    if (page_config.ssr) {
      let context = {};
      for (let i = 0; i < nodes.length; i += 1) {
        const node = nodes[i];
        let loaded;
        if (node) {
          try {
            loaded = await load_node({
              ...opts,
              node,
              context,
              prerender_enabled: is_prerender_enabled(options2, node, state),
              is_leaf: i === nodes.length - 1,
              is_error: false
            });
            if (!loaded)
              return;
            if (loaded.loaded.redirect) {
              return {
                status: loaded.loaded.status,
                headers: {
                  location: encodeURI(loaded.loaded.redirect)
                }
              };
            }
            if (loaded.loaded.error) {
              ({ status, error: error3 } = loaded.loaded);
            }
          } catch (err) {
            const e = coalesce_to_error(err);
            options2.handle_error(e);
            status = 500;
            error3 = e;
          }
          if (loaded && !error3) {
            branch.push(loaded);
          }
          if (error3) {
            while (i--) {
              if (route.b[i]) {
                const error_node = await options2.load_component(route.b[i]);
                let node_loaded;
                let j = i;
                while (!(node_loaded = branch[j])) {
                  j -= 1;
                }
                try {
                  const error_loaded = await load_node({
                    ...opts,
                    node: error_node,
                    context: node_loaded.context,
                    prerender_enabled: is_prerender_enabled(options2, error_node, state),
                    is_leaf: false,
                    is_error: true,
                    status,
                    error: error3
                  });
                  if (error_loaded.loaded.error) {
                    continue;
                  }
                  page_config = get_page_config(error_node.module, options2);
                  branch = branch.slice(0, j + 1).concat(error_loaded);
                  break ssr;
                } catch (err) {
                  const e = coalesce_to_error(err);
                  options2.handle_error(e);
                  continue;
                }
              }
            }
            return await respond_with_error({
              request,
              options: options2,
              state,
              $session,
              status,
              error: error3
            });
          }
        }
        if (loaded && loaded.loaded.context) {
          context = {
            ...context,
            ...loaded.loaded.context
          };
        }
      }
    }
  try {
    return await render_response({
      ...opts,
      page_config,
      status,
      error: error3,
      branch: branch.filter(Boolean)
    });
  } catch (err) {
    const error4 = coalesce_to_error(err);
    options2.handle_error(error4);
    return await respond_with_error({
      ...opts,
      status: 500,
      error: error4
    });
  }
}
function get_page_config(leaf, options2) {
  return {
    ssr: "ssr" in leaf ? !!leaf.ssr : options2.ssr,
    router: "router" in leaf ? !!leaf.router : options2.router,
    hydrate: "hydrate" in leaf ? !!leaf.hydrate : options2.hydrate
  };
}
async function render_page(request, route, options2, state) {
  if (state.initiator === route) {
    return {
      status: 404,
      headers: {},
      body: `Not found: ${request.path}`
    };
  }
  const match = route.pattern.exec(request.path);
  const params = route.params(match);
  const page = {
    host: request.host,
    path: request.path,
    query: request.query,
    params
  };
  const $session = await options2.hooks.getSession(request);
  const response = await respond$1({
    request,
    options: options2,
    state,
    $session,
    route,
    page
  });
  if (response) {
    return response;
  }
  if (state.fetched) {
    return {
      status: 500,
      headers: {},
      body: `Bad request in load function: failed to fetch ${state.fetched}`
    };
  }
}
function read_only_form_data() {
  const map = new Map();
  return {
    append(key, value) {
      if (map.has(key)) {
        (map.get(key) || []).push(value);
      } else {
        map.set(key, [value]);
      }
    },
    data: new ReadOnlyFormData(map)
  };
}
var ReadOnlyFormData = class {
  #map;
  constructor(map) {
    this.#map = map;
  }
  get(key) {
    const value = this.#map.get(key);
    return value && value[0];
  }
  getAll(key) {
    return this.#map.get(key);
  }
  has(key) {
    return this.#map.has(key);
  }
  *[Symbol.iterator]() {
    for (const [key, value] of this.#map) {
      for (let i = 0; i < value.length; i += 1) {
        yield [key, value[i]];
      }
    }
  }
  *entries() {
    for (const [key, value] of this.#map) {
      for (let i = 0; i < value.length; i += 1) {
        yield [key, value[i]];
      }
    }
  }
  *keys() {
    for (const [key] of this.#map)
      yield key;
  }
  *values() {
    for (const [, value] of this.#map) {
      for (let i = 0; i < value.length; i += 1) {
        yield value[i];
      }
    }
  }
};
function parse_body(raw, headers) {
  if (!raw || typeof raw !== "string")
    return raw;
  const [type, ...directives] = headers["content-type"].split(/;\s*/);
  switch (type) {
    case "text/plain":
      return raw;
    case "application/json":
      return JSON.parse(raw);
    case "application/x-www-form-urlencoded":
      return get_urlencoded(raw);
    case "multipart/form-data": {
      const boundary = directives.find((directive) => directive.startsWith("boundary="));
      if (!boundary)
        throw new Error("Missing boundary");
      return get_multipart(raw, boundary.slice("boundary=".length));
    }
    default:
      throw new Error(`Invalid Content-Type ${type}`);
  }
}
function get_urlencoded(text) {
  const { data, append } = read_only_form_data();
  text.replace(/\+/g, " ").split("&").forEach((str) => {
    const [key, value] = str.split("=");
    append(decodeURIComponent(key), decodeURIComponent(value));
  });
  return data;
}
function get_multipart(text, boundary) {
  const parts = text.split(`--${boundary}`);
  if (parts[0] !== "" || parts[parts.length - 1].trim() !== "--") {
    throw new Error("Malformed form data");
  }
  const { data, append } = read_only_form_data();
  parts.slice(1, -1).forEach((part) => {
    const match = /\s*([\s\S]+?)\r\n\r\n([\s\S]*)\s*/.exec(part);
    if (!match) {
      throw new Error("Malformed form data");
    }
    const raw_headers = match[1];
    const body = match[2].trim();
    let key;
    const headers = {};
    raw_headers.split("\r\n").forEach((str) => {
      const [raw_header, ...raw_directives] = str.split("; ");
      let [name2, value] = raw_header.split(": ");
      name2 = name2.toLowerCase();
      headers[name2] = value;
      const directives = {};
      raw_directives.forEach((raw_directive) => {
        const [name3, value2] = raw_directive.split("=");
        directives[name3] = JSON.parse(value2);
      });
      if (name2 === "content-disposition") {
        if (value !== "form-data")
          throw new Error("Malformed form data");
        if (directives.filename) {
          throw new Error("File upload is not yet implemented");
        }
        if (directives.name) {
          key = directives.name;
        }
      }
    });
    if (!key)
      throw new Error("Malformed form data");
    append(key, body);
  });
  return data;
}
async function respond(incoming, options2, state = {}) {
  if (incoming.path !== "/" && options2.trailing_slash !== "ignore") {
    const has_trailing_slash = incoming.path.endsWith("/");
    if (has_trailing_slash && options2.trailing_slash === "never" || !has_trailing_slash && options2.trailing_slash === "always" && !(incoming.path.split("/").pop() || "").includes(".")) {
      const path = has_trailing_slash ? incoming.path.slice(0, -1) : incoming.path + "/";
      const q = incoming.query.toString();
      return {
        status: 301,
        headers: {
          location: path + (q ? `?${q}` : "")
        }
      };
    }
  }
  try {
    const headers = lowercase_keys(incoming.headers);
    return await options2.hooks.handle({
      request: {
        ...incoming,
        headers,
        body: parse_body(incoming.rawBody, headers),
        params: {},
        locals: {}
      },
      resolve: async (request) => {
        if (state.prerender && state.prerender.fallback) {
          return await render_response({
            options: options2,
            $session: await options2.hooks.getSession(request),
            page_config: { ssr: false, router: true, hydrate: true },
            status: 200,
            branch: []
          });
        }
        for (const route of options2.manifest.routes) {
          if (!route.pattern.test(decodeURI(request.path)))
            continue;
          const response = route.type === "endpoint" ? await render_endpoint(request, route) : await render_page(request, route, options2, state);
          if (response) {
            if (response.status === 200) {
              if (!/(no-store|immutable)/.test(response.headers["cache-control"])) {
                const etag = `"${hash(response.body || "")}"`;
                if (request.headers["if-none-match"] === etag) {
                  return {
                    status: 304,
                    headers: {},
                    body: ""
                  };
                }
                response.headers["etag"] = etag;
              }
            }
            return response;
          }
        }
        const $session = await options2.hooks.getSession(request);
        return await respond_with_error({
          request,
          options: options2,
          state,
          $session,
          status: 404,
          error: new Error(`Not found: ${request.path}`)
        });
      }
    });
  } catch (err) {
    const e = coalesce_to_error(err);
    options2.handle_error(e);
    return {
      status: 500,
      headers: {},
      body: options2.dev ? e.stack : e.message
    };
  }
}

// .svelte-kit/output/server/app.js
var import_cookie = __toModule(require_cookie());

// node_modules/@lukeed/uuid/dist/index.mjs
init_shims();
var IDX = 256;
var HEX = [];
var BUFFER;
while (IDX--)
  HEX[IDX] = (IDX + 256).toString(16).substring(1);
function v4() {
  var i = 0, num, out = "";
  if (!BUFFER || IDX + 16 > 256) {
    BUFFER = Array(i = 256);
    while (i--)
      BUFFER[i] = 256 * Math.random() | 0;
    i = IDX = 0;
  }
  for (; i < 16; i++) {
    num = BUFFER[IDX + i];
    if (i == 6)
      out += HEX[num & 15 | 64];
    else if (i == 8)
      out += HEX[num & 63 | 128];
    else
      out += HEX[num];
    if (i & 1 && i > 1 && i < 11)
      out += "-";
  }
  IDX++;
  return out;
}

// .svelte-kit/output/server/app.js
function run(fn) {
  return fn();
}
function blank_object() {
  return Object.create(null);
}
function run_all(fns) {
  fns.forEach(run);
}
var current_component;
function set_current_component(component) {
  current_component = component;
}
function get_current_component() {
  if (!current_component)
    throw new Error("Function called outside component initialization");
  return current_component;
}
function setContext(key, context) {
  get_current_component().$$.context.set(key, context);
}
Promise.resolve();
var escaped2 = {
  '"': "&quot;",
  "'": "&#39;",
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;"
};
function escape2(html) {
  return String(html).replace(/["'&<>]/g, (match) => escaped2[match]);
}
var missing_component = {
  $$render: () => ""
};
function validate_component(component, name2) {
  if (!component || !component.$$render) {
    if (name2 === "svelte:component")
      name2 += " this={...}";
    throw new Error(`<${name2}> is not a valid SSR component. You may need to review your build config to ensure that dependencies are compiled, rather than imported as pre-compiled modules`);
  }
  return component;
}
var on_destroy;
function create_ssr_component(fn) {
  function $$render(result, props, bindings, slots, context) {
    const parent_component = current_component;
    const $$ = {
      on_destroy,
      context: new Map(parent_component ? parent_component.$$.context : context || []),
      on_mount: [],
      before_update: [],
      after_update: [],
      callbacks: blank_object()
    };
    set_current_component({ $$ });
    const html = fn(result, props, bindings, slots);
    set_current_component(parent_component);
    return html;
  }
  return {
    render: (props = {}, { $$slots = {}, context = new Map() } = {}) => {
      on_destroy = [];
      const result = { title: "", head: "", css: new Set() };
      const html = $$render(result, props, {}, $$slots, context);
      run_all(on_destroy);
      return {
        html,
        css: {
          code: Array.from(result.css).map((css2) => css2.code).join("\n"),
          map: null
        },
        head: result.title + result.head
      };
    },
    $$render
  };
}
function add_attribute(name2, value, boolean) {
  if (value == null || boolean && !value)
    return "";
  return ` ${name2}${value === true ? "" : `=${typeof value === "string" ? JSON.stringify(escape2(value)) : `"${value}"`}`}`;
}
function afterUpdate() {
}
var css$2 = {
  code: "#svelte-announcer.svelte-1j55zn5{position:absolute;left:0;top:0;clip:rect(0 0 0 0);clip-path:inset(50%);overflow:hidden;white-space:nowrap;width:1px;height:1px}",
  map: `{"version":3,"file":"root.svelte","sources":["root.svelte"],"sourcesContent":["<!-- This file is generated by @sveltejs/kit \u2014 do not edit it! -->\\n<script>\\n\\timport { setContext, afterUpdate, onMount } from 'svelte';\\n\\n\\t// stores\\n\\texport let stores;\\n\\texport let page;\\n\\n\\texport let components;\\n\\texport let props_0 = null;\\n\\texport let props_1 = null;\\n\\texport let props_2 = null;\\n\\n\\tsetContext('__svelte__', stores);\\n\\n\\t$: stores.page.set(page);\\n\\tafterUpdate(stores.page.notify);\\n\\n\\tlet mounted = false;\\n\\tlet navigated = false;\\n\\tlet title = null;\\n\\n\\tonMount(() => {\\n\\t\\tconst unsubscribe = stores.page.subscribe(() => {\\n\\t\\t\\tif (mounted) {\\n\\t\\t\\t\\tnavigated = true;\\n\\t\\t\\t\\ttitle = document.title || 'untitled page';\\n\\t\\t\\t}\\n\\t\\t});\\n\\n\\t\\tmounted = true;\\n\\t\\treturn unsubscribe;\\n\\t});\\n<\/script>\\n\\n<svelte:component this={components[0]} {...(props_0 || {})}>\\n\\t{#if components[1]}\\n\\t\\t<svelte:component this={components[1]} {...(props_1 || {})}>\\n\\t\\t\\t{#if components[2]}\\n\\t\\t\\t\\t<svelte:component this={components[2]} {...(props_2 || {})}/>\\n\\t\\t\\t{/if}\\n\\t\\t</svelte:component>\\n\\t{/if}\\n</svelte:component>\\n\\n{#if mounted}\\n\\t<div id=\\"svelte-announcer\\" aria-live=\\"assertive\\" aria-atomic=\\"true\\">\\n\\t\\t{#if navigated}\\n\\t\\t\\t{title}\\n\\t\\t{/if}\\n\\t</div>\\n{/if}\\n\\n<style>\\n\\t#svelte-announcer {\\n\\t\\tposition: absolute;\\n\\t\\tleft: 0;\\n\\t\\ttop: 0;\\n\\t\\tclip: rect(0 0 0 0);\\n\\t\\tclip-path: inset(50%);\\n\\t\\toverflow: hidden;\\n\\t\\twhite-space: nowrap;\\n\\t\\twidth: 1px;\\n\\t\\theight: 1px;\\n\\t}\\n</style>"],"names":[],"mappings":"AAsDC,iBAAiB,eAAC,CAAC,AAClB,QAAQ,CAAE,QAAQ,CAClB,IAAI,CAAE,CAAC,CACP,GAAG,CAAE,CAAC,CACN,IAAI,CAAE,KAAK,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CACnB,SAAS,CAAE,MAAM,GAAG,CAAC,CACrB,QAAQ,CAAE,MAAM,CAChB,WAAW,CAAE,MAAM,CACnB,KAAK,CAAE,GAAG,CACV,MAAM,CAAE,GAAG,AACZ,CAAC"}`
};
var Root = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { stores } = $$props;
  let { page } = $$props;
  let { components } = $$props;
  let { props_0 = null } = $$props;
  let { props_1 = null } = $$props;
  let { props_2 = null } = $$props;
  setContext("__svelte__", stores);
  afterUpdate(stores.page.notify);
  if ($$props.stores === void 0 && $$bindings.stores && stores !== void 0)
    $$bindings.stores(stores);
  if ($$props.page === void 0 && $$bindings.page && page !== void 0)
    $$bindings.page(page);
  if ($$props.components === void 0 && $$bindings.components && components !== void 0)
    $$bindings.components(components);
  if ($$props.props_0 === void 0 && $$bindings.props_0 && props_0 !== void 0)
    $$bindings.props_0(props_0);
  if ($$props.props_1 === void 0 && $$bindings.props_1 && props_1 !== void 0)
    $$bindings.props_1(props_1);
  if ($$props.props_2 === void 0 && $$bindings.props_2 && props_2 !== void 0)
    $$bindings.props_2(props_2);
  $$result.css.add(css$2);
  {
    stores.page.set(page);
  }
  return `


${validate_component(components[0] || missing_component, "svelte:component").$$render($$result, Object.assign(props_0 || {}), {}, {
    default: () => `${components[1] ? `${validate_component(components[1] || missing_component, "svelte:component").$$render($$result, Object.assign(props_1 || {}), {}, {
      default: () => `${components[2] ? `${validate_component(components[2] || missing_component, "svelte:component").$$render($$result, Object.assign(props_2 || {}), {}, {})}` : ``}`
    })}` : ``}`
  })}

${``}`;
});
function set_paths(paths) {
}
function set_prerendering(value) {
}
var handle = async ({ request, resolve: resolve2 }) => {
  const cookies = import_cookie.default.parse(request.headers.cookie || "");
  request.locals.userid = cookies.userid || v4();
  if (request.query.has("_method")) {
    request.method = request.query.get("_method").toUpperCase();
  }
  const response = await resolve2(request);
  if (!cookies.userid) {
    response.headers["set-cookie"] = `userid=${request.locals.userid}; Path=/; HttpOnly`;
  }
  return response;
};
var user_hooks = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  handle
});
var template = ({ head, body }) => '<!DOCTYPE html>\n<html lang="en">\n	<head>\n		<meta charset="utf-8" />\n		<link rel="icon" href="/favicon.png" />\n		<meta name="viewport" content="width=device-width, initial-scale=1" />\n\n		' + head + '\n	</head>\n	<body>\n		<div id="svelte">' + body + "</div>\n	</body>\n</html>\n";
var options = null;
var default_settings = { paths: { "base": "", "assets": "/." } };
function init(settings = default_settings) {
  set_paths(settings.paths);
  set_prerendering(settings.prerendering || false);
  options = {
    amp: false,
    dev: false,
    entry: {
      file: "/./_app/start-8f73657a.js",
      css: ["/./_app/assets/start-a8cd1609.css"],
      js: ["/./_app/start-8f73657a.js", "/./_app/chunks/vendor-415c350a.js"]
    },
    fetched: void 0,
    floc: false,
    get_component_path: (id) => "/./_app/" + entry_lookup[id],
    get_stack: (error22) => String(error22),
    handle_error: (error22) => {
      if (error22.frame) {
        console.error(error22.frame);
      }
      console.error(error22.stack);
      error22.stack = options.get_stack(error22);
    },
    hooks: get_hooks(user_hooks),
    hydrate: true,
    initiator: void 0,
    load_component,
    manifest,
    paths: settings.paths,
    prerender: true,
    read: settings.read,
    root: Root,
    service_worker: null,
    router: true,
    ssr: true,
    target: "#svelte",
    template,
    trailing_slash: "never"
  };
}
var empty = () => ({});
var manifest = {
  assets: [{ "file": "favicon.png", "size": 1571, "type": "image/png" }, { "file": "robots.txt", "size": 67, "type": "text/plain" }, { "file": "svelte-welcome.png", "size": 360807, "type": "image/png" }, { "file": "svelte-welcome.webp", "size": 115470, "type": "image/webp" }],
  layout: "src/routes/__layout.svelte",
  error: ".svelte-kit/build/components/error.svelte",
  routes: [
    {
      type: "page",
      pattern: /^\/$/,
      params: empty,
      a: ["src/routes/__layout.svelte", "src/routes/index.svelte"],
      b: [".svelte-kit/build/components/error.svelte"]
    }
  ]
};
var get_hooks = (hooks) => ({
  getSession: hooks.getSession || (() => ({})),
  handle: hooks.handle || (({ request, resolve: resolve2 }) => resolve2(request)),
  serverFetch: hooks.serverFetch || fetch
});
var module_lookup = {
  "src/routes/__layout.svelte": () => Promise.resolve().then(function() {
    return __layout;
  }),
  ".svelte-kit/build/components/error.svelte": () => Promise.resolve().then(function() {
    return error2;
  }),
  "src/routes/index.svelte": () => Promise.resolve().then(function() {
    return index;
  })
};
var metadata_lookup = { "src/routes/__layout.svelte": { "entry": "/./_app/pages/__layout.svelte-22742b5a.js", "css": ["/./_app/assets/pages/__layout.svelte-41e5f181.css"], "js": ["/./_app/pages/__layout.svelte-22742b5a.js", "/./_app/chunks/vendor-415c350a.js"], "styles": [] }, ".svelte-kit/build/components/error.svelte": { "entry": "/./_app/error.svelte-5cf41557.js", "css": [], "js": ["/./_app/error.svelte-5cf41557.js", "/./_app/chunks/vendor-415c350a.js"], "styles": [] }, "src/routes/index.svelte": { "entry": "/./_app/pages/index.svelte-88776e1f.js", "css": ["/./_app/assets/pages/index.svelte-b8de7dc6.css"], "js": ["/./_app/pages/index.svelte-88776e1f.js", "/./_app/chunks/vendor-415c350a.js"], "styles": [] } };
async function load_component(file) {
  return {
    module: await module_lookup[file](),
    ...metadata_lookup[file]
  };
}
function render(request, {
  prerender: prerender2
} = {}) {
  const host = request.headers["host"];
  return respond({ ...request, host }, options, { prerender: prerender2 });
}
var title = "Future Super | Write our next billboard";
var desc = "Your super has a voice. Make sure it speaks volumes.";
var image = "https://www.futuresuper.com.au/images/future-super-og.png";
var _layout = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  return `${$$result.head += `${$$result.title = `<title>${escape2(title)}</title>`, ""}<meta charset="${"UTF-8"}" data-svelte="svelte-1jisw9p"><meta name="${"viewport"}" content="${"width=device-width, initial-scale=1.0 viewport-fit=cover"}" shrink-to-fit="${"no"}" data-svelte="svelte-1jisw9p"><meta http-equiv="${"X-UA-Compatible"}" content="${"ie=edge"}" data-svelte="svelte-1jisw9p"><meta name="${"description"}"${add_attribute("content", desc, 0)} data-svelte="svelte-1jisw9p"><meta property="${"og:title"}"${add_attribute("content", title, 0)} data-svelte="svelte-1jisw9p"><meta property="${"og:description"}"${add_attribute("content", desc, 0)} data-svelte="svelte-1jisw9p"><meta property="${"og:image"}"${add_attribute("content", image, 0)} data-svelte="svelte-1jisw9p"><meta property="${"og:type"}" content="${"website"}" data-svelte="svelte-1jisw9p"><meta property="${"twitter:title"}"${add_attribute("content", title, 0)} data-svelte="svelte-1jisw9p"><meta property="${"twitter:description"}"${add_attribute("content", desc, 0)} data-svelte="svelte-1jisw9p"><meta property="${"twitter:image"}"${add_attribute("content", image, 0)} data-svelte="svelte-1jisw9p"><meta name="${"twitter:card"}" content="${"summary_large_image"}" data-svelte="svelte-1jisw9p"><link rel="${"icon"}" type="${"image/png"}" sizes="${"32x32"}" href="${"https://www.futuresuper.com.au/images/favicon/favicon-32.png"}" data-svelte="svelte-1jisw9p"><link rel="${"apple-touch-icon"}" href="${"https://www.futuresuper.com.au/images/favicon/apple-touch-icon.png"}" data-svelte="svelte-1jisw9p"><script data-svelte="svelte-1jisw9p">(function (w, d, s, l, i) {
			w[l] = w[l] || [];
			w[l].push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });
			var f = d.getElementsByTagName(s)[0],
				j = d.createElement(s),
				dl = l != 'dataLayer' ? '&l=' + l : '';
			j.async = true;
			j.src = 'https://www.googletagmanager.com/gtm.js?id=' + i + dl;
			f.parentNode.insertBefore(j, f);
		})(window, document, 'script', 'dataLayer', 'GTM-WDKLJP');
	<\/script><script type="${"text/javascript"}" data-svelte="svelte-1jisw9p">(function (o) {
			var b = 'https://briskpelican.io/anywhere/',
				t = '072396077b1c40c39e84f98a104af57eeddb872ab9a643b4ac354d41e8ae661e',
				a = (window.AutopilotAnywhere = {
					_runQueue: [],
					run: function () {
						this._runQueue.push(arguments);
					}
				}),
				c = encodeURIComponent,
				s = 'SCRIPT',
				d = document,
				l = d.getElementsByTagName(s)[0],
				p =
					't=' + c(d.title || '') + '&u=' + c(d.location.href || '') + '&r=' + c(d.referrer || ''),
				j = 'text/javascript',
				z,
				y;
			if (!window.Autopilot) window.Autopilot = a;

			if (o.app) p = 'devmode=true&' + p;

			z = function (src, asy) {
				var e = d.createElement(s);
				e.src = src;
				e.type = j;
				e.async = asy;
				l.parentNode.insertBefore(e, l);
			};
			y = function () {
				z(b + t + '?' + p, true);
			};
			if (window.attachEvent) {
				window.attachEvent('onload', y);
			} else {
				window.addEventListener('load', y, false);
			}
		})({});
	<\/script>`, ""}

${slots.default ? slots.default({}) : ``}`;
});
var __layout = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": _layout
});
function load({ error: error22, status }) {
  return { props: { error: error22, status } };
}
var Error$1 = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { status } = $$props;
  let { error: error22 } = $$props;
  if ($$props.status === void 0 && $$bindings.status && status !== void 0)
    $$bindings.status(status);
  if ($$props.error === void 0 && $$bindings.error && error22 !== void 0)
    $$bindings.error(error22);
  return `<h1>${escape2(status)}</h1>

<pre>${escape2(error22.message)}</pre>



${error22.frame ? `<pre>${escape2(error22.frame)}</pre>` : ``}
${error22.stack ? `<pre>${escape2(error22.stack)}</pre>` : ``}`;
});
var error2 = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": Error$1,
  load
});
var css$1 = {
  code: "@keyframes svelte-1l1g3ck-spin{0%{transform:rotate(0deg)}100%{transform:rotate(359deg)}}svg.svelte-1l1g3ck{animation:svelte-1l1g3ck-spin 10s linear infinite;min-width:42px}",
  map: '{"version":3,"file":"Logo.svelte","sources":["Logo.svelte"],"sourcesContent":["<svg width=\\"42\\" height=\\"42\\" viewBox=\\"0 0 42 42\\" fill=\\"none\\" xmlns=\\"http://www.w3.org/2000/svg\\">\\n\\t<path\\n\\t\\td=\\"M19.7661 8.0616L20.4017 0.967743L26.6788 1.53371L26.5419 3.14369L22.279 2.75342L22.1519 4.13899L25.3295 4.42194L25.1828 5.96367L22.015 5.67095L21.7803 8.23723L19.7661 8.0616Z\\"\\n\\t\\tfill=\\"white\\"\\n\\t/>\\n\\t<path\\n\\t\\td=\\"M28.108 10.5688C27.1986 10.0617 26.522 9.22208 26.2209 8.22688C26.1531 7.73903 26.1858 7.24251 26.317 6.7677C26.4481 6.29288 26.6749 5.84974 26.9836 5.46544L29.027 2.44058L30.7088 3.57245L28.5479 6.773C28.3748 7.00685 28.2486 7.27192 28.1764 7.5536C28.1277 7.77869 28.1277 8.01156 28.1764 8.23665C28.2252 8.44296 28.3187 8.63614 28.4502 8.80261C28.7514 9.15056 29.1393 9.41305 29.5746 9.56368C29.7836 9.61237 30.0011 9.61237 30.2102 9.56368C30.433 9.51867 30.6433 9.42543 30.8261 9.2905C31.0627 9.11793 31.265 8.90281 31.4225 8.65622L33.5833 5.46544L35.265 6.59737L33.2118 9.62223C32.97 10.0492 32.646 10.4242 32.2584 10.7256C31.8707 11.0271 31.4272 11.249 30.9533 11.3786C29.9352 11.4909 28.9135 11.2001 28.108 10.5688V10.5688Z\\"\\n\\t\\tfill=\\"white\\"\\n\\t/>\\n\\t<path\\n\\t\\td=\\"M31.7544 13.9267L36.516 11.2042L35.284 9.05753L36.7116 8.24768L40.1825 14.2975L38.7551 15.1073L37.5231 12.9509L32.7517 15.6733L31.7544 13.9267Z\\"\\n\\t\\tfill=\\"white\\"\\n\\t/>\\n\\t<path\\n\\t\\td=\\"M33.8154 20.4825C33.6554 19.4537 33.9046 18.4033 34.5097 17.5552C34.8546 17.2013 35.2685 16.9217 35.7259 16.7337C36.1833 16.5457 36.6745 16.4534 37.1691 16.4624L40.8259 16.2184L40.953 18.2383L37.042 18.492C36.7518 18.5027 36.4664 18.569 36.2012 18.6871C35.9895 18.7753 35.8017 18.9124 35.6536 19.0872C35.5133 19.253 35.416 19.4508 35.3701 19.6629C35.335 19.8892 35.335 20.1196 35.3701 20.3459C35.3845 20.5724 35.4304 20.7957 35.5069 21.0094C35.5796 21.2107 35.7044 21.3892 35.8687 21.5266C36.0377 21.6784 36.238 21.7917 36.4554 21.8584C36.739 21.933 37.0332 21.9594 37.3256 21.9364L41.1778 21.6827L41.3147 23.7025L37.658 23.9367C37.1731 24.008 36.6789 23.9827 36.2039 23.8621C35.729 23.7415 35.2827 23.5281 34.8909 23.2342C34.1851 22.493 33.7989 21.5049 33.8154 20.4825V20.4825Z\\"\\n\\t\\tfill=\\"white\\"\\n\\t/>\\n\\t<path\\n\\t\\td=\\"M31.6452 29.0699C31.8482 29.0113 32.0606 28.9914 32.271 29.0113C32.4763 29.0113 32.6718 29.0114 32.8772 29.0894L33.454 29.187C33.6288 29.2163 33.8073 29.2163 33.982 29.187C34.1615 29.1551 34.3299 29.0779 34.4709 28.9626C34.6562 28.8159 34.8009 28.6245 34.8913 28.4064L35.4193 27.3428L33.0922 26.1816L33.9918 24.3764L40.3765 27.5477L38.6361 31.041C38.311 31.8454 37.7612 32.5397 37.0521 33.0413C36.7953 33.1904 36.5035 33.2689 36.2064 33.2689C35.9093 33.2689 35.6175 33.1904 35.3607 33.0413C35.0984 32.9193 34.8701 32.735 34.6958 32.5046C34.5523 32.2942 34.4587 32.0539 34.422 31.802C34.3785 31.5305 34.3785 31.2539 34.422 30.9824C34.4839 30.6772 34.5689 30.3771 34.6762 30.0847C34.5354 30.3844 34.332 30.6505 34.0798 30.8653C33.8896 31.0124 33.6692 31.1156 33.4344 31.1678C33.2108 31.2018 32.9834 31.2018 32.7598 31.1678C32.5252 31.1678 32.3003 31.1093 32.0657 31.0605L31.3714 30.9434C31.1409 30.9141 30.9077 30.9141 30.6772 30.9434L31.6452 29.0699ZM35.8104 29.4504C35.4193 30.2311 35.4975 30.758 36.0353 31.0214C36.573 31.2849 37.013 31.0214 37.4041 30.2408L38.1766 28.6991L36.5828 27.9087L35.8104 29.4504Z\\"\\n\\t\\tfill=\\"white\\"\\n\\t/>\\n\\t<path\\n\\t\\td=\\"M29.8574 31.3637L33.2305 37.6379L27.4228 40.7408L26.6601 39.326L30.6786 37.1695L30.1116 36.0962L26.9827 37.7745L26.2886 36.4963L29.4173 34.8179L28.8405 33.7348L24.6167 35.9986L23.854 34.574L29.8574 31.3637Z\\"\\n\\t\\tfill=\\"white\\"\\n\\t/>\\n\\t<path\\n\\t\\td=\\"M17.1361 33.7439C17.5221 33.8557 17.8983 33.9993 18.2605 34.1732C18.8694 34.4575 19.4354 34.8254 19.9422 35.2661C20.1247 35.4322 20.2947 35.6116 20.4507 35.8027L19.2089 36.9834C18.8978 36.6025 18.5282 36.2732 18.1138 36.0077C17.6133 35.6503 17.0541 35.3828 16.4614 35.2172C16.1207 35.0934 15.756 35.05 15.3957 35.0904C15.291 35.0948 15.1901 35.1307 15.1064 35.1934C15.0226 35.2561 14.9599 35.3427 14.9264 35.4417C14.9264 35.5881 14.9264 35.7344 15.1512 35.8808C15.4278 36.0691 15.7188 36.2355 16.0215 36.3784L17.2241 36.9639C17.5285 37.1167 17.8225 37.2894 18.104 37.481C18.3709 37.65 18.6086 37.8609 18.808 38.1055C18.9919 38.3244 19.1254 38.5809 19.1991 38.8569C19.2863 39.1531 19.2863 39.4681 19.1991 39.7644C19.1132 40.0636 18.9516 40.3358 18.7298 40.5547C18.4982 40.7894 18.2079 40.9578 17.889 41.0426C17.4981 41.1524 17.0919 41.1986 16.6862 41.1792C16.1654 41.1504 15.65 41.0586 15.1512 40.906C14.7515 40.7932 14.3623 40.6463 13.9878 40.4669C13.6828 40.3246 13.3915 40.1548 13.1176 39.9595C12.7118 39.6939 12.3518 39.3644 12.0518 38.9837L13.3131 37.8909C13.574 38.2591 13.9065 38.571 14.2908 38.8081C14.7246 39.1039 15.2033 39.3279 15.7085 39.4716C16.5983 39.7351 17.0871 39.6863 17.1947 39.3155C17.1947 39.1496 17.1947 38.9838 16.9503 38.8081C16.6738 38.6006 16.3755 38.4239 16.0606 38.2812L14.9655 37.764C14.6286 37.595 14.3021 37.406 13.9878 37.1981C13.7128 37.0286 13.4655 36.818 13.2545 36.5736C13.0666 36.3687 12.9322 36.1206 12.8634 35.8515C12.7913 35.5764 12.7913 35.2875 12.8634 35.0124C12.9502 34.7049 13.1114 34.4235 13.3327 34.1927C13.5759 33.9518 13.8747 33.7742 14.2029 33.6756C14.6179 33.5523 15.0514 33.5027 15.4836 33.5292C16.0408 33.5379 16.5952 33.61 17.1361 33.7439Z\\"\\n\\t\\tfill=\\"white\\"\\n\\t/>\\n\\t<path\\n\\t\\td=\\"M11.0042 29.7814C11.7537 30.5027 12.1951 31.485 12.2361 32.5233C12.1741 33.0122 12.014 33.4836 11.7654 33.9095C11.5168 34.3353 11.1847 34.7068 10.7891 35.0017L8.0416 37.4118L6.70209 35.8896L9.63532 33.3429C9.86004 33.1601 10.0462 32.9346 10.1829 32.6794C10.2928 32.478 10.3562 32.2546 10.3686 32.0256C10.3793 31.8101 10.3356 31.5954 10.2415 31.4011C10.1447 31.1931 10.0197 30.9994 9.86997 30.8254C9.71875 30.6555 9.54427 30.5077 9.35174 30.3864C9.17315 30.271 8.96769 30.2038 8.75533 30.1912C8.52611 30.1769 8.29645 30.2101 8.08074 30.2887C7.80989 30.3992 7.56142 30.558 7.34744 30.7572L4.41421 33.3039L3.07471 31.7817L5.83189 29.3715C6.17189 29.0172 6.58013 28.7352 7.03211 28.5424C7.48408 28.3495 7.97053 28.2499 8.46208 28.2494C9.47832 28.4067 10.3916 28.957 11.0042 29.7814Z\\"\\n\\t\\tfill=\\"white\\"\\n\\t/>\\n\\t<path\\n\\t\\td=\\"M8.65921 26.5241L1.70747 28.2707L0.72973 24.4261C0.596515 23.9459 0.524277 23.4509 0.514656 22.9528C0.50221 22.5788 0.568792 22.2064 0.710156 21.8599C0.831154 21.5648 1.03481 21.3107 1.29678 21.1281C1.59103 20.9239 1.92361 20.7811 2.27452 20.7084C2.61427 20.6115 2.97036 20.585 3.32077 20.6304C3.64282 20.6751 3.94866 20.7992 4.21055 20.9915C4.50738 21.2299 4.75337 21.5251 4.93407 21.8599C5.17523 22.3057 5.35599 22.7814 5.47176 23.2747L5.94105 25.1189L8.13119 24.5627L8.65921 26.5241ZM4.11268 23.6846C4.07067 23.5209 4.01515 23.3609 3.94654 23.2064C3.88113 23.074 3.79159 22.9549 3.68253 22.8552C3.57686 22.7642 3.44846 22.7035 3.31098 22.6795C3.1403 22.6419 2.96343 22.6419 2.79275 22.6795C2.65182 22.6979 2.51847 22.7538 2.40664 22.8414C2.29482 22.929 2.20864 23.0449 2.1572 23.1772C2.08016 23.4715 2.08016 23.7806 2.1572 24.0749L2.62649 25.9288L4.58198 25.441L4.11268 23.6846Z\\"\\n\\t\\tfill=\\"white\\"\\n\\t/>\\n\\t<path\\n\\t\\td=\\"M7.35981 20.3176L0.574219 18.1318L2.58843 11.8771L4.13322 12.365L2.73511 16.7072L3.88878 17.078L4.97406 13.7018L6.3625 14.1507L5.27722 17.5171L6.45046 17.8976L7.91707 13.3506L9.4522 13.8384L7.35981 20.3176Z\\"\\n\\t\\tfill=\\"white\\"\\n\\t/>\\n\\t<path\\n\\t\\td=\\"M14.3106 9.83639C14.1066 9.79075 13.9117 9.71156 13.7337 9.60215C13.5582 9.49406 13.3885 9.37682 13.2253 9.25089L12.756 8.90939C12.6149 8.79589 12.4518 8.71283 12.2769 8.66545C12.1037 8.62126 11.9221 8.62126 11.7489 8.66545C11.5182 8.71249 11.3031 8.81649 11.1231 8.96794L10.1454 9.67046L11.6902 11.7684L10.0574 12.9686L5.8335 7.22133L8.99159 4.91847C9.64405 4.34679 10.4493 3.97724 11.3088 3.85492C11.7464 3.86972 12.1665 4.03065 12.5015 4.31195C12.8366 4.59326 13.0673 4.97862 13.1568 5.40636C13.1898 5.66268 13.163 5.92318 13.0786 6.16749C12.9872 6.42923 12.8516 6.67344 12.6777 6.88955C12.4902 7.13263 12.2807 7.35801 12.0519 7.56283C12.315 7.36696 12.614 7.22442 12.9319 7.14326C13.1706 7.09436 13.4167 7.09436 13.6554 7.14326C13.8738 7.20161 14.0817 7.29377 14.2714 7.41644C14.467 7.54329 14.6528 7.67994 14.8386 7.82631L15.4056 8.24588C15.5928 8.3824 15.8008 8.48785 16.0216 8.55813L14.3106 9.83639ZM10.7809 7.59207C11.4849 7.07491 11.6608 6.61632 11.3088 6.08941C10.9568 5.56249 10.4387 5.65032 9.73468 6.15772L8.33657 7.13349L9.39249 8.55813L10.7809 7.59207Z\\"\\n\\t\\tfill=\\"white\\"\\n\\t/>\\n</svg>\\n\\n<style>\\n\\t@keyframes spin {\\n\\t\\t0% {\\n\\t\\t\\ttransform: rotate(0deg);\\n\\t\\t}\\n\\t\\t100% {\\n\\t\\t\\ttransform: rotate(359deg);\\n\\t\\t}\\n\\t}\\n\\tsvg {\\n\\t\\tanimation: spin 10s linear infinite;\\n\\t\\tmin-width: 42px;\\n\\t}\\n</style>\\n"],"names":[],"mappings":"AAgDC,WAAW,mBAAK,CAAC,AAChB,EAAE,AAAC,CAAC,AACH,SAAS,CAAE,OAAO,IAAI,CAAC,AACxB,CAAC,AACD,IAAI,AAAC,CAAC,AACL,SAAS,CAAE,OAAO,MAAM,CAAC,AAC1B,CAAC,AACF,CAAC,AACD,GAAG,eAAC,CAAC,AACJ,SAAS,CAAE,mBAAI,CAAC,GAAG,CAAC,MAAM,CAAC,QAAQ,CACnC,SAAS,CAAE,IAAI,AAChB,CAAC"}'
};
var Logo = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  $$result.css.add(css$1);
  return `<svg width="${"42"}" height="${"42"}" viewBox="${"0 0 42 42"}" fill="${"none"}" xmlns="${"http://www.w3.org/2000/svg"}" class="${"svelte-1l1g3ck"}"><path d="${"M19.7661 8.0616L20.4017 0.967743L26.6788 1.53371L26.5419 3.14369L22.279 2.75342L22.1519 4.13899L25.3295 4.42194L25.1828 5.96367L22.015 5.67095L21.7803 8.23723L19.7661 8.0616Z"}" fill="${"white"}"></path><path d="${"M28.108 10.5688C27.1986 10.0617 26.522 9.22208 26.2209 8.22688C26.1531 7.73903 26.1858 7.24251 26.317 6.7677C26.4481 6.29288 26.6749 5.84974 26.9836 5.46544L29.027 2.44058L30.7088 3.57245L28.5479 6.773C28.3748 7.00685 28.2486 7.27192 28.1764 7.5536C28.1277 7.77869 28.1277 8.01156 28.1764 8.23665C28.2252 8.44296 28.3187 8.63614 28.4502 8.80261C28.7514 9.15056 29.1393 9.41305 29.5746 9.56368C29.7836 9.61237 30.0011 9.61237 30.2102 9.56368C30.433 9.51867 30.6433 9.42543 30.8261 9.2905C31.0627 9.11793 31.265 8.90281 31.4225 8.65622L33.5833 5.46544L35.265 6.59737L33.2118 9.62223C32.97 10.0492 32.646 10.4242 32.2584 10.7256C31.8707 11.0271 31.4272 11.249 30.9533 11.3786C29.9352 11.4909 28.9135 11.2001 28.108 10.5688V10.5688Z"}" fill="${"white"}"></path><path d="${"M31.7544 13.9267L36.516 11.2042L35.284 9.05753L36.7116 8.24768L40.1825 14.2975L38.7551 15.1073L37.5231 12.9509L32.7517 15.6733L31.7544 13.9267Z"}" fill="${"white"}"></path><path d="${"M33.8154 20.4825C33.6554 19.4537 33.9046 18.4033 34.5097 17.5552C34.8546 17.2013 35.2685 16.9217 35.7259 16.7337C36.1833 16.5457 36.6745 16.4534 37.1691 16.4624L40.8259 16.2184L40.953 18.2383L37.042 18.492C36.7518 18.5027 36.4664 18.569 36.2012 18.6871C35.9895 18.7753 35.8017 18.9124 35.6536 19.0872C35.5133 19.253 35.416 19.4508 35.3701 19.6629C35.335 19.8892 35.335 20.1196 35.3701 20.3459C35.3845 20.5724 35.4304 20.7957 35.5069 21.0094C35.5796 21.2107 35.7044 21.3892 35.8687 21.5266C36.0377 21.6784 36.238 21.7917 36.4554 21.8584C36.739 21.933 37.0332 21.9594 37.3256 21.9364L41.1778 21.6827L41.3147 23.7025L37.658 23.9367C37.1731 24.008 36.6789 23.9827 36.2039 23.8621C35.729 23.7415 35.2827 23.5281 34.8909 23.2342C34.1851 22.493 33.7989 21.5049 33.8154 20.4825V20.4825Z"}" fill="${"white"}"></path><path d="${"M31.6452 29.0699C31.8482 29.0113 32.0606 28.9914 32.271 29.0113C32.4763 29.0113 32.6718 29.0114 32.8772 29.0894L33.454 29.187C33.6288 29.2163 33.8073 29.2163 33.982 29.187C34.1615 29.1551 34.3299 29.0779 34.4709 28.9626C34.6562 28.8159 34.8009 28.6245 34.8913 28.4064L35.4193 27.3428L33.0922 26.1816L33.9918 24.3764L40.3765 27.5477L38.6361 31.041C38.311 31.8454 37.7612 32.5397 37.0521 33.0413C36.7953 33.1904 36.5035 33.2689 36.2064 33.2689C35.9093 33.2689 35.6175 33.1904 35.3607 33.0413C35.0984 32.9193 34.8701 32.735 34.6958 32.5046C34.5523 32.2942 34.4587 32.0539 34.422 31.802C34.3785 31.5305 34.3785 31.2539 34.422 30.9824C34.4839 30.6772 34.5689 30.3771 34.6762 30.0847C34.5354 30.3844 34.332 30.6505 34.0798 30.8653C33.8896 31.0124 33.6692 31.1156 33.4344 31.1678C33.2108 31.2018 32.9834 31.2018 32.7598 31.1678C32.5252 31.1678 32.3003 31.1093 32.0657 31.0605L31.3714 30.9434C31.1409 30.9141 30.9077 30.9141 30.6772 30.9434L31.6452 29.0699ZM35.8104 29.4504C35.4193 30.2311 35.4975 30.758 36.0353 31.0214C36.573 31.2849 37.013 31.0214 37.4041 30.2408L38.1766 28.6991L36.5828 27.9087L35.8104 29.4504Z"}" fill="${"white"}"></path><path d="${"M29.8574 31.3637L33.2305 37.6379L27.4228 40.7408L26.6601 39.326L30.6786 37.1695L30.1116 36.0962L26.9827 37.7745L26.2886 36.4963L29.4173 34.8179L28.8405 33.7348L24.6167 35.9986L23.854 34.574L29.8574 31.3637Z"}" fill="${"white"}"></path><path d="${"M17.1361 33.7439C17.5221 33.8557 17.8983 33.9993 18.2605 34.1732C18.8694 34.4575 19.4354 34.8254 19.9422 35.2661C20.1247 35.4322 20.2947 35.6116 20.4507 35.8027L19.2089 36.9834C18.8978 36.6025 18.5282 36.2732 18.1138 36.0077C17.6133 35.6503 17.0541 35.3828 16.4614 35.2172C16.1207 35.0934 15.756 35.05 15.3957 35.0904C15.291 35.0948 15.1901 35.1307 15.1064 35.1934C15.0226 35.2561 14.9599 35.3427 14.9264 35.4417C14.9264 35.5881 14.9264 35.7344 15.1512 35.8808C15.4278 36.0691 15.7188 36.2355 16.0215 36.3784L17.2241 36.9639C17.5285 37.1167 17.8225 37.2894 18.104 37.481C18.3709 37.65 18.6086 37.8609 18.808 38.1055C18.9919 38.3244 19.1254 38.5809 19.1991 38.8569C19.2863 39.1531 19.2863 39.4681 19.1991 39.7644C19.1132 40.0636 18.9516 40.3358 18.7298 40.5547C18.4982 40.7894 18.2079 40.9578 17.889 41.0426C17.4981 41.1524 17.0919 41.1986 16.6862 41.1792C16.1654 41.1504 15.65 41.0586 15.1512 40.906C14.7515 40.7932 14.3623 40.6463 13.9878 40.4669C13.6828 40.3246 13.3915 40.1548 13.1176 39.9595C12.7118 39.6939 12.3518 39.3644 12.0518 38.9837L13.3131 37.8909C13.574 38.2591 13.9065 38.571 14.2908 38.8081C14.7246 39.1039 15.2033 39.3279 15.7085 39.4716C16.5983 39.7351 17.0871 39.6863 17.1947 39.3155C17.1947 39.1496 17.1947 38.9838 16.9503 38.8081C16.6738 38.6006 16.3755 38.4239 16.0606 38.2812L14.9655 37.764C14.6286 37.595 14.3021 37.406 13.9878 37.1981C13.7128 37.0286 13.4655 36.818 13.2545 36.5736C13.0666 36.3687 12.9322 36.1206 12.8634 35.8515C12.7913 35.5764 12.7913 35.2875 12.8634 35.0124C12.9502 34.7049 13.1114 34.4235 13.3327 34.1927C13.5759 33.9518 13.8747 33.7742 14.2029 33.6756C14.6179 33.5523 15.0514 33.5027 15.4836 33.5292C16.0408 33.5379 16.5952 33.61 17.1361 33.7439Z"}" fill="${"white"}"></path><path d="${"M11.0042 29.7814C11.7537 30.5027 12.1951 31.485 12.2361 32.5233C12.1741 33.0122 12.014 33.4836 11.7654 33.9095C11.5168 34.3353 11.1847 34.7068 10.7891 35.0017L8.0416 37.4118L6.70209 35.8896L9.63532 33.3429C9.86004 33.1601 10.0462 32.9346 10.1829 32.6794C10.2928 32.478 10.3562 32.2546 10.3686 32.0256C10.3793 31.8101 10.3356 31.5954 10.2415 31.4011C10.1447 31.1931 10.0197 30.9994 9.86997 30.8254C9.71875 30.6555 9.54427 30.5077 9.35174 30.3864C9.17315 30.271 8.96769 30.2038 8.75533 30.1912C8.52611 30.1769 8.29645 30.2101 8.08074 30.2887C7.80989 30.3992 7.56142 30.558 7.34744 30.7572L4.41421 33.3039L3.07471 31.7817L5.83189 29.3715C6.17189 29.0172 6.58013 28.7352 7.03211 28.5424C7.48408 28.3495 7.97053 28.2499 8.46208 28.2494C9.47832 28.4067 10.3916 28.957 11.0042 29.7814Z"}" fill="${"white"}"></path><path d="${"M8.65921 26.5241L1.70747 28.2707L0.72973 24.4261C0.596515 23.9459 0.524277 23.4509 0.514656 22.9528C0.50221 22.5788 0.568792 22.2064 0.710156 21.8599C0.831154 21.5648 1.03481 21.3107 1.29678 21.1281C1.59103 20.9239 1.92361 20.7811 2.27452 20.7084C2.61427 20.6115 2.97036 20.585 3.32077 20.6304C3.64282 20.6751 3.94866 20.7992 4.21055 20.9915C4.50738 21.2299 4.75337 21.5251 4.93407 21.8599C5.17523 22.3057 5.35599 22.7814 5.47176 23.2747L5.94105 25.1189L8.13119 24.5627L8.65921 26.5241ZM4.11268 23.6846C4.07067 23.5209 4.01515 23.3609 3.94654 23.2064C3.88113 23.074 3.79159 22.9549 3.68253 22.8552C3.57686 22.7642 3.44846 22.7035 3.31098 22.6795C3.1403 22.6419 2.96343 22.6419 2.79275 22.6795C2.65182 22.6979 2.51847 22.7538 2.40664 22.8414C2.29482 22.929 2.20864 23.0449 2.1572 23.1772C2.08016 23.4715 2.08016 23.7806 2.1572 24.0749L2.62649 25.9288L4.58198 25.441L4.11268 23.6846Z"}" fill="${"white"}"></path><path d="${"M7.35981 20.3176L0.574219 18.1318L2.58843 11.8771L4.13322 12.365L2.73511 16.7072L3.88878 17.078L4.97406 13.7018L6.3625 14.1507L5.27722 17.5171L6.45046 17.8976L7.91707 13.3506L9.4522 13.8384L7.35981 20.3176Z"}" fill="${"white"}"></path><path d="${"M14.3106 9.83639C14.1066 9.79075 13.9117 9.71156 13.7337 9.60215C13.5582 9.49406 13.3885 9.37682 13.2253 9.25089L12.756 8.90939C12.6149 8.79589 12.4518 8.71283 12.2769 8.66545C12.1037 8.62126 11.9221 8.62126 11.7489 8.66545C11.5182 8.71249 11.3031 8.81649 11.1231 8.96794L10.1454 9.67046L11.6902 11.7684L10.0574 12.9686L5.8335 7.22133L8.99159 4.91847C9.64405 4.34679 10.4493 3.97724 11.3088 3.85492C11.7464 3.86972 12.1665 4.03065 12.5015 4.31195C12.8366 4.59326 13.0673 4.97862 13.1568 5.40636C13.1898 5.66268 13.163 5.92318 13.0786 6.16749C12.9872 6.42923 12.8516 6.67344 12.6777 6.88955C12.4902 7.13263 12.2807 7.35801 12.0519 7.56283C12.315 7.36696 12.614 7.22442 12.9319 7.14326C13.1706 7.09436 13.4167 7.09436 13.6554 7.14326C13.8738 7.20161 14.0817 7.29377 14.2714 7.41644C14.467 7.54329 14.6528 7.67994 14.8386 7.82631L15.4056 8.24588C15.5928 8.3824 15.8008 8.48785 16.0216 8.55813L14.3106 9.83639ZM10.7809 7.59207C11.4849 7.07491 11.6608 6.61632 11.3088 6.08941C10.9568 5.56249 10.4387 5.65032 9.73468 6.15772L8.33657 7.13349L9.39249 8.55813L10.7809 7.59207Z"}" fill="${"white"}"></path></svg>`;
});
var css = {
  code: "@media(min-width: 800.1px){.billboard-container.svelte-1kiy4h1.svelte-1kiy4h1{background-image:url('https://res.cloudinary.com/future-super/image/upload/f_auto,q_auto/v1629081534/Billboard_Centred.png')}.billboard-mobile.svelte-1kiy4h1.svelte-1kiy4h1{display:none}}#modal.svelte-1kiy4h1.svelte-1kiy4h1{display:fixed;position:absolute;width:100%;height:100vh;background-color:rgba(0, 0, 0, 0.6);backdrop-filter:blur(2px);padding:40px;display:flex;justify-content:center;align-items:center;z-index:99}.modal-box.svelte-1kiy4h1.svelte-1kiy4h1{background-color:white;max-width:600px;padding:40px;text-align:center;border-radius:40px}.modal-box.svelte-1kiy4h1>h2.svelte-1kiy4h1{margin-top:0}main.svelte-1kiy4h1.svelte-1kiy4h1{display:flex;flex-direction:row}.billboard-container.svelte-1kiy4h1.svelte-1kiy4h1{width:75vw;height:100vh;background-repeat:no-repeat;background-position:left center;background-size:cover}.logo-container.svelte-1kiy4h1.svelte-1kiy4h1{text-align:right}.message-container.svelte-1kiy4h1.svelte-1kiy4h1{position:absolute;left:8.5vw;top:50vh;width:29vw;height:22vw;margin-top:-11vw;color:white;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center}#message-on-billboard.svelte-1kiy4h1.svelte-1kiy4h1{font-size:48px;margin:4px 0}#name-and-location-on-billboard.svelte-1kiy4h1.svelte-1kiy4h1{font-size:18px;margin:0}.input-container.svelte-1kiy4h1.svelte-1kiy4h1{background-color:black;padding:2vw;margin-left:-40px;max-height:100vh;flex-grow:1;display:flex;flex-direction:column;justify-content:space-between;border-radius:40px 0 0 40px}label.svelte-1kiy4h1.svelte-1kiy4h1{color:white;font-size:15px;display:block;margin-bottom:12px}input.svelte-1kiy4h1.svelte-1kiy4h1,textarea.svelte-1kiy4h1.svelte-1kiy4h1{display:block;width:100%;padding:8px 12px;margin-bottom:36px;font-size:15px;border:0;border-radius:10px;outline:none;font-family:inherit}textarea.svelte-1kiy4h1.svelte-1kiy4h1{margin-bottom:0}.chars-remaining.svelte-1kiy4h1.svelte-1kiy4h1{color:white;font-size:12px;text-align:right;margin-bottom:36px}button.svelte-1kiy4h1.svelte-1kiy4h1{width:100%;font-size:15px;background-color:#3dfa52;color:black;border:0;border-radius:100px;padding:10px 24px;margin-top:12px}button.svelte-1kiy4h1.svelte-1kiy4h1:hover{cursor:pointer}button.not-valid.svelte-1kiy4h1.svelte-1kiy4h1{background-color:gray;cursor:no-drop}footer.svelte-1kiy4h1.svelte-1kiy4h1{background-color:white;color:black;padding:4vw}.footer-links.svelte-1kiy4h1>a.svelte-1kiy4h1{color:black}@media(max-width: 800px){main.svelte-1kiy4h1.svelte-1kiy4h1{flex-direction:column}.billboard-container.svelte-1kiy4h1.svelte-1kiy4h1{width:100%;height:auto;background-size:contain;background-position:top}.billboard-mobile.svelte-1kiy4h1.svelte-1kiy4h1{width:100%}.message-container.svelte-1kiy4h1.svelte-1kiy4h1{top:23vw;left:12vw;width:43vw;height:32vw}.input-container.svelte-1kiy4h1.svelte-1kiy4h1{padding:10vw 4vw;margin:-40px 0 0 0;max-height:100vh;display:block;width:100%;border-radius:40px 40px 0 0}.logo-container.svelte-1kiy4h1.svelte-1kiy4h1{display:none}label.svelte-1kiy4h1.svelte-1kiy4h1{font-size:14px;margin-bottom:6px}input.svelte-1kiy4h1.svelte-1kiy4h1{font-size:14px;margin-bottom:12px}.chars-remaining.svelte-1kiy4h1.svelte-1kiy4h1{margin-bottom:12px}button.svelte-1kiy4h1.svelte-1kiy4h1{font-size:14px}#message-on-billboard.svelte-1kiy4h1.svelte-1kiy4h1{font-size:16px;margin:4px 0}#name-and-location-on-billboard.svelte-1kiy4h1.svelte-1kiy4h1{font-size:12px}}",
  map: `{"version":3,"file":"index.svelte","sources":["index.svelte"],"sourcesContent":["<script context=\\"module\\">\\n\\texport const prerender = true;\\n\\timport Logo from '../lib/Logo.svelte';\\n\\timport { onMount } from 'svelte';\\n\\n\\tlet name = '';\\n\\tlet message = 'Look mum, no coal';\\n\\tlet location = '';\\n\\tconst charsAllowed = 70;\\n\\tlet charsRemaining = charsAllowed - message.length;\\n\\tlet formValid = true;\\n\\tlet showModal = true;\\n\\n\\t// Set name and location if query vars exist\\n\\tonMount(async () => {\\n\\t\\tvar query = window.location.search.substring(1);\\n\\t\\tvar vars = query.split('&');\\n\\t\\tfor (var i = 0; i < vars.length; i++) {\\n\\t\\t\\tvar pair = vars[i].split('=');\\n\\t\\t\\tif (decodeURIComponent(pair[0]) == 'name') {\\n\\t\\t\\t\\tname = decodeURIComponent(pair[1]);\\n\\t\\t\\t}\\n\\t\\t\\tif (decodeURIComponent(pair[0]) == 'location') {\\n\\t\\t\\t\\tlocation = decodeURIComponent(pair[1]);\\n\\t\\t\\t}\\n\\t\\t}\\n\\t});\\n\\n\\tconst handleChange = (event) => {\\n\\t\\tconst text = event.target.value;\\n\\t\\tif (text.length <= charsAllowed) {\\n\\t\\t\\tmessage = text;\\n\\t\\t\\tformValid = true;\\n\\t\\t} else {\\n\\t\\t\\tmessage = text.slice(0, charsAllowed);\\n\\t\\t\\tformValid = false;\\n\\t\\t}\\n\\t\\tcharsRemaining = charsAllowed - text.length;\\n\\t};\\n\\n\\tconst hideModal = () => {\\n\\t\\tshowModal = false;\\n\\t};\\n<\/script>\\n\\n<main>\\n\\t{#if showModal}\\n\\t\\t<div id=\\"modal\\">\\n\\t\\t\\t<div class=\\"modal-box\\">\\n\\t\\t\\t\\t<h2>\\n\\t\\t\\t\\t\\tYour super is powerful. You're already using it to invest in climate solutions. Make a\\n\\t\\t\\t\\t\\tbillboard, so others can too.\\n\\t\\t\\t\\t</h2>\\n\\t\\t\\t\\t<hr />\\n\\t\\t\\t\\t<h3>Some helpful tips and tricks</h3>\\n\\t\\t\\t\\t<p>Swearing won\u2019t get your billboard up in lights</p>\\n\\t\\t\\t\\t<p>Innuendo won\u2019t get you to the end-o</p>\\n\\t\\t\\t\\t<p>Make it personal</p>\\n\\t\\t\\t\\t<p>Have fun</p>\\n\\t\\t\\t\\t<button on:click={() => hideModal()}>Let's Go!</button>\\n\\t\\t\\t</div>\\n\\t\\t</div>\\n\\t{/if}\\n\\n\\t<div class=\\"billboard-container\\">\\n\\t\\t<img\\n\\t\\t\\tclass=\\"billboard-mobile\\"\\n\\t\\t\\tsrc=\\"https://res.cloudinary.com/future-super/image/upload/f_auto,q_auto/v1628831547/Billboard_Mockup_1.png\\"\\n\\t\\t\\talt=\\"\\"\\n\\t\\t/>\\n\\t\\t<div class=\\"message-container\\">\\n\\t\\t\\t<h2 id=\\"message-on-billboard\\">{message}</h2>\\n\\t\\t\\t<p id=\\"name-and-location-on-billboard\\">{name}, {location}</p>\\n\\t\\t</div>\\n\\t</div>\\n\\t<div class=\\"input-container\\">\\n\\t\\t<div class=\\"logo-container\\">\\n\\t\\t\\t<Logo />\\n\\t\\t</div>\\n\\t\\t<form name=\\"Billboard Entry\\" method=\\"POST\\" data-netlify=\\"true\\">\\n\\t\\t\\t<label for=\\"message\\">Message</label>\\n\\t\\t\\t<textarea\\n\\t\\t\\t\\ton:keyup={(event) => handleChange(event)}\\n\\t\\t\\t\\tvalue={message}\\n\\t\\t\\t\\ttype=\\"text\\"\\n\\t\\t\\t\\tid=\\"message\\"\\n\\t\\t\\t\\tname=\\"message\\"\\n\\t\\t\\t\\trequired=\\"required\\"\\n\\t\\t\\t\\trows=\\"3\\"\\n\\t\\t\\t/>\\n\\t\\t\\t<p class=\\"chars-remaining\\">\\n\\t\\t\\t\\t<span style=\\"color: {charsRemaining > -1 ? '#3dfa52' : '#FF6464'}\\">{charsRemaining}</span> characters\\n\\t\\t\\t\\tremaining\\n\\t\\t\\t</p>\\n\\t\\t\\t<label for=\\"name\\">Name</label>\\n\\t\\t\\t<input bind:value={name} type=\\"text\\" id=\\"name\\" name=\\"name\\" required=\\"required\\" />\\n\\t\\t\\t<label for=\\"location\\">Location</label>\\n\\t\\t\\t<input bind:value={location} type=\\"text\\" id=\\"location\\" name=\\"location\\" required=\\"required\\" />\\n\\t\\t\\t{#if formValid}\\n\\t\\t\\t\\t<button type=\\"submit\\">Submit</button>\\n\\t\\t\\t{:else}\\n\\t\\t\\t\\t<button class=\\"not-valid\\" disabled>Make message shorter</button>\\n\\t\\t\\t{/if}\\n\\t\\t</form>\\n\\t</div>\\n</main>\\n\\n<footer>\\n\\t<p>\\n\\t\\tWe acknowledge the Traditional Custodians of the lands on which we operate. We pay our respects\\n\\t\\tto their Elders, past, present and emerging, and recognise that sovereignty was never ceded. See\\n\\t\\tour <a\\n\\t\\t\\thref=\\"https://www.futuresuper.com.au/rap\\"\\n\\t\\t\\tstyle=\\"color: black; text-decoration: underline;\\">Reconciliation Action Plan.</a\\n\\t\\t>\\n\\t</p>\\n\\t<p>\\n\\t\\tAll information provided is general in nature only. We recommend you seek financial advice when\\n\\t\\tconsidering if Future Super is right for your objectives and needs. When considering returns,\\n\\t\\tpast performance is not indicative of future performance.\\n\\t</p>\\n\\t<p class=\\"footer-links\\">\\n\\t\\t<a href=\\"https://www.futuresuper.com.au/fund-information/\\">Fund Information</a>\\n\\t\\t\u2022\\n\\t\\t<a href=\\"https://www.futuresuper.com.au/terms-and-conditions/\\">Terms & Conditions</a>\\n\\t\\t\u2022\\n\\t\\t<a href=\\"https://www.futuresuper.com.au/privacy-policy/\\">Privacy Policy</a>\\n\\t</p>\\n</footer>\\n\\n<style>\\n\\t@media (min-width: 800.1px) {\\n\\t\\t.billboard-container {\\n\\t\\t\\tbackground-image: url('https://res.cloudinary.com/future-super/image/upload/f_auto,q_auto/v1629081534/Billboard_Centred.png');\\n\\t\\t}\\n\\t\\t.billboard-mobile {\\n\\t\\t\\tdisplay: none;\\n\\t\\t}\\n\\t}\\n\\t#modal {\\n\\t\\tdisplay: fixed;\\n\\t\\tposition: absolute;\\n\\t\\twidth: 100%;\\n\\t\\theight: 100vh;\\n\\t\\tbackground-color: rgba(0, 0, 0, 0.6);\\n\\t\\tbackdrop-filter: blur(2px);\\n\\t\\tpadding: 40px;\\n\\t\\tdisplay: flex;\\n\\t\\tjustify-content: center;\\n\\t\\talign-items: center;\\n\\t\\tz-index: 99;\\n\\t}\\n\\t.modal-box {\\n\\t\\tbackground-color: white;\\n\\t\\tmax-width: 600px;\\n\\t\\tpadding: 40px;\\n\\t\\ttext-align: center;\\n\\t\\tborder-radius: 40px;\\n\\t}\\n\\t.modal-box > h2 {\\n\\t\\tmargin-top: 0;\\n\\t}\\n\\tmain {\\n\\t\\tdisplay: flex;\\n\\t\\tflex-direction: row;\\n\\t}\\n\\t.billboard-container {\\n\\t\\twidth: 75vw;\\n\\t\\theight: 100vh;\\n\\t\\t/* overflow: hidden; */\\n\\t\\tbackground-repeat: no-repeat;\\n\\t\\tbackground-position: left center;\\n\\t\\tbackground-size: cover;\\n\\t}\\n\\t.logo-container {\\n\\t\\ttext-align: right;\\n\\t}\\n\\t.message-container {\\n\\t\\tposition: absolute;\\n\\t\\tleft: 8.5vw;\\n\\t\\ttop: 50vh;\\n\\t\\twidth: 29vw;\\n\\t\\theight: 22vw;\\n\\t\\tmargin-top: -11vw;\\n\\t\\tcolor: white;\\n\\t\\t/* background-color: yellow; */\\n\\t\\tdisplay: flex;\\n\\t\\tflex-direction: column;\\n\\t\\talign-items: center;\\n\\t\\tjustify-content: center;\\n\\t\\ttext-align: center;\\n\\t}\\n\\t#message-on-billboard {\\n\\t\\tfont-size: 48px;\\n\\t\\tmargin: 4px 0;\\n\\t}\\n\\t#name-and-location-on-billboard {\\n\\t\\tfont-size: 18px;\\n\\t\\tmargin: 0;\\n\\t}\\n\\t.input-container {\\n\\t\\tbackground-color: black;\\n\\t\\tpadding: 2vw;\\n\\t\\tmargin-left: -40px;\\n\\t\\tmax-height: 100vh;\\n\\t\\tflex-grow: 1;\\n\\t\\tdisplay: flex;\\n\\t\\tflex-direction: column;\\n\\t\\tjustify-content: space-between;\\n\\t\\tborder-radius: 40px 0 0 40px;\\n\\t}\\n\\tlabel {\\n\\t\\tcolor: white;\\n\\t\\tfont-size: 15px;\\n\\t\\tdisplay: block;\\n\\t\\tmargin-bottom: 12px;\\n\\t}\\n\\tinput,\\n\\ttextarea {\\n\\t\\tdisplay: block;\\n\\t\\twidth: 100%;\\n\\t\\tpadding: 8px 12px;\\n\\t\\tmargin-bottom: 36px;\\n\\t\\tfont-size: 15px;\\n\\t\\tborder: 0;\\n\\t\\tborder-radius: 10px;\\n\\t\\toutline: none;\\n\\t\\tfont-family: inherit;\\n\\t}\\n\\ttextarea {\\n\\t\\tmargin-bottom: 0;\\n\\t}\\n\\t.chars-remaining {\\n\\t\\tcolor: white;\\n\\t\\tfont-size: 12px;\\n\\t\\ttext-align: right;\\n\\t\\tmargin-bottom: 36px;\\n\\t}\\n\\tbutton {\\n\\t\\twidth: 100%;\\n\\t\\tfont-size: 15px;\\n\\t\\tbackground-color: #3dfa52;\\n\\t\\tcolor: black;\\n\\t\\tborder: 0;\\n\\t\\tborder-radius: 100px;\\n\\t\\tpadding: 10px 24px;\\n\\t\\tmargin-top: 12px;\\n\\t}\\n\\tbutton:hover {\\n\\t\\tcursor: pointer;\\n\\t}\\n\\tbutton.not-valid {\\n\\t\\tbackground-color: gray;\\n\\t\\tcursor: no-drop;\\n\\t}\\n\\tfooter {\\n\\t\\tbackground-color: white;\\n\\t\\tcolor: black;\\n\\t\\tpadding: 4vw;\\n\\t}\\n\\t.footer-links > a {\\n\\t\\tcolor: black;\\n\\t}\\n\\t@media (max-width: 800px) {\\n\\t\\tmain {\\n\\t\\t\\tflex-direction: column;\\n\\t\\t}\\n\\t\\t.billboard-container {\\n\\t\\t\\twidth: 100%;\\n\\t\\t\\theight: auto;\\n\\t\\t\\tbackground-size: contain;\\n\\t\\t\\tbackground-position: top;\\n\\t\\t}\\n\\t\\t.billboard-mobile {\\n\\t\\t\\twidth: 100%;\\n\\t\\t}\\n\\t\\t.message-container {\\n\\t\\t\\ttop: 23vw;\\n\\t\\t\\tleft: 12vw;\\n\\t\\t\\twidth: 43vw;\\n\\t\\t\\theight: 32vw;\\n\\t\\t}\\n\\t\\t.input-container {\\n\\t\\t\\tpadding: 10vw 4vw;\\n\\t\\t\\tmargin: -40px 0 0 0;\\n\\t\\t\\tmax-height: 100vh;\\n\\t\\t\\tdisplay: block;\\n\\t\\t\\twidth: 100%;\\n\\t\\t\\tborder-radius: 40px 40px 0 0;\\n\\t\\t}\\n\\t\\t.logo-container {\\n\\t\\t\\tdisplay: none;\\n\\t\\t}\\n\\t\\tlabel {\\n\\t\\t\\tfont-size: 14px;\\n\\t\\t\\tmargin-bottom: 6px;\\n\\t\\t}\\n\\t\\tinput {\\n\\t\\t\\tfont-size: 14px;\\n\\t\\t\\tmargin-bottom: 12px;\\n\\t\\t}\\n\\t\\t.chars-remaining {\\n\\t\\t\\tmargin-bottom: 12px;\\n\\t\\t}\\n\\t\\tbutton {\\n\\t\\t\\tfont-size: 14px;\\n\\t\\t}\\n\\t\\t#message-on-billboard {\\n\\t\\t\\tfont-size: 16px;\\n\\t\\t\\tmargin: 4px 0;\\n\\t\\t}\\n\\t\\t#name-and-location-on-billboard {\\n\\t\\t\\tfont-size: 12px;\\n\\t\\t}\\n\\t}\\n</style>\\n"],"names":[],"mappings":"AAmIC,MAAM,AAAC,YAAY,OAAO,CAAC,AAAC,CAAC,AAC5B,oBAAoB,8BAAC,CAAC,AACrB,gBAAgB,CAAE,IAAI,sGAAsG,CAAC,AAC9H,CAAC,AACD,iBAAiB,8BAAC,CAAC,AAClB,OAAO,CAAE,IAAI,AACd,CAAC,AACF,CAAC,AACD,MAAM,8BAAC,CAAC,AACP,OAAO,CAAE,KAAK,CACd,QAAQ,CAAE,QAAQ,CAClB,KAAK,CAAE,IAAI,CACX,MAAM,CAAE,KAAK,CACb,gBAAgB,CAAE,KAAK,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,GAAG,CAAC,CACpC,eAAe,CAAE,KAAK,GAAG,CAAC,CAC1B,OAAO,CAAE,IAAI,CACb,OAAO,CAAE,IAAI,CACb,eAAe,CAAE,MAAM,CACvB,WAAW,CAAE,MAAM,CACnB,OAAO,CAAE,EAAE,AACZ,CAAC,AACD,UAAU,8BAAC,CAAC,AACX,gBAAgB,CAAE,KAAK,CACvB,SAAS,CAAE,KAAK,CAChB,OAAO,CAAE,IAAI,CACb,UAAU,CAAE,MAAM,CAClB,aAAa,CAAE,IAAI,AACpB,CAAC,AACD,yBAAU,CAAG,EAAE,eAAC,CAAC,AAChB,UAAU,CAAE,CAAC,AACd,CAAC,AACD,IAAI,8BAAC,CAAC,AACL,OAAO,CAAE,IAAI,CACb,cAAc,CAAE,GAAG,AACpB,CAAC,AACD,oBAAoB,8BAAC,CAAC,AACrB,KAAK,CAAE,IAAI,CACX,MAAM,CAAE,KAAK,CAEb,iBAAiB,CAAE,SAAS,CAC5B,mBAAmB,CAAE,IAAI,CAAC,MAAM,CAChC,eAAe,CAAE,KAAK,AACvB,CAAC,AACD,eAAe,8BAAC,CAAC,AAChB,UAAU,CAAE,KAAK,AAClB,CAAC,AACD,kBAAkB,8BAAC,CAAC,AACnB,QAAQ,CAAE,QAAQ,CAClB,IAAI,CAAE,KAAK,CACX,GAAG,CAAE,IAAI,CACT,KAAK,CAAE,IAAI,CACX,MAAM,CAAE,IAAI,CACZ,UAAU,CAAE,KAAK,CACjB,KAAK,CAAE,KAAK,CAEZ,OAAO,CAAE,IAAI,CACb,cAAc,CAAE,MAAM,CACtB,WAAW,CAAE,MAAM,CACnB,eAAe,CAAE,MAAM,CACvB,UAAU,CAAE,MAAM,AACnB,CAAC,AACD,qBAAqB,8BAAC,CAAC,AACtB,SAAS,CAAE,IAAI,CACf,MAAM,CAAE,GAAG,CAAC,CAAC,AACd,CAAC,AACD,+BAA+B,8BAAC,CAAC,AAChC,SAAS,CAAE,IAAI,CACf,MAAM,CAAE,CAAC,AACV,CAAC,AACD,gBAAgB,8BAAC,CAAC,AACjB,gBAAgB,CAAE,KAAK,CACvB,OAAO,CAAE,GAAG,CACZ,WAAW,CAAE,KAAK,CAClB,UAAU,CAAE,KAAK,CACjB,SAAS,CAAE,CAAC,CACZ,OAAO,CAAE,IAAI,CACb,cAAc,CAAE,MAAM,CACtB,eAAe,CAAE,aAAa,CAC9B,aAAa,CAAE,IAAI,CAAC,CAAC,CAAC,CAAC,CAAC,IAAI,AAC7B,CAAC,AACD,KAAK,8BAAC,CAAC,AACN,KAAK,CAAE,KAAK,CACZ,SAAS,CAAE,IAAI,CACf,OAAO,CAAE,KAAK,CACd,aAAa,CAAE,IAAI,AACpB,CAAC,AACD,mCAAK,CACL,QAAQ,8BAAC,CAAC,AACT,OAAO,CAAE,KAAK,CACd,KAAK,CAAE,IAAI,CACX,OAAO,CAAE,GAAG,CAAC,IAAI,CACjB,aAAa,CAAE,IAAI,CACnB,SAAS,CAAE,IAAI,CACf,MAAM,CAAE,CAAC,CACT,aAAa,CAAE,IAAI,CACnB,OAAO,CAAE,IAAI,CACb,WAAW,CAAE,OAAO,AACrB,CAAC,AACD,QAAQ,8BAAC,CAAC,AACT,aAAa,CAAE,CAAC,AACjB,CAAC,AACD,gBAAgB,8BAAC,CAAC,AACjB,KAAK,CAAE,KAAK,CACZ,SAAS,CAAE,IAAI,CACf,UAAU,CAAE,KAAK,CACjB,aAAa,CAAE,IAAI,AACpB,CAAC,AACD,MAAM,8BAAC,CAAC,AACP,KAAK,CAAE,IAAI,CACX,SAAS,CAAE,IAAI,CACf,gBAAgB,CAAE,OAAO,CACzB,KAAK,CAAE,KAAK,CACZ,MAAM,CAAE,CAAC,CACT,aAAa,CAAE,KAAK,CACpB,OAAO,CAAE,IAAI,CAAC,IAAI,CAClB,UAAU,CAAE,IAAI,AACjB,CAAC,AACD,oCAAM,MAAM,AAAC,CAAC,AACb,MAAM,CAAE,OAAO,AAChB,CAAC,AACD,MAAM,UAAU,8BAAC,CAAC,AACjB,gBAAgB,CAAE,IAAI,CACtB,MAAM,CAAE,OAAO,AAChB,CAAC,AACD,MAAM,8BAAC,CAAC,AACP,gBAAgB,CAAE,KAAK,CACvB,KAAK,CAAE,KAAK,CACZ,OAAO,CAAE,GAAG,AACb,CAAC,AACD,4BAAa,CAAG,CAAC,eAAC,CAAC,AAClB,KAAK,CAAE,KAAK,AACb,CAAC,AACD,MAAM,AAAC,YAAY,KAAK,CAAC,AAAC,CAAC,AAC1B,IAAI,8BAAC,CAAC,AACL,cAAc,CAAE,MAAM,AACvB,CAAC,AACD,oBAAoB,8BAAC,CAAC,AACrB,KAAK,CAAE,IAAI,CACX,MAAM,CAAE,IAAI,CACZ,eAAe,CAAE,OAAO,CACxB,mBAAmB,CAAE,GAAG,AACzB,CAAC,AACD,iBAAiB,8BAAC,CAAC,AAClB,KAAK,CAAE,IAAI,AACZ,CAAC,AACD,kBAAkB,8BAAC,CAAC,AACnB,GAAG,CAAE,IAAI,CACT,IAAI,CAAE,IAAI,CACV,KAAK,CAAE,IAAI,CACX,MAAM,CAAE,IAAI,AACb,CAAC,AACD,gBAAgB,8BAAC,CAAC,AACjB,OAAO,CAAE,IAAI,CAAC,GAAG,CACjB,MAAM,CAAE,KAAK,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CACnB,UAAU,CAAE,KAAK,CACjB,OAAO,CAAE,KAAK,CACd,KAAK,CAAE,IAAI,CACX,aAAa,CAAE,IAAI,CAAC,IAAI,CAAC,CAAC,CAAC,CAAC,AAC7B,CAAC,AACD,eAAe,8BAAC,CAAC,AAChB,OAAO,CAAE,IAAI,AACd,CAAC,AACD,KAAK,8BAAC,CAAC,AACN,SAAS,CAAE,IAAI,CACf,aAAa,CAAE,GAAG,AACnB,CAAC,AACD,KAAK,8BAAC,CAAC,AACN,SAAS,CAAE,IAAI,CACf,aAAa,CAAE,IAAI,AACpB,CAAC,AACD,gBAAgB,8BAAC,CAAC,AACjB,aAAa,CAAE,IAAI,AACpB,CAAC,AACD,MAAM,8BAAC,CAAC,AACP,SAAS,CAAE,IAAI,AAChB,CAAC,AACD,qBAAqB,8BAAC,CAAC,AACtB,SAAS,CAAE,IAAI,CACf,MAAM,CAAE,GAAG,CAAC,CAAC,AACd,CAAC,AACD,+BAA+B,8BAAC,CAAC,AAChC,SAAS,CAAE,IAAI,AAChB,CAAC,AACF,CAAC"}`
};
var prerender = true;
var name = "";
var message = "Look mum, no coal";
var location = "";
var charsAllowed = 70;
var charsRemaining = charsAllowed - message.length;
var Routes = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  $$result.css.add(css);
  return `<main class="${"svelte-1kiy4h1"}">${`<div id="${"modal"}" class="${"svelte-1kiy4h1"}"><div class="${"modal-box svelte-1kiy4h1"}"><h2 class="${"svelte-1kiy4h1"}">Your super is powerful. You&#39;re already using it to invest in climate solutions. Make a
					billboard, so others can too.
				</h2>
				<hr>
				<h3>Some helpful tips and tricks</h3>
				<p>Swearing won\u2019t get your billboard up in lights</p>
				<p>Innuendo won\u2019t get you to the end-o</p>
				<p>Make it personal</p>
				<p>Have fun</p>
				<button class="${"svelte-1kiy4h1"}">Let&#39;s Go!</button></div></div>`}

	<div class="${"billboard-container svelte-1kiy4h1"}"><img class="${"billboard-mobile svelte-1kiy4h1"}" src="${"https://res.cloudinary.com/future-super/image/upload/f_auto,q_auto/v1628831547/Billboard_Mockup_1.png"}" alt="${""}">
		<div class="${"message-container svelte-1kiy4h1"}"><h2 id="${"message-on-billboard"}" class="${"svelte-1kiy4h1"}">${escape2(message)}</h2>
			<p id="${"name-and-location-on-billboard"}" class="${"svelte-1kiy4h1"}">${escape2(name)}, ${escape2(location)}</p></div></div>
	<div class="${"input-container svelte-1kiy4h1"}"><div class="${"logo-container svelte-1kiy4h1"}">${validate_component(Logo, "Logo").$$render($$result, {}, {}, {})}</div>
		<form name="${"Billboard Entry"}" method="${"POST"}" data-netlify="${"true"}"><label for="${"message"}" class="${"svelte-1kiy4h1"}">Message</label>
			<textarea type="${"text"}" id="${"message"}" name="${"message"}" required="${"required"}" rows="${"3"}" class="${"svelte-1kiy4h1"}">${escape2(message)}</textarea>
			<p class="${"chars-remaining svelte-1kiy4h1"}"><span style="${"color: " + escape2(charsRemaining > -1 ? "#3dfa52" : "#FF6464")}">${escape2(charsRemaining)}</span> characters
				remaining
			</p>
			<label for="${"name"}" class="${"svelte-1kiy4h1"}">Name</label>
			<input type="${"text"}" id="${"name"}" name="${"name"}" required="${"required"}" class="${"svelte-1kiy4h1"}"${add_attribute("value", name, 0)}>
			<label for="${"location"}" class="${"svelte-1kiy4h1"}">Location</label>
			<input type="${"text"}" id="${"location"}" name="${"location"}" required="${"required"}" class="${"svelte-1kiy4h1"}"${add_attribute("value", location, 0)}>
			${`<button type="${"submit"}" class="${"svelte-1kiy4h1"}">Submit</button>`}</form></div></main>

<footer class="${"svelte-1kiy4h1"}"><p>We acknowledge the Traditional Custodians of the lands on which we operate. We pay our respects
		to their Elders, past, present and emerging, and recognise that sovereignty was never ceded. See
		our <a href="${"https://www.futuresuper.com.au/rap"}" style="${"color: black; text-decoration: underline;"}">Reconciliation Action Plan.</a></p>
	<p>All information provided is general in nature only. We recommend you seek financial advice when
		considering if Future Super is right for your objectives and needs. When considering returns,
		past performance is not indicative of future performance.
	</p>
	<p class="${"footer-links svelte-1kiy4h1"}"><a href="${"https://www.futuresuper.com.au/fund-information/"}" class="${"svelte-1kiy4h1"}">Fund Information</a>
		\u2022
		<a href="${"https://www.futuresuper.com.au/terms-and-conditions/"}" class="${"svelte-1kiy4h1"}">Terms &amp; Conditions</a>
		\u2022
		<a href="${"https://www.futuresuper.com.au/privacy-policy/"}" class="${"svelte-1kiy4h1"}">Privacy Policy</a></p>
</footer>`;
});
var index = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": Routes,
  prerender
});

// .svelte-kit/netlify/entry.js
init();
async function handler(event) {
  const { path, httpMethod, headers, rawQuery, body, isBase64Encoded } = event;
  const query = new URLSearchParams(rawQuery);
  const type = headers["content-type"];
  const rawBody = type && isContentTypeTextual(type) ? isBase64Encoded ? Buffer.from(body, "base64").toString() : body : new TextEncoder("base64").encode(body);
  const rendered = await render({
    method: httpMethod,
    headers,
    path,
    query,
    rawBody
  });
  if (rendered) {
    return {
      isBase64Encoded: false,
      statusCode: rendered.status,
      ...splitHeaders(rendered.headers),
      body: rendered.body
    };
  }
  return {
    statusCode: 404,
    body: "Not found"
  };
}
function splitHeaders(headers) {
  const h = {};
  const m = {};
  for (const key in headers) {
    const value = headers[key];
    const target = Array.isArray(value) ? m : h;
    target[key] = value;
  }
  return {
    headers: h,
    multiValueHeaders: m
  };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
/*!
 * cookie
 * Copyright(c) 2012-2014 Roman Shtylman
 * Copyright(c) 2015 Douglas Christopher Wilson
 * MIT Licensed
 */
