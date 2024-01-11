export type RecipientAmount = { recipient: string; amount: number; denom: string; };

export type CSVUploadProps = {
	onParseData: (data: RecipientAmount[]) => void;
};
