import React, { useState } from 'react';
import { MultiSigProps } from './types';
import styles from './MultiSig.module.sass';
import { Account, calculateFee, DeliverTxResponse, makeMultisignedTxBytes, StargateClient } from '@cosmjs/stargate';
import { RecipientAmount } from './components/RecipientsPage/types';
import { useWallet } from '@sei-js/react';
import 'react-modern-drawer/dist/index.css'
import MultiSigLookup from './components/MultiSigLookup/MultiSigLookup';
import RecipientsPage from './components/RecipientsPage/RecipientsPage';
import SignaturePage from './components/SignaturePage/SignaturePage';
import FundAccount from './components/RecipientsPage/FundAccount';
import { InputAccount } from './components/MultiSigLookup/types';

const MultiSig = ({}: MultiSigProps) => {
	const { connectedWallet, accounts, chainId, rpcUrl } = useWallet();

	const [multiSigAccount, setMultiSigAccount] = useState<Account>();
	const [activatedMultiSig, setActivatedMultiSig] = useState<Account>();
    const [inputtedAccounts, setInputtedAccounts] = useState<InputAccount[]>([]);
	const [multiSigThreshold, setMultiSigThreshold] = useState<number>(0);
	const [previousSignatures, setPreviousSignatures] = useState<string[]>([]);

	const [parsedRecipients, setParsedRecipients] = useState<RecipientAmount[]>([]);
	const [finalizedRecipients, setFinalizedRecipients] = useState<RecipientAmount[]>();

	const [broadcastResponse, setBroadcastResponse] = useState<DeliverTxResponse>();

	const renderMultiSigLookup = () => {
		if (multiSigAccount) return null;
		return <MultiSigLookup
			setMultiSigAccount={setMultiSigAccount}
			inputtedAccounts={inputtedAccounts}
			setInputtedAccounts={setInputtedAccounts}
			multiSigThreshold={multiSigThreshold}
			setMultiSigThreshold={setMultiSigThreshold}></MultiSigLookup>
	};

	const renderMultisigInfoPage = () => {
		if (!multiSigAccount || activatedMultiSig) return null;
		return <FundAccount multiSigAccount={multiSigAccount} handleBack={() => setMultiSigAccount(null)} setActivatedMultiSig={setActivatedMultiSig}></FundAccount>
	}

	const renderRecipientsPage = () => {
		if (!activatedMultiSig || finalizedRecipients) return null;

		return (<RecipientsPage 
			multiSigAccount={activatedMultiSig}
			handleBack={() => setActivatedMultiSig(null)}
			parsedRecipients={parsedRecipients}
			setFinalizedRecipients={setFinalizedRecipients}
			setParsedRecipients={setParsedRecipients}
			></RecipientsPage>)
	}

	const renderSignatureInputs = () => {
		if (!finalizedRecipients || !activatedMultiSig || broadcastResponse) return null;
		return (<SignaturePage
		multiSigAccount={activatedMultiSig}
		finalizedRecipients={finalizedRecipients}
		handleBack={() => setFinalizedRecipients(null)}
		previousSignatures={previousSignatures}
		setBroadcastResponse={setBroadcastResponse}
		setPreviousSignatures={setPreviousSignatures}>
		</SignaturePage>)
	}	

	const renderBroadcastResponse = () => {
		if (!broadcastResponse) return null;

		return (
			<div className={styles.card}>
				<p className={styles.cardHeader}>Broadcast success!</p>
				<a href={`https://seiscan.app/${chainId}/tx/${broadcastResponse.transactionHash}`}>view this transaction on SeiScan</a>
			</div>
		);
	};

	const renderContent = () => {
		return (
			<div className={styles.content}>
				{renderMultiSigLookup()}
				{renderMultisigInfoPage()}
				{renderRecipientsPage()}
				{renderSignatureInputs()}
				{renderBroadcastResponse()}
			</div>
		);
	};

	return renderContent();
};

export default MultiSig;
