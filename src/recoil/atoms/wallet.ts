import { atom } from 'recoil';
import { WalletWindowKey } from '@sei-js/core/wallet';

export const inputWalletAtom = atom<WalletWindowKey>({
	key: 'inputWallet',
	default: undefined
});
