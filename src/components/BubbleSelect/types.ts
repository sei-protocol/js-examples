export type BubbleSelectOption = {
	label: string;
	value: string;
};

export type BubbleSelectProps = {
	options: BubbleSelectOption[];
	onSelect: (value: BubbleSelectOption) => void;
	selectedOption: BubbleSelectOption;
};
