import { selector } from 'recoil';
import { customChainIdAtom, customRestUrlAtom, customRpcUrlAtom, selectedChainConfigAtom } from '../atoms';
import { CUSTOM, PACIFIC_1 } from '../../config/chains';
import { ChainConfiguration } from '@sei-js/react';

export const selectedChainConfigSelector = selector<ChainConfiguration>({
	key: 'selectedChainConfigSelector',
	get: ({ get }) => {
		const selectedChainConfig = get(selectedChainConfigAtom);
		if(selectedChainConfig === PACIFIC_1) {
			return {
				chainId: selectedChainConfig,
				restUrl: `https://rest.wallet.${selectedChainConfig}.sei.io`,
				rpcUrl: `https://rpc.wallet.${selectedChainConfig}.sei.io`
			};
		}
		if(selectedChainConfig !== CUSTOM) {
			return {
				chainId: selectedChainConfig,
				restUrl: `https://rest.${selectedChainConfig}.seinetwork.io`,
				rpcUrl: `https://rpc.${selectedChainConfig}.seinetwork.io`
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
