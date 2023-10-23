import { ChainConfiguration } from '@sei-js/react';
import { selector } from 'recoil';
import { customChainIdAtom, customRestUrlAtom, customRpcUrlAtom, selectedChainConfigAtom } from '../atoms';
import { CUSTOM } from '../../config/chains';

export const selectedChainConfigSelector = selector<ChainConfiguration>({
	key: 'selectedChainConfigSelector',
	get: ({ get }) => {
		const selectedChainConfig = get(selectedChainConfigAtom);
		if(selectedChainConfig !== CUSTOM) {
			return {
				chainId: selectedChainConfig,
				restUrl: `https://rest.wallet.${selectedChainConfig}.sei.io`,
				rpcUrl: `https://rpc.wallet.${selectedChainConfig}.sei.io`
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
