import { Account } from '@cosmjs/stargate';
export type MultiSigLookupProps = {
    setMultiSigAccount: (account: Account) => void;
};

export type InputAccount = {pubkey: string; address: string;}