import { atom } from 'recoil';
import { BalanceResponseType } from '../../types/BalanceResponse';

export const balanceToSendAtom = atom<BalanceResponseType | undefined>({
	key: 'balanceToSend',
	default: undefined
});
