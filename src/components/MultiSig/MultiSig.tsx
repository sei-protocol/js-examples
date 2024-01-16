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
import { HiLightBulb } from '@react-icons/all-files/hi/HiLightBulb';
import { BiSpreadsheet } from '@react-icons/all-files/bi/BiSpreadsheet';
import cn from 'classnames';
import { HiTrash } from '@react-icons/all-files/hi/HiTrash';

export const truncateAddress = (address: string) => {
	if (!isValidSeiAddress(address)) {
		return address;
	}
	return `${address.slice(0, 6)}....${address.slice(address.length - 6)}`;
};

const MultiSig = ({}: MultiSigProps) => {
	const { connectedWallet, accounts, chainId, rpcUrl } = useWallet();

	const [isQueryingMultiSigAccount, setIsQueryingMultiSigAccount] = useState<boolean>(false);
	const [multiSigAccountAddress, setMultiSigAccountAddress] = useState<string>('');
	const [multiSigAccount, setMultiSigAccount] = useState<Account>();

	const [encodedSignatureInput, setEncodedSignatureInput] = useState<string>();
	const [previousSignatures, setPreviousSignatures] = useState<string[]>([]);

	const [parsedRecipients, setParsedRecipients] = useState<RecipientAmount[]>([]);
	const [finalizedRecipients, setFinalizedRecipients] = useState<RecipientAmount[]>();

	const [isBroadcasting, setIsBroadcasting] = useState<boolean>(false);
	const [broadcastResponse, setBroadcastResponse] = useState<DeliverTxResponse>();

	const hasRequiredNumberOfSignatures = useMemo(() => {
		if (!multiSigAccount) return false;
		return parseInt(multiSigAccount.pubkey.value.threshold) === previousSignatures.length;
	}, [multiSigAccount, previousSignatures]);

	const TX_FEE = calculateFee(120000 * parsedRecipients.length, '0.1usei');

	const queryMultiSigAccount = async () => {
		if (isQueryingMultiSigAccount) return;
		setIsQueryingMultiSigAccount(true);
		const broadcaster = await StargateClient.connect(rpcUrl);
		const account = await broadcaster.getAccount(multiSigAccountAddress);
		if (!account) {
			toast.info(`The account address you entered does not exists on chain ${chainId}.`);
			setIsQueryingMultiSigAccount(false);
			return;
		}

		const multiSigPubkey = account.pubkey as unknown as MultisigThresholdPubkey;

		if (!multiSigPubkey) {
			toast.info(
				'The account address you entered is not a multi-sig account that exists on chain. You must execute a TX from this multi-sig using the CLI before using this UI.'
			);
			setIsQueryingMultiSigAccount(false);
			return;
		}

		if (!isMultisigThresholdPubkey(multiSigPubkey)) {
			toast.info('The account address you entered is not a multi-sig account that exists on chain.');
			setIsQueryingMultiSigAccount(false);
			return;
		}
		setMultiSigAccount(account);
		setIsQueryingMultiSigAccount(false);
	};

	const sendMultiSig = async () => {
		try {
			if (isBroadcasting) return;
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

			const multiSignedTxBytes = makeMultisignedTxBytes(multiSigPubkey, multiSigAccount.sequence, TX_FEE, fromBase64(firstSignatureDecoded.body), signatures);

			const result = await broadcaster.broadcastTx(multiSignedTxBytes);

			if (result.code !== 0) {
				toast.error('Error broadcasting transaction');
				setIsBroadcasting(false);
				return;
			}
			setIsBroadcasting(false);
			setBroadcastResponse(result);
		} catch (e) {
			console.log(e.message);
			toast.error(`Error broadcasting transaction: ${e.message}`);
			setIsBroadcasting(false);
			setBroadcastResponse(undefined);
		}
	};

	const signTransactionForMultiSig = async () => {
		if (!connectedWallet) {
			toast.info('Please connect your wallet first.');
			return;
		}
		const { multiSend } = cosmos.bank.v1beta1.MessageComposer.withTypeUrl;

		const totalAmountsByDenom = parsedRecipients.reduce((acc, recipient) => {
			if (acc[recipient.denom]) {
				acc[recipient.denom] += recipient.amount;
			} else {
				acc[recipient.denom] = recipient.amount;
			}
			return acc;
		}, {});

		const inputs = Object.entries(totalAmountsByDenom).map(([denom, amount]) => ({
			address: multiSigAccountAddress,
			coins: [{ denom, amount: amount.toString() }]
		}));

		const outputs = parsedRecipients.map((parseRecipient) => ({
			address: parseRecipient.recipient,
			coins: [{ denom: parseRecipient.denom, amount: parseRecipient.amount.toString() }]
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
				<div className={styles.cardTip}>
					<HiLightBulb className={styles.tipBulb} />
					<p className={styles.tipText}>Multi-sig must have signed and broadcast at least one transaction before this tool can be used.</p>
				</div>
				<input
					placeholder='Multi-sig address...'
					className={styles.input}
					value={multiSigAccountAddress}
					onChange={(e) => setMultiSigAccountAddress(e.target.value)}
				/>
				<button className={styles.button} disabled={isQueryingMultiSigAccount || !isValidSeiAddress(multiSigAccountAddress)} onClick={queryMultiSigAccount}>
					look up account
				</button>
			</div>
		);
	};

	const renderCSVUpload = () => {
		if (!multiSigAccount) return null;
		if (finalizedRecipients) return null;

		const renderRecipientList = () => {
			if (parsedRecipients.length === 0) return null;

			return (
				<div className={styles.recipient}>
					<div className={styles.recipientItem}>
						<p>RECIPIENT</p>
						<p>AMOUNT</p>
					</div>
					<div className={styles.recipientList}>
						{parsedRecipients.length === 0 ? (
							<p className={styles.emptySet}>No recipients added yet...</p>
						) : (
							parsedRecipients.map((recipient, index) => {
								return (
									<div key={index} className={styles.recipientItem}>
										<p>{recipient.recipient}</p>
										<p>
											{recipient.amount} {recipient.denom}
										</p>
									</div>
								);
							})
						)}
					</div>
				</div>
			);
		};

		const renderRecipientContent = () => {
			if (parsedRecipients.length !== 0) return null;

			return (
				<>
					<div className={styles.cardTip}>
						<BiSpreadsheet className={styles.tipBulb} />
						<p>Upload a CSV file with two columns "Recipient" and "Amount" for all the addresses you would like to send funds to. Amounts MUST be in usei.</p>
					</div>
					<CSVUpload onParseData={setParsedRecipients} />
				</>
			);
		};

		return (
			<div className={styles.card}>
				<p className={styles.cardHeader}>Step 2: {parsedRecipients.length === 0 ? 'Select' : 'Confirm'} Recipients</p>
				{renderRecipientContent()}
				{renderRecipientList()}
				<button
					disabled={parsedRecipients?.length === 0}
					className={cn(styles.button, { [styles.buttonReady]: parsedRecipients?.length !== 0 })}
					onClick={() => setFinalizedRecipients(parsedRecipients)}>
					Sign transaction
				</button>
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
				<p>
					This multi-sig requires {multiSigAccount.pubkey.value.threshold} signatures. Please either paste the encoded signatures from other accounts if you wish to
					broadcast this transaction or sign the transaction yourself and send the encoded signature to whoever will be broadcasting the transaction.
				</p>
				<h5>
					{previousSignatures.length}/{multiSigAccount.pubkey.value.threshold} required signatures added
				</h5>

				<div className={styles.signaturesList}>
					{previousSignatures.map((signature, index) => {
						const onClickCopy = () => {
							navigator.clipboard.writeText(signature);
							toast.info('Signature copied to clipboard');
						};
						const decodedSignature = JSON.parse(atob(signature));
						return (
							<div key={index} className={styles.signatureItem}>
								<p className={styles.cardHeader}>SIGNER {index + 1}:</p>
								<div className={styles.cardTip}>{decodedSignature && truncateAddress(decodedSignature.address)}</div>
								<button onClick={onClickCopy} className={styles.copyButton}>
									<FaCopy /> copy signature
								</button>
								<HiTrash
									className={styles.trash}
									onClick={() => {
										setPreviousSignatures(previousSignatures.filter((_, i) => i !== index));
									}}
								/>
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
				{!broadcastResponse && (
					<button
						className={cn(styles.button, { [styles.buttonReady]: hasRequiredNumberOfSignatures })}
						disabled={!hasRequiredNumberOfSignatures || isBroadcasting}
						onClick={sendMultiSig}>
						{isBroadcasting ? 'broadcasting...' : 'broadcast'}
					</button>
				)}
			</div>
		);
	};

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
				{renderCSVUpload()}
				{renderSignatureInputs()}
				{renderBroadcastResponse()}
			</div>
		);
	};

	return renderContent();
};

export default MultiSig;
