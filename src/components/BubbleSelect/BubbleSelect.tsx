import React from 'react';
import styles from './BubbleSelect.module.sass';
import { BubbleSelectOption, BubbleSelectProps } from './types';

const BubbleSelect = ({ selectedOption, options, onSelect }: BubbleSelectProps) => {

	const handleSelect = (option: BubbleSelectOption) => {
		onSelect(option);
	};

	return (
		<div className={styles.bubbleContainer}>
			{options.map((option, index) => (
				<div
					key={index}
					className={`${styles.bubble} ${selectedOption.value === option.value ? styles.selected : ''}`}
					onClick={() => handleSelect(option)}>
					{option.label}
				</div>
			))}
		</div>
	);
};

export default BubbleSelect;
