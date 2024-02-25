import React, { useMemo, useState } from 'react';
import { SignaturePageProps } from './types';
import styles from '../../MultiSig.module.sass';
import { toast } from 'react-toastify';
import { getSigningClient, isValidSeiAddress } from '@sei-js/core';
import { HiTrash } from '@react-icons/all-files/hi/HiTrash';
import { FaSignature } from '@react-icons/all-files/fa/FaSignature';
import { cosmos } from '@sei-js/proto';
import { isMultisigThresholdPubkey, MultisigThresholdPubkey } from '@cosmjs/amino';
import { fromBase64, toBase64 } from '@cosmjs/encoding';
import { calculateFee, makeMultisignedTxBytes, StargateClient } from '@cosmjs/stargate';
import { useWallet } from '@sei-js/react';
import cn from 'classnames';
import { useRecoilState } from 'recoil';
import { multiSigAccountAtom, multiSigEncodedSignaturesAtom, multiSigManualAccountsAtom, multiSigRecipientsAtom, multiSigTxMemoAtom } from '../../../../recoil';
import { FaCopy } from '@react-icons/all-files/fa/FaCopy';

export const truncateAddress = (address: string) => {
	if (!isValidSeiAddress(address)) {
		return address;
	}
	return `${address.slice(0, 6)}....${address.slice(address.length - 6)}`;
};

const SignaturePage = ({ setBroadcastResponse }: SignaturePageProps) => {
	const { connectedWallet, accounts, chainId, rpcUrl } = useWallet();
	const [isBroadcasting, setIsBroadcasting] = useState<boolean>(false);

	const [encodedSignatures, setEncodedSignatures] = useRecoilState(multiSigEncodedSignaturesAtom);
	const [multiSendRecipients, setMultiSendRecipients] = useRecoilState(multiSigRecipientsAtom);

	const [multiSigAccount, setMultiSigAccount] = useRecoilState(multiSigAccountAtom);
	const [txMemo, setTxMemo] = useRecoilState(multiSigTxMemoAtom);
	const [multiSigManualAccounts, setMultiSigManualAccounts] = useRecoilState(multiSigManualAccountsAtom);

	const hasRequiredNumberOfSignatures = useMemo(() => {
		if (!multiSigAccount) return false;
		return parseInt(multiSigAccount.pubkey.value.threshold) === encodedSignatures.length;
	}, [multiSigAccount, encodedSignatures]);

	const hasConnectedWalletSigned = useMemo(() => {
		if (!connectedWallet) return false;
		return !!encodedSignatures.find((signature) => {
			const decodedSignature = JSON.parse(atob(signature));
			return decodedSignature.address === accounts[0].address;
		});
	}, [connectedWallet, encodedSignatures]);

	const TX_FEE = calculateFee(400000, '0.1usei');

	const signTransaction = async () => {
		if (!connectedWallet) {
			toast.info('Please connect your wallet first.');
			return;
		}

		const { multiSend } = cosmos.bank.v1beta1.MessageComposer.withTypeUrl;

		const totalAmountsByDenom = multiSendRecipients.reduce((acc, recipient) => {
			if (acc[recipient.denom]) {
				acc[recipient.denom] += recipient.amount;
			} else {
				acc[recipient.denom] = recipient.amount;
			}
			return acc;
		}, {});

		const inputs = Object.entries(totalAmountsByDenom).map(([denom, amount]) => ({
			address: multiSigAccount.address,
			coins: [{ denom, amount: amount.toString() }]
		}));

		const outputs = multiSendRecipients.map((recipient) => ({
			address: recipient.recipient,
			coins: [{ denom: recipient.denom, amount: recipient.amount.toString() }]
		}));

		const multiSendMsg = multiSend({
			inputs: inputs,
			outputs: outputs
		});

		const offlineAminoSigner = await connectedWallet.getOfflineSignerAmino(chainId);
		const signingClient = await getSigningClient(rpcUrl, offlineAminoSigner);
		const multiSigSequence = await signingClient.getSequence(multiSigAccount.address);

		const response = await signingClient.sign(accounts[0].address, [multiSendMsg], TX_FEE, txMemo, {
			accountNumber: multiSigSequence.accountNumber || multiSigAccount.accountNumber,
			sequence: multiSigSequence.sequence || multiSigAccount.sequence,
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
		setEncodedSignatures([...encodedSignatures, encodedSignatureObject]);
	};

	const sendMultiSig = async () => {
		try {
			if (isBroadcasting) return;
			setIsBroadcasting(true);
			const broadcaster = await StargateClient.connect(rpcUrl);

			const multiSigPubkey = multiSigAccount.pubkey as unknown as MultisigThresholdPubkey;

			if (!isMultisigThresholdPubkey(multiSigPubkey)) {
				toast.error('not a multi-sig threshold pubkey');
				setIsBroadcasting(false);
				return;
			}

			const firstSignatureDecoded = JSON.parse(atob(encodedSignatures[0]));

			const signaturesArray: [string, Uint8Array][] = encodedSignatures.map((signature) => {
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
			console.error(e);
			toast.error(`Error broadcasting transaction: ${e.message}`);
			setIsBroadcasting(false);
			setBroadcastResponse(undefined);
		}
	};

	const copyLink = async () => {
		const rawObject = {
			chainId,
			multiSigAccount,
			multiSigManualAccounts,
			encodedSignatures,
			multiSendRecipients,
			txMemo
		};

		const encodedObject = btoa(JSON.stringify(rawObject));

		await navigator.clipboard.writeText(`${window.location.origin}/multi-sig?data=${encodedObject}`);

		toast.info('Copied link to clipboard!');
	};

	const renderSignaturePage = () => {
		return (
			<div className={styles.card}>
				<p className={styles.cardHeader}>Step 4: Sign TX</p>
				<p>
					This multi-sig requires {multiSigAccount.pubkey.value.threshold} signatures. Please either paste the encoded signatures from other accounts if you wish to
					broadcast this transaction or sign the transaction yourself and send the encoded signature to whoever will be broadcasting the transaction.
				</p>
				<h5>
					{encodedSignatures.length}/{multiSigAccount.pubkey.value.threshold} required signatures added
				</h5>

				<div className={styles.signaturesList}>
					{encodedSignatures.map((signature, index) => {
						const decodedSignature = JSON.parse(atob(signature));
						return (
							<div key={index} className={styles.signatureItem}>
								<p className={styles.cardHeader}>SIGNER {index + 1}:</p>
								<div className={styles.cardTip}>{decodedSignature && truncateAddress(decodedSignature.address)}</div>
								<HiTrash
									className={styles.trash}
									onClick={() => {
										setEncodedSignatures(encodedSignatures.filter((_, i) => i !== index));
									}}
								/>
							</div>
						);
					})}
					{!hasConnectedWalletSigned && (
						<button className={styles.button} onClick={signTransaction}>
							<FaSignature /> Sign transaction
						</button>
					)}
					{!hasRequiredNumberOfSignatures && hasConnectedWalletSigned && (
						<button onClick={copyLink}>
							<FaCopy /> Copy link
						</button>
					)}
				</div>
				<div className={styles.backAndNextSection}>
					<button className={styles.button} onClick={() => setMultiSendRecipients([])}>
						Back
					</button>
					<button
						className={cn(styles.button, { [styles.buttonReady]: hasRequiredNumberOfSignatures })}
						disabled={!hasRequiredNumberOfSignatures || isBroadcasting}
						onClick={sendMultiSig}>
						{isBroadcasting ? 'broadcasting...' : 'Broadcast Transaction'}
					</button>
				</div>
			</div>
		);
	};

	return renderSignaturePage();
};

export default SignaturePage;
