import "server-only";

import { XMLParser } from "fast-xml-parser";

const parser = new XMLParser({
  ignoreAttributes: true,
  parseTagValue: false,
  trimValues: true,
});

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function serializeValue(value: unknown): string {
  if (typeof value === "string") {
    return `<value><string>${escapeXml(value)}</string></value>`;
  }

  if (typeof value === "number") {
    return Number.isInteger(value)
      ? `<value><i8>${value}</i8></value>`
      : `<value><double>${value}</double></value>`;
  }

  if (typeof value === "boolean") {
    return `<value><boolean>${value ? 1 : 0}</boolean></value>`;
  }

  if (Array.isArray(value)) {
    return `<value><array><data>${value.map(serializeValue).join("")}</data></array></value>`;
  }

  if (value === null || value === undefined) {
    return "<value><nil /></value>";
  }

  throw new Error(`Unsupported XML-RPC parameter type: ${typeof value}`);
}

function normalizeList<T>(value: T | T[] | undefined): T[] {
  if (value === undefined) {
    return [];
  }

  return Array.isArray(value) ? value : [value];
}

function parseValueNode(node: unknown): unknown {
  if (node === null || node === undefined) {
    return null;
  }

  if (typeof node === "string") {
    return node;
  }

  if (typeof node !== "object") {
    return node;
  }

  const valueNode = node as Record<string, unknown>;

  if ("string" in valueNode) {
    return String(valueNode.string ?? "");
  }

  if ("i8" in valueNode || "i4" in valueNode || "int" in valueNode) {
    const raw = valueNode.i8 ?? valueNode.i4 ?? valueNode.int;
    return Number(raw);
  }

  if ("double" in valueNode) {
    return Number(valueNode.double);
  }

  if ("boolean" in valueNode) {
    return String(valueNode.boolean) === "1";
  }

  if ("array" in valueNode) {
    const arrayNode = valueNode.array as { data?: { value?: unknown | unknown[] } };
    return normalizeList(arrayNode?.data?.value).map(parseValueNode);
  }

  if ("struct" in valueNode) {
    const structNode = valueNode.struct as {
      member?: { name?: string; value?: unknown } | Array<{ name?: string; value?: unknown }>;
    };

    return Object.fromEntries(
      normalizeList(structNode.member).map((member) => [
        String(member.name ?? ""),
        parseValueNode(member.value),
      ]),
    );
  }

  if ("nil" in valueNode) {
    return null;
  }

  return valueNode;
}

function parseMethodResponse(xml: string): unknown {
  const response = parser.parse(xml) as {
    methodResponse?: {
      params?: {
        param?: { value?: unknown } | Array<{ value?: unknown }>;
      };
      fault?: {
        value?: unknown;
      };
    };
  };

  const methodResponse = response.methodResponse;

  if (!methodResponse) {
    throw new Error("Invalid XML-RPC response: missing methodResponse root.");
  }

  if (methodResponse.fault?.value) {
    const fault = parseValueNode(methodResponse.fault.value) as {
      faultCode?: number;
      faultString?: string;
    };

    throw new Error(
      `XML-RPC fault ${fault.faultCode ?? "unknown"}: ${fault.faultString ?? "Unknown fault"}`,
    );
  }

  const params = normalizeList(methodResponse.params?.param);
  const firstParam = params[0];

  if (!firstParam) {
    return null;
  }

  return parseValueNode(firstParam.value);
}

export async function callXmlRpc<T>({
  url,
  username,
  password,
  method,
  params = [],
}: {
  url: string;
  username: string;
  password: string;
  method: string;
  params?: unknown[];
}): Promise<T> {
  const body = `<?xml version="1.0"?><methodCall><methodName>${escapeXml(method)}</methodName><params>${params
    .map((param) => `<param>${serializeValue(param)}</param>`)
    .join("")}</params></methodCall>`;

  const authorization = Buffer.from(`${username}:${password}`).toString("base64");

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Basic ${authorization}`,
      "Content-Type": "text/xml",
    },
    cache: "no-store",
    body,
  });

  const text = await response.text();

  if (!response.ok) {
    throw new Error(`XML-RPC request failed with ${response.status}: ${text.slice(0, 240)}`);
  }

  return parseMethodResponse(text) as T;
}
