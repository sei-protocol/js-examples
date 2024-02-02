import {Account} from '@cosmjs/stargate';
export type RecipientAmount = {
	recipient: string;
	amount: number;
	denom: string;
};

export type CSVUploadProps = {
	onParseData: (data: RecipientAmount[]) => void;
};

export type AddRecipientPageProps = {
	multiSigAccount: Account,
	handleBack: () => void,
	parsedRecipients: RecipientAmount[],
	txMemo: string,
	setTxMemo: (memo: string) => void,
	setFinalizedRecipients: (recipientAmounts: RecipientAmount[]) => void,
	setParsedRecipients: (recipientAmounts: RecipientAmount[]) => void};

export type FundAccountProps = {multiSigAccount: Account, handleBack: () => void, setActivatedMultiSig: (activatedMultiSig: Account) => void};
