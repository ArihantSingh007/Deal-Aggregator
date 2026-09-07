/**
 * Minimal AWS Signature Version 4 signer, just enough to call Amazon's
 * Product Advertising API 5.0 (PA-API). PA-API requires every request to be
 * signed the same way as any other AWS service call — see:
 * https://webservices.amazon.com/paapi5/documentation/without-sdk.html
 *
 * This is a small hand-rolled implementation (no AWS SDK dependency) using
 * Node's built-in `crypto` module. If Amazon changes their signing
 * requirements, cross-check against the link above.
 */
import { createHash, createHmac } from "crypto";

interface SignedRequestParams {
  method: "POST";
  host: string; // e.g. "webservices.amazon.in"
  path: string; // e.g. "/paapi5/getitems"
  region: string; // e.g. "eu-west-1" for the India marketplace
  service: string; // always "ProductAdvertisingAPI" for PA-API
  target: string; // e.g. "com.amazon.paapi5.v1.ProductAdvertisingAPIv1.GetItems"
  payload: string; // JSON body, already stringified
  accessKey: string;
  secretKey: string;
}

function hmac(key: Buffer | string, data: string): Buffer {
  return createHmac("sha256", key).update(data, "utf8").digest();
}

function hash(data: string): string {
  return createHash("sha256").update(data, "utf8").digest("hex");
}

function amzDate(): { amzDate: string; dateStamp: string } {
  const now = new Date();
  const iso = now.toISOString().replace(/[:-]|\.\d{3}/g, ""); // e.g. 20260808T120000Z
  return { amzDate: iso, dateStamp: iso.slice(0, 8) };
}

export function signPaApiRequest(params: SignedRequestParams): { headers: Record<string, string>; url: string } {
  const { amzDate: amzDateStr, dateStamp } = amzDate();

  const canonicalHeaders =
    `content-encoding:amz-1.0\n` +
    `content-type:application/json; charset=utf-8\n` +
    `host:${params.host}\n` +
    `x-amz-date:${amzDateStr}\n` +
    `x-amz-target:${params.target}\n`;
  const signedHeaders = "content-encoding;content-type;host;x-amz-date;x-amz-target";

  const canonicalRequest = [
    params.method,
    params.path,
    "", // no query string for PA-API POST requests
    canonicalHeaders,
    signedHeaders,
    hash(params.payload),
  ].join("\n");

  const credentialScope = `${dateStamp}/${params.region}/${params.service}/aws4_request`;
  const stringToSign = ["AWS4-HMAC-SHA256", amzDateStr, credentialScope, hash(canonicalRequest)].join("\n");

  const kDate = hmac(`AWS4${params.secretKey}`, dateStamp);
  const kRegion = hmac(kDate, params.region);
  const kService = hmac(kRegion, params.service);
  const kSigning = hmac(kService, "aws4_request");
  const signature = createHmac("sha256", kSigning).update(stringToSign, "utf8").digest("hex");

  const authorizationHeader =
    `AWS4-HMAC-SHA256 Credential=${params.accessKey}/${credentialScope}, ` +
    `SignedHeaders=${signedHeaders}, Signature=${signature}`;

  return {
    url: `https://${params.host}${params.path}`,
    headers: {
      "content-encoding": "amz-1.0",
      "content-type": "application/json; charset=utf-8",
      host: params.host,
      "x-amz-date": amzDateStr,
      "x-amz-target": params.target,
      Authorization: authorizationHeader,
    },
  };
}
