const AES_KEY: string = import.meta.env.VITE_WALLET_VERIFICATION_KEY || '';
const ALGORITHM = 'AES-GCM';
const STATIC_SALT: Buffer = Buffer.from('wallet-verification', 'utf8');
const ITERATIONS = 10000; // Number of iterations for PBKDF2, adjust as needed

interface KeyAndIv {
	key: CryptoKey;
	iv: Uint8Array;
}

async function getKeyAndIv(password: string): Promise<KeyAndIv> {
	const keyMaterial = await crypto.subtle.importKey(
		"raw",
		new TextEncoder().encode(password),
		"PBKDF2",
		false,
		["deriveKey"]
	);
	const key = await crypto.subtle.deriveKey(
		{
			"name": "PBKDF2",
			salt: STATIC_SALT,
			iterations: ITERATIONS,
			hash: "SHA-256"
		},
		keyMaterial,
		{ name: ALGORITHM, length: 256 },
		true,
		["encrypt", "decrypt"]
	);
	const iv = crypto.getRandomValues(new Uint8Array(12));
	return { key, iv };
}

export async function signObject(data: Record<string, any>): Promise<string> {
	const { key, iv } = await getKeyAndIv(AES_KEY);
	const encodedData = new TextEncoder().encode(JSON.stringify(data));
	const encrypted = await crypto.subtle.encrypt(
		{
			name: ALGORITHM,
			iv: iv
		},
		key,
		encodedData
	);

	const encryptedArray = new Uint8Array(encrypted);
	const result = new Uint8Array(iv.length + encryptedArray.length);
	result.set(iv);
	result.set(encryptedArray, iv.length);

	return btoa(String.fromCharCode(...result)); // Convert to base64 for easier handling
}

export async function verifyObject(data: Record<string, any>, encryptedData: string): Promise<boolean> {
	const encryptedArray = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));
	const iv = encryptedArray.slice(0, 12);
	const dataPart = encryptedArray.slice(12);

	console.log('AES_KEY', AES_KEY)
	const { key } = await getKeyAndIv(AES_KEY);

	try {
		const decrypted = await crypto.subtle.decrypt(
			{
				name: ALGORITHM,
				iv: iv
			},
			key,
			dataPart
		);

		return new TextDecoder().decode(decrypted) === JSON.stringify(data);
	} catch (error) {
		console.error("Decryption failed:", error);
		return false;
	}
}
