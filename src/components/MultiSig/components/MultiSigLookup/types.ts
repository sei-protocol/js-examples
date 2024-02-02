import { Account } from '@cosmjs/stargate';
export type MultiSigLookupProps = {
    setMultiSigAccount: (account: Account) => void;
    inputtedAccounts: InputAccount[];
    setInputtedAccounts: (inputtedAccounts: InputAccount[]) => void
    multiSigThreshold: number
    setMultiSigThreshold: (threshold: number) => void
};

export type InputAccount = {pubkey: string; address: string;}