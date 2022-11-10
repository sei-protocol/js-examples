import { atom } from 'recoil';
import { ChainConfig } from '../../types/ChainConfig';

export const selectedChainConfigAtom = atom<ChainConfig>({
	key: 'selectedChainConfig',
	default: 'testnet'
});

export const customChainIdAtom = atom<string>({
	key: 'customChainId',
	default: ''
});

export const customRestUrlAtom = atom<string>({
	key: 'customRestUrl',
	default: ''
});

export const customRpcUrlAtom = atom<string>({
	key: 'customRpcUrl',
	default: ''
});
