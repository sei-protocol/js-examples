import { atom } from 'recoil';
import { ChainConfig } from '../../types';
import { PACIFIC_1 } from '../../config/chains';

export const selectedChainConfigAtom = atom<ChainConfig>({
	key: 'selectedChainConfig',
	default: PACIFIC_1
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
