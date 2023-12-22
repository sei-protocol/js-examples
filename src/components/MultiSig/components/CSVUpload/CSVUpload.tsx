import React from 'react';
import { CSVUploadProps } from './types';
import Papa from 'papaparse';
import { toast } from 'react-toastify';

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
		<input type="file" accept=".csv" onChange={handleFileUpload} />
	);
};

export default CSVUpload;
