import React, { useMemo, useState } from 'react';
import { SignaturePageProps } from './types';
import styles from '../../MultiSig.module.sass';
import { toast } from 'react-toastify';
import { FaCopy } from '@react-icons/all-files/fa/FaCopy';
import { getSigningClient, isValidSeiAddress } from '@sei-js/core';
import { HiTrash } from '@react-icons/all-files/hi/HiTrash';
import { FaSignature } from '@react-icons/all-files/fa/FaSignature';
import { FaPlus } from '@react-icons/all-files/fa/FaPlus';
import { cosmos } from '@sei-js/proto';
import { isMultisigThresholdPubkey, MultisigThresholdPubkey } from '@cosmjs/amino';
import { fromBase64, toBase64 } from '@cosmjs/encoding';
import { calculateFee, makeMultisignedTxBytes, StargateClient } from '@cosmjs/stargate';
import { useWallet } from '@sei-js/react';
import cn from 'classnames';

export const truncateAddress = (address: string) => {
	if (!isValidSeiAddress(address)) {
		return address;
	}
	return `${address.slice(0, 6)}....${address.slice(address.length - 6)}`;
};

const SignaturePage = ({multiSigAccount, finalizedRecipients, txMemo, handleBack, previousSignatures, setBroadcastResponse, setPreviousSignatures}: SignaturePageProps) => {
    const { connectedWallet, accounts, chainId, rpcUrl } = useWallet();
	const [isBroadcasting, setIsBroadcasting] = useState<boolean>(false);
    const [encodedSignatureInput, setEncodedSignatureInput] = useState<string>();
	const hasRequiredNumberOfSignatures = useMemo(() => {
		if (!multiSigAccount) return false;
		return parseInt(multiSigAccount.pubkey.value.threshold) === previousSignatures.length;
	}, [multiSigAccount, previousSignatures]);
    
    const TX_FEE = calculateFee(400000, '0.1usei');

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
			console.log(e);
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

		const totalAmountsByDenom = finalizedRecipients.reduce((acc, recipient) => {
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

		const outputs = finalizedRecipients.map((recipient) => ({
			address: recipient.recipient,
			coins: [{ denom: recipient.denom, amount: recipient.amount.toString() }]
		}));

		const multiSendMsg = multiSend({
			inputs: inputs,
			outputs: outputs
		});

		const offlineAminoSigner = await connectedWallet.getOfflineSignerAmino(chainId);
		const signingClient = await getSigningClient(rpcUrl, offlineAminoSigner);
		const response = await signingClient.sign(accounts[0].address, [multiSendMsg], TX_FEE, txMemo, {
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

    const addSignature = () => {
        if (encodedSignatureInput) {
            setPreviousSignatures([...previousSignatures, encodedSignatureInput]);
            setEncodedSignatureInput('');
        }
    };

    const renderSignaturePage = () => {
        return (
            <div className={styles.card}>
                <p className={styles.cardHeader}>Step 4: Sign TX or paste other's signatures</p>
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
                <div className={styles.backAndNextSection}>
                    <button className={styles.button} onClick={handleBack}>Back</button>
                    <button
                        className={cn(styles.button, { [styles.buttonReady]: hasRequiredNumberOfSignatures })}
                        disabled={!hasRequiredNumberOfSignatures || isBroadcasting}
                        onClick={sendMultiSig}>
                        {isBroadcasting ? 'broadcasting...' : 'Broadcast Transaction'}
                    </button>
                </div>
            </div>
        );
    }
    
    return renderSignaturePage();
}

export default SignaturePage;