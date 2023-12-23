export type RecipientAmount = { recipient: string; amount: number };

export type CSVUploadProps = {
	onParseData: (data: RecipientAmount[]) => void;
};
