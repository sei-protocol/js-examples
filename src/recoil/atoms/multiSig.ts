import { atom } from 'recoil';
import { Account } from '@cosmjs/stargate';
import { RecipientAmount } from '../../components/MultiSig/components/RecipientsPage/types';
import { InputType, LookupType } from '../../components/MultiSig/components/MultiSigLookup/config';

export const multiSigLookupTypeAtom = atom<LookupType>({
	key: 'multiSigLookupTypeAtom',
	default: LookupType.Select
});

export const multiSigInputTypeAtom = atom<InputType>({
	key: 'multiSigInputTypeAtom',
	default: InputType.Address
});

export const multiSigAccountAddressAtom = atom<string>({
	key: 'multiSigAccountAddressAtom',
	default: ''
});

export const multiSigAccountAtom = atom<Account>({
	key: 'multiSigAccountAtom',
	default: undefined
});

export const multiSigManualAccountsAtom = atom<Account[]>({
	key: 'multiSigManualAccountsAtom',
	default: []
});

export const multiSigThresholdAtom = atom<number | undefined>({
	key: 'multiSigThresholdAtom',
	default: 2
});

export const multiSigRecipientsAtom = atom<RecipientAmount[]>({
	key: 'multiSigRecipientsAtom',
	default: []
});

export const multiSigTxMemoAtom = atom<string>({
	key: 'multiSigTxMemoAtom',
	default: ''
});

export const multiSigEncodedSignaturesAtom = atom<string[]>({
	key: 'multiSigEncodedSignaturesAtom',
	default: []
});
