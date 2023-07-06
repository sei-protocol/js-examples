import { ChainConfiguration } from '@sei-js/react';
import { selector } from 'recoil';
import { customChainIdAtom, customRestUrlAtom, customRpcUrlAtom, selectedChainConfigAtom } from '../atoms';
import { ATLANTIC_2, CUSTOM, PACIFIC_1, SEI_DEVNET_3 } from '../../config/chains';

export const selectedChainConfigSelector = selector<ChainConfiguration>({
	key: 'selectedChainConfigSelector',
	get: ({ get }) => {
		const selectedChainConfig = get(selectedChainConfigAtom);
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
