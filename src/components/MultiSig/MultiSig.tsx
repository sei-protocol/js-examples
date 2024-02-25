import React, { useEffect, useState } from 'react';
import { MultiSigProps } from './types';
import styles from './MultiSig.module.sass';
import { DeliverTxResponse } from '@cosmjs/stargate';
import { useWallet } from '@sei-js/react';
import 'react-modern-drawer/dist/index.css';
import MultiSigLookup from './components/MultiSigLookup/MultiSigLookup';
import RecipientsPage from './components/RecipientsPage/RecipientsPage';
import SignaturePage from './components/SignaturePage/SignaturePage';
import FundAccount from './components/RecipientsPage/FundAccount';
import { useNavigate } from 'react-router-dom';
import {
	multiSigAccountAtom,
	multiSigEncodedSignaturesAtom,
	multiSigInputTypeAtom,
	multiSigLookupTypeAtom,
	multiSigManualAccountsAtom,
	multiSigRecipientsAtom,
	multiSigTxMemoAtom,
	selectedChainConfigAtom
} from '../../recoil';
import { useRecoilState } from 'recoil';
import { InputType, LookupType } from './components/MultiSigLookup/config';

const MultiSig = ({}: MultiSigProps) => {
	const { chainId } = useWallet();
	const navigate = useNavigate();

	const [multiSigAccount, setMultiSigAccount] = useRecoilState(multiSigAccountAtom);
	const [multiSigManualAccounts, setMultiSigManualAccounts] = useRecoilState(multiSigManualAccountsAtom);
	const [encodedSignatures, setEncodedSignatures] = useRecoilState(multiSigEncodedSignaturesAtom);
	const [multiSendRecipients, setMultiSendRecipients] = useRecoilState(multiSigRecipientsAtom);
	const [txMemo, setTxMemo] = useRecoilState(multiSigTxMemoAtom);
	const [lookupType, setLookupType] = useRecoilState(multiSigLookupTypeAtom);
	const [inputType, setInputType] = useRecoilState(multiSigInputTypeAtom);
	const [chainConfiguration, setChainConfiguration] = useRecoilState(selectedChainConfigAtom);

	const [previousSignatures, setPreviousSignatures] = useState<string[]>([]);
	const [broadcastResponse, setBroadcastResponse] = useState<DeliverTxResponse>();

	useEffect(() => {
		const queryParams = new URLSearchParams(window.location.search);
		const data = queryParams.get('data');
		if (data) {
			try {
				const decodedData = JSON.parse(atob(data));
				console.log('decodedData', decodedData);
				setMultiSigAccount(decodedData.multiSigAccount);
				setMultiSigManualAccounts(decodedData.multiSigManualAccounts || []);
				setEncodedSignatures(decodedData.encodedSignatures || []);
				setMultiSendRecipients(decodedData.multiSendRecipients);
				setTxMemo(decodedData.txMemo);

				switch (decodedData.chainId) {
					case 'atlantic-2':
						setChainConfiguration('atlantic-2');
						break;
				}
			} catch (error) {
				console.error('Error parsing transaction data from URL:', error);
			}
		}
	}, [setMultiSigAccount, setMultiSigManualAccounts, setEncodedSignatures, setMultiSendRecipients, setTxMemo]);

	const onClickReset = () => {
		setMultiSigAccount(undefined);
		setMultiSigManualAccounts([]);
		setEncodedSignatures([]);
		setMultiSendRecipients([]);
		setTxMemo('');
		setBroadcastResponse(undefined);
		setPreviousSignatures([]);
		setLookupType(LookupType.Select);
		setInputType(InputType.Address);
	};

	const renderContent = () => {
		if (!multiSigAccount) return <MultiSigLookup />;
		if (multiSigAccount.accountNumber === -1) return <FundAccount />;
		if (multiSendRecipients.length === 0) return <RecipientsPage />;
		if (!broadcastResponse) return <SignaturePage setBroadcastResponse={setBroadcastResponse} />;

		return (
			<div className={styles.card}>
				<p className={styles.cardHeader}>Broadcast success!</p>
				<a href={`https://seiscan.app/${chainId}/tx/${broadcastResponse.transactionHash}`}>view this transaction on SeiScan</a>
			</div>
		);
	};

	return (
		<div className={styles.content}>
			<div className='flex-row gap-4 items-center'>
				<button
					className='border-neutral-300 border-solid border-2 text-neutral-300 rounded-full px-4 py-2 w-fit font-black self-end cursor-pointer'
					onClick={() => navigate('/')}>
					{chainId}
				</button>
				<button className='bg-neutral-300 text-black rounded-full px-4 py-2 w-fit font-black self-end cursor-pointer' onClick={onClickReset}>
					reset
				</button>
			</div>
			{renderContent()}
		</div>
	);
};

export default MultiSig;
