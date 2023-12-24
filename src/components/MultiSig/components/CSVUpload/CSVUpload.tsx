import React from 'react';
import { CSVUploadProps } from './types';
import Papa from 'papaparse';
import { toast } from 'react-toastify';
import styles from './CSVUpload.module.sass';
import { FaUpload } from '@react-icons/all-files/fa/FaUpload';

const CSVUpload = ({ onParseData }: CSVUploadProps) => {

	const handleFileUpload = (e) => {
		const file = e.target.files[0];

		Papa.parse(file, {
			header: true,
			skipEmptyLines: true,
			complete: (result) => {
				const isValidFormat = result.meta.fields.includes('Recipient') && result.meta.fields.includes('Amount');

				if (!isValidFormat) {
					toast.error("Invalid CSV format");
					// Handle invalid format
					return;
				}

				const formattedData = result.data.map(row => ({
					recipient: row['Recipient'],
					amount: parseFloat(row['Amount'])
				}));

				onParseData(formattedData);
			}
		});
	};

	return (
		<div className={styles.csvUploadInputContainer}>
			<label htmlFor="csvUpload" className={styles.csvUploadInputLabel}>
				<FaUpload /> Upload CSV File
			</label>
			<input
				type="file"
				id="csvUpload"
				accept=".csv"
				onChange={handleFileUpload}
				className={styles.csvUploadInput}
			/>
		</div>
	);
};

export default CSVUpload;
