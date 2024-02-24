import React from 'react';
import { CSVUploadProps } from './types';
import Papa from 'papaparse';
import { toast } from 'react-toastify';
import addRecipientStyles from './RecipientsPage.module.sass';
import { FaUpload } from '@react-icons/all-files/fa/FaUpload';

const CSVUpload = ({ onParseData }: CSVUploadProps) => {
	const handleFileUpload = (e) => {
		const file = e.target.files[0];

		Papa.parse(file, {
			header: true,
			skipEmptyLines: true,
			complete: (result) => {
				const isValidFormat = result.meta.fields.includes('Recipient') && result.meta.fields.includes('Amount') && result.meta.fields.includes('Denom');
				const hasMemo = result.meta.fields.includes('Memo');

				if (!isValidFormat) {
					toast.error('Invalid CSV format');
					// Handle invalid format
					return;
				}

				const formattedData = result.data.map((row) => {
					let returnData = {
						recipient: row['Recipient'],
						denom: row['Denom'],
						amount: parseFloat(row['Amount']),
						memo: hasMemo ? row['Memo'] : ''
					};

					if (row['Denom'].toLowerCase() === 'sei') {
						returnData.amount = returnData.amount * 1000000;
						returnData.denom = 'usei';
					}

					return returnData;
				});

				onParseData(formattedData);
			}
		});
	};

	return (
		<div className={addRecipientStyles.csvUploadInputContainer}>
			<label htmlFor='csvUpload' className={addRecipientStyles.csvUploadInputLabel}>
				<FaUpload /> Upload CSV File
			</label>
			<input type='file' id='csvUpload' accept='.csv' onChange={handleFileUpload} className={addRecipientStyles.csvUploadInput} />
		</div>
	);
};

export default CSVUpload;
