import { ChainConfiguration } from '@sei-js/react';
import { selector } from 'recoil';
import { selectedChainConfigAtom } from '../atoms';

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
		return {
			chainId: '',
			restUrl: '',
			rpcUrl: ''
		};
	}
});
