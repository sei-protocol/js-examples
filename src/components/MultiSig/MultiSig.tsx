import React, { useMemo, useState } from 'react';
import { MultiSigProps } from './types';
import styles from './MultiSig.module.sass';
import { Account, calculateFee, DeliverTxResponse, makeMultisignedTxBytes, StargateClient } from '@cosmjs/stargate';
import { cosmos } from '@sei-js/proto';
import { isMultisigThresholdPubkey, MultisigThresholdPubkey } from '@cosmjs/amino';
import { fromBase64, toBase64 } from '@cosmjs/encoding';
import { getSigningClient, isValidSeiAddress } from '@sei-js/core';
import { CSVUpload } from './components/CSVUpload';
import { RecipientAmount } from './components/CSVUpload/types';
import { useWallet } from '@sei-js/react';
import { toast } from 'react-toastify';
import { FaCopy } from '@react-icons/all-files/fa/FaCopy';
import { FaPlus } from '@react-icons/all-files/fa/FaPlus';
import { FaSignature } from '@react-icons/all-files/fa/FaSignature';
import { BubbleSelect } from '../BubbleSelect';
import { BubbleSelectOption } from '../BubbleSelect/types';

const TX_FEE = calculateFee(100000, '0.1usei');

const MultiSig = ({}: MultiSigProps) => {
	const { connectedWallet, accounts, chainId, rpcUrl } = useWallet();

	const options = [
		{ label: 'Manual entry', value: 'manualEntry' },
		{ label: 'CSV Upload', value: 'csvUpload' },
	]

	const [multiSigAccountAddress, setMultiSigAccountAddress] = useState<string>('');
	const [multiSigAccount, setMultiSigAccount] = useState<Account>();

	const [encodedSignatureInput, setEncodedSignatureInput] = useState<string>();
	const [previousSignatures, setPreviousSignatures] = useState<string[]>([]);

	const [selectedOption, setSelectedOption] = useState<BubbleSelectOption>(options[0]);
	const [newRecipient, setNewRecipient] = useState<string>('');
	const [newAmount, setNewAmount] = useState<string>('');
	const [parsedRecipients, setParsedRecipients] = useState<RecipientAmount[]>([]);
	const [finalizedRecipients, setFinalizedRecipients] = useState<RecipientAmount[]>();

	const [isBroadcasting, setIsBroadcasting] = useState<boolean>(false);
	const [broadcastResponse, setBroadcastResponse] = useState<DeliverTxResponse>();

	const hasRequiredNumberOfSignatures = useMemo(() => {
		if (!multiSigAccount) return false;
		return parseInt(multiSigAccount.pubkey.value.threshold) === previousSignatures.length;
	}, [multiSigAccount, previousSignatures]);

	const queryMultiSigAccount = async () => {
		const broadcaster = await StargateClient.connect(rpcUrl);
		const account = await broadcaster.getAccount(multiSigAccountAddress);
		if (!account) {
			toast.info(`The account address you entered does not exists on chain ${chainId}.`);
			return;
		}

		const multiSigPubkey = account.pubkey as unknown as MultisigThresholdPubkey;

		if (!isMultisigThresholdPubkey(multiSigPubkey)) {
			toast.info('The account address you entered is not a multi-sig account that exists on chain.');
			return;
		}
		setMultiSigAccount(account);
	};

	const sendMultiSig = async () => {
		if(isBroadcasting) return;
		setIsBroadcasting(true);
		const broadcaster = await StargateClient.connect(rpcUrl);

		if (!multiSigAccount) {
			toast.error('Can not find multi sig account on chain');
			setIsBroadcasting(false);
			return;
		}

		const multiSigPubkey = multiSigAccount.pubkey as unknown as MultisigThresholdPubkey;

		if (!isMultisigThresholdPubkey(multiSigPubkey)) {
			toast.error('not a multi-sig threshold pubkey');
			setIsBroadcasting(false);
			return;
		}


		const firstSignatureDecoded = JSON.parse(atob(previousSignatures[0]));

		const signaturesArray: [string, Uint8Array][] = previousSignatures.map((signature) => {
			const decodedSignature = JSON.parse(atob(signature));
			return [decodedSignature.address, fromBase64(decodedSignature.signature)];
		});

		const signatures = new Map<string, Uint8Array>(signaturesArray);

		const multiSignedTxBytes = makeMultisignedTxBytes(
			multiSigPubkey,
			multiSigAccount.sequence,
			TX_FEE,
			fromBase64(firstSignatureDecoded.body),
			signatures
		);

		const result = await broadcaster.broadcastTx(multiSignedTxBytes);

		if (result.code !== 0) {
			toast.error('Error broadcasting transaction');
			setIsBroadcasting(false);
			return;
		}
		setIsBroadcasting(false);
		setBroadcastResponse(result);
	};

	const signTransactionForMultiSig = async () => {
		if (!connectedWallet) {
			toast.info('Please connect your wallet first.');
			return;
		}
		const { multiSend } = cosmos.bank.v1beta1.MessageComposer.withTypeUrl;

		const totalSeiToSend = parsedRecipients.map((parseRecipient) => parseRecipient.amount).reduce((acc, amount) => acc + amount, 0);

		const inputs = [
			{
				address: multiSigAccountAddress,
				coins: [{ denom: 'usei', amount: totalSeiToSend.toString() }]
			}
		];

		const outputs = parsedRecipients.map((parseRecipient) => ({
			address: parseRecipient.recipient,
			coins: [{ denom: 'usei', amount: parseRecipient.amount.toString() }]
		}));

		const multiSendMsg = multiSend({
			inputs: inputs,
			outputs: outputs
		});

		const offlineAminoSigner = await connectedWallet.getOfflineSignerAmino(chainId);
		const signingClient = await getSigningClient(rpcUrl, offlineAminoSigner);
		const response = await signingClient.sign(accounts[0].address, [multiSendMsg], TX_FEE, '', {
			accountNumber: multiSigAccount.accountNumber,
			sequence: multiSigAccount.sequence,
			chainId
		});

		const signatureObject = {
			address: accounts[0].address,
			body: toBase64(response.bodyBytes),
			signature: toBase64(response.signatures[0])
		};

		// Base64 encode the signature object
		const encodedSignatureObject = btoa(JSON.stringify(signatureObject));

		// Set the encoded signature in state (for displaying in UI)
		setPreviousSignatures([...previousSignatures, encodedSignatureObject]);
	};

	const renderMultiSigLookup = () => {
		if (multiSigAccount) return null;

		return (
			<div className={styles.card}>
				<p className={styles.cardHeader}>Step 1: Lookup multi-sig account by address</p>
				<input placeholder='Multi-sig address...' className={styles.input} value={multiSigAccountAddress}
							 onChange={(e) => setMultiSigAccountAddress(e.target.value)} />
				<button className={styles.button} disabled={!isValidSeiAddress(multiSigAccountAddress)}
								onClick={queryMultiSigAccount}>look up multi-sig account
				</button>
			</div>
		);
	};

	const renderCSVUpload = () => {
		if (!multiSigAccount) return null;
		if (finalizedRecipients) return null;

		const renderRecipientContent = () => {
			switch(selectedOption.value) {
				case 'manualEntry':
					const addRecipient = () => {
						console.log(newRecipient, newAmount)
						if (newRecipient && newAmount) {
							setParsedRecipients([...parsedRecipients, {
								recipient: newRecipient,
								amount: parseFloat(newAmount)
							}]);
							setNewRecipient('');
							setNewAmount('');
						}
					};

					return (
						<div className={styles.card}>
							<input className={styles.input} placeholder='Recipient address...' value={newRecipient} onChange={(e) => setNewRecipient(e.target.value)} />
							<input className={styles.input} placeholder='Amount (usei)...' value={newAmount} onChange={(e) => setNewAmount(e.target.value)} />
							<button className={styles.button} onClick={addRecipient}>add recipient</button>
						</div>
					);
					case 'csvUpload':
						return <>
							<p>Upload a CSV file with two columns "Recipient" and "Amount" for all the addresses you would like to send
								funds to. Amounts MUST be in usei.</p>
							<CSVUpload onParseData={setParsedRecipients} />
						</>
			}
		}

		return (
			<div className={styles.card}>
				<p className={styles.cardHeader}>Step 2: Select Recipients</p>
				<BubbleSelect options={options} onSelect={setSelectedOption}  selectedOption={selectedOption}/>
				{renderRecipientContent()}
				<button disabled={parsedRecipients?.length === 0} className={styles.button} onClick={() => setFinalizedRecipients(parsedRecipients)}>Send to {parsedRecipients?.length || 0} recipients</button>
			</div>
		);
	};

	const renderSignatureInputs = () => {
		if (!finalizedRecipients || !multiSigAccount || broadcastResponse) return null;

		const addSignature = () => {
			if (encodedSignatureInput) {
				setPreviousSignatures([...previousSignatures, encodedSignatureInput]);
				setEncodedSignatureInput('');
			}
		};


		return (
			<div className={styles.card}>
				<p className={styles.cardHeader}>Step 3: Sign TX or paste other's signatures</p>
				<p>This multi-sig requires {multiSigAccount.pubkey.value.threshold} signatures. Please either paste the encoded
					signatures from other accounts if you wish to broadcast this transaction or sign the transaction yourself and
					send the encoded signature to whoever will be broadcasting the transaction.</p>
				<h5>{previousSignatures.length}/{multiSigAccount.pubkey.value.threshold} required signatures added</h5>

				<div className={styles.signaturesList}>
					{previousSignatures.map((signature, index) => {
						const onClickCopy = () => {
							navigator.clipboard.writeText(signature);
							toast.info('Signature copied to clipboard');
						};
						return (
							<div key={index} className={styles.signatureItem}>
								<div>
									<p>Signature {index + 1}</p>
								</div>
								<button onClick={onClickCopy} className={styles.copyButton}>
									<FaCopy /> copy
								</button>
							</div>
						);
					})}
					{!hasRequiredNumberOfSignatures && (
						<div className={styles.addSignature}>
							<p className={styles.cardHeader}>Add a signature</p>
							<p>Option 1: </p>
							<button className={styles.button} onClick={signTransactionForMultiSig}>
								<FaSignature /> Sign transaction
							</button>

							<p>Option 2:</p>
							<div className={styles.row}>
								<input
									className={styles.input}
									placeholder='Paste encoded signature...'
									value={encodedSignatureInput}
									onChange={(e) => setEncodedSignatureInput(e.target.value)}
								/>
								<button onClick={addSignature} className={styles.button}>
									<FaPlus /> Add
								</button>
							</div>
						</div>
					)}
				</div>
				{hasRequiredNumberOfSignatures && !broadcastResponse &&
					<button className={styles.button} onClick={sendMultiSig}>{isBroadcasting ? "broadcasting...": "broadcast"}</button>}

			</div>
		);
	};

	const renderBroadcastResponse = () => {
		if (!broadcastResponse) return null;

		return (
			<div className={styles.card}>
				<p className={styles.cardHeader}>Broadcast success!</p>
				<a href={`https://seiscan.app/${chainId}/tx/${broadcastResponse.transactionHash}`}>view this transaction on
					SeiScan</a>
			</div>
		);
	};

	const renderContent = () => {
		return (
			<div className={styles.content}>
				{renderMultiSigLookup()}
				{renderCSVUpload()}
				{renderSignatureInputs()}
				{renderBroadcastResponse()}
			</div>
		);
	};

	return renderContent();
};

export default MultiSig;

