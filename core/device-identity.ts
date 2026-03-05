import crypto from "crypto";
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import path from "path";
import { createLogger } from "./logger";

const log = createLogger("device-identity");

const IDENTITY_DIR = path.resolve(process.cwd(), ".identity");
const KEYPAIR_PATH = path.join(IDENTITY_DIR, "device-keypair.json");
const TOKENS_PATH = path.join(IDENTITY_DIR, "device-tokens.json");

// Ed25519 SPKI prefix (for creating public key objects from raw bytes)
const ED25519_SPKI_PREFIX = Buffer.from("302a300506032b6570032100", "hex");

interface StoredKeypair {
	publicKey: string; // base64url
	privateKey: string; // base64url
	deviceId: string; // sha256 hex
	createdAt: string;
}

interface TokenStore {
	[instanceUrl: string]: {
		deviceToken: string;
		role: string;
		scopes: string[];
		issuedAtMs: number;
	};
}

// ── Encoding helpers ──

function base64UrlEncode(buf: Buffer): string {
	return buf
		.toString("base64")
		.replaceAll("+", "-")
		.replaceAll("/", "_")
		.replace(/=+$/g, "");
}

function base64UrlDecode(str: string): Buffer {
	let b64 = str.replaceAll("-", "+").replaceAll("_", "/");
	while (b64.length % 4 !== 0) b64 += "=";
	return Buffer.from(b64, "base64");
}

// ── Keypair management ──

function ensureDir() {
	mkdirSync(IDENTITY_DIR, { recursive: true });
}

function loadKeypair(): StoredKeypair | null {
	try {
		return JSON.parse(readFileSync(KEYPAIR_PATH, "utf-8")) as StoredKeypair;
	} catch {
		return null;
	}
}

function generateKeypair(): StoredKeypair {
	const { publicKey, privateKey } = crypto.generateKeyPairSync("ed25519");

	// Export raw bytes
	const pubRaw = publicKey.export({ type: "spki", format: "der" }).subarray(ED25519_SPKI_PREFIX.length);
	const privRaw = privateKey.export({ type: "pkcs8", format: "der" });

	const deviceId = crypto.createHash("sha256").update(pubRaw).digest("hex");

	const stored: StoredKeypair = {
		publicKey: base64UrlEncode(pubRaw),
		privateKey: base64UrlEncode(privRaw),
		deviceId,
		createdAt: new Date().toISOString(),
	};

	ensureDir();
	writeFileSync(KEYPAIR_PATH, JSON.stringify(stored, null, 2) + "\n", "utf-8");
	log.info({ deviceId }, "Generated new device keypair");

	return stored;
}

let _keypair: StoredKeypair | null = null;

export function getDeviceIdentity(): StoredKeypair {
	if (!_keypair) {
		_keypair = loadKeypair() ?? generateKeypair();
		log.info({ deviceId: _keypair.deviceId }, "Device identity loaded");
	}
	return _keypair;
}

// ── Signing ──

function normalizeMetadata(val: string | undefined): string {
	return (val ?? "").trim().toLowerCase();
}

export function signChallenge(params: {
	nonce: string;
	clientId: string;
	clientMode: string;
	role: string;
	scopes: string[];
	token?: string | null;
	platform: string;
	deviceFamily?: string;
}): { id: string; publicKey: string; signature: string; signedAt: number; nonce: string } {
	const identity = getDeviceIdentity();
	const signedAt = Date.now();

	const payload = [
		"v3",
		identity.deviceId,
		params.clientId,
		params.clientMode,
		params.role,
		params.scopes.join(","),
		String(signedAt),
		params.token ?? "",
		params.nonce,
		normalizeMetadata(params.platform),
		normalizeMetadata(params.deviceFamily),
	].join("|");

	// Reconstruct the private key object from stored PKCS8 DER
	const privKeyObj = crypto.createPrivateKey({
		key: base64UrlDecode(identity.privateKey),
		type: "pkcs8",
		format: "der",
	});

	const signature = crypto.sign(null, Buffer.from(payload, "utf8"), privKeyObj);

	return {
		id: identity.deviceId,
		publicKey: identity.publicKey,
		signature: base64UrlEncode(signature),
		signedAt,
		nonce: params.nonce,
	};
}

// ── Device token persistence ──

function loadTokens(): TokenStore {
	try {
		return JSON.parse(readFileSync(TOKENS_PATH, "utf-8")) as TokenStore;
	} catch {
		return {};
	}
}

function saveTokens(tokens: TokenStore) {
	ensureDir();
	writeFileSync(TOKENS_PATH, JSON.stringify(tokens, null, 2) + "\n", "utf-8");
}

export function getDeviceToken(instanceUrl: string): string | null {
	const tokens = loadTokens();
	return tokens[instanceUrl]?.deviceToken ?? null;
}

export function saveDeviceToken(
	instanceUrl: string,
	auth: { deviceToken: string; role: string; scopes: string[]; issuedAtMs?: number },
) {
	const tokens = loadTokens();
	tokens[instanceUrl] = {
		deviceToken: auth.deviceToken,
		role: auth.role,
		scopes: auth.scopes,
		issuedAtMs: auth.issuedAtMs ?? Date.now(),
	};
	saveTokens(tokens);
	log.info({ instanceUrl, role: auth.role }, "Device token saved");
}
