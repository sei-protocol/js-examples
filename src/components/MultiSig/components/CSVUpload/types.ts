export type RecipientAmount = { recipient: string; amount: string };

export type CSVUploadProps = {
	onParseData: (data: RecipientAmount[]) => void;
};
