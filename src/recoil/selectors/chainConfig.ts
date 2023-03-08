import { ChainConfiguration } from '@sei-js/react';
import { selector } from 'recoil';
import { customChainIdAtom, customRestUrlAtom, customRpcUrlAtom, selectedChainConfigAtom } from '../atoms';

export const selectedChainConfigSelector = selector<ChainConfiguration>({
	key: 'selectedChainConfigSelector',
	get: ({ get }) => {
		const selectedChainConfig = get(selectedChainConfigAtom);
		if (selectedChainConfig === 'testnet') {
			return {
				chainId: 'atlantic-2',
				restUrl: 'https://rest.atlantic-2.seinetwork.io/',
				rpcUrl: 'https://rpc.atlantic-2.seinetwork.io/'
			};
		} else if (selectedChainConfig === 'devnet') {
			return {
				chainId: 'sei-devnet-3',
				restUrl: 'https://rest.sei-devnet-3.seinetwork.io/',
				rpcUrl: 'https://rpc.sei-devnet-3.seinetwork.io/'
			};
		}

		// Get custom values
		const customChainId = get(customChainIdAtom);
		const customRestUrl = get(customRestUrlAtom);
		const customRpcUrl = get(customRpcUrlAtom);
		return {
			chainId: customChainId,
			restUrl: customRestUrl,
			rpcUrl: customRpcUrl
		};
	}
});
