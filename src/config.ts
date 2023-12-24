export type AppRoute = { title: string, route: string };

export const CHAIN_INFO_ROUTE = {
	title: 'Chain information',
	route: '/chain-information',
}

export const WALLET_VERIFICATION_ROUTE = {
	title: 'Wallet verification',
	route: '/wallet-verification',
}

export const ACCOUNT_ROUTE = {
	title: 'Account',
	route: '/account-info',
}

export const WASM_MODULE_ROUTE = {
	title: 'Wasm module',
	route: '/wasm-module',
}

export const DEX_MODULE_ROUTE = {
	title: 'Dex module',
	route: '/dex-module',
}

export const MULTI_SIG_ROUTE = {
	title: 'Multi-Sig Send',
	route: '/multi-sig',
}

export const APP_ROUTES: AppRoute[] = [
	CHAIN_INFO_ROUTE,
	MULTI_SIG_ROUTE,
	WALLET_VERIFICATION_ROUTE,
	// ACCOUNT_ROUTE,
	// WASM_MODULE_ROUTE,
	// DEX_MODULE_ROUTE,
];
