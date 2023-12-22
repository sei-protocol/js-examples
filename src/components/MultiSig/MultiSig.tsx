import React, { useState } from 'react';
import { MultiSigProps } from './types';
import styles from './MultiSig.module.sass';
import { Registry } from '@cosmjs/proto-signing';
import { Account, calculateFee, defaultRegistryTypes, makeMultisignedTxBytes, StargateClient } from '@cosmjs/stargate';
import { cosmos } from '@sei-js/proto';
import { isMultisigThresholdPubkey, MultisigThresholdPubkey } from '@cosmjs/amino';
import { fromBase64, toBase64 } from '@cosmjs/encoding';
import { getSigningClient, isValidSeiAddress } from '@sei-js/core';
import { CSVUpload } from './components/CSVUpload';
import { RecipientAmount } from './components/CSVUpload/types';
import { useWallet } from '@sei-js/react';

const CHAIN_ID = 'atlantic-2';
const RPC_URL = 'https://rpc.atlantic-2.seinetwork.io';
const TX_FEE = calculateFee(100000, '0.1usei');

const MultiSig = ({}: MultiSigProps) => {
	// MultiSig sei18ec4x56fc74rnxgv34mj8uua6dtsxy5dlvfemt exists on atlantic-2 with accounts sei1vmt027ycnv0klf22j8wc3mnudasz370umc3ydq and sei14ae4g3422thcyuxler2ws3w25fpesrh2uqmgm9
	// https://www.seiscan.app/atlantic-2/accounts/sei18ec4x56fc74rnxgv34mj8uua6dtsxy5dlvfemt/overview
	// Successfully broadcast multisig transaction from CLI with TX HASH 33F337F989804EEAE6C36C5C6C5A767437F7330B10C97E640D67C5F304F6B748 on atlantic-2


	const { connectedWallet, accounts } = useWallet()

	window['compass'].defaultOptions = {
		sign: {
			disableBalanceCheck: true,
			preferNoSetFee: true,
			preferNoSetMemo: true
		}
	};
	window['leap'].defaultOptions = {
		sign: {
			disableBalanceCheck: true,
			preferNoSetFee: true,
			preferNoSetMemo: true
		}
	};

	const registry = new Registry(defaultRegistryTypes);

	const [multiSigAccountAddress, setMultiSigAccountAddress] = useState<string>('sei18ec4x56fc74rnxgv34mj8uua6dtsxy5dlvfemt');
	const [multiSigAccount, setMultiSigAccount] = useState<Account>();

	const [previousSignatures, setPreviousSignatures] = useState<any>();
	const [previousAddresses, setPreviousAddresses] = useState<any>();

	const [parsedRecipients, setParsedRecipients] = useState<RecipientAmount[]>();

	const [signResponseBody, setSignResponseBody] = useState<any>();
	const [signResponseSignature, setSignResponseSignature] = useState<any>();

	const [broadcastResponse, setBroadcastResponse] = useState<any>();

	const { multiSend, send } = cosmos.bank.v1beta1.MessageComposer.withTypeUrl;

	const recipientAddresses = ['sei1vwda8z8rpwcagd5ks7uqr3lt3cw9464hhswfe7', 'sei14ae4g3422thcyuxler2ws3w25fpesrh2uqmgm9'];
	const amountToSend = 10;

	const inputs = [
		{
			address: multiSigAccountAddress,
			coins: [{ denom: 'usei', amount: (amountToSend * recipientAddresses.length).toString() }]
		}
	];

	const outputs = recipientAddresses.map((address) => ({
		address: address,
		coins: [{ denom: 'usei', amount: amountToSend.toString() }]
	}));

	const message = multiSend({
		inputs: inputs,
		outputs: outputs
	});

	const bankSendMsg = send({
		fromAddress: multiSigAccountAddress,
		toAddress: 'sei1vwda8z8rpwcagd5ks7uqr3lt3cw9464hhswfe7',
		amount: [{ denom: 'usei', amount: amountToSend.toString() }]
	});

	const queryMultiSigAccount = async () => {
		const broadcaster = await StargateClient.connect(RPC_URL);
		const account = await broadcaster.getAccount(multiSigAccountAddress);
		setMultiSigAccount(account);
		console.log(account);
	}

	const sendMultiSig = async () => {
		// Fuzio
		// https://github.com/sei-protocol/fuzio-sei-multisig-ui/blob/40d72350db834b284562f81513ab18cffb30e9dd/pages/multi/%5Baddress%5D/transaction/%5BtransactionID%5D.tsx#L122
		// 1.) base64 decodes the signatures[0] and bodyBytes from signing
		// 2.) Makes the multisig tx bytes with makeMultisignedTxBytes
		// 3.) Creates StargateClient and broadcasts tx bytes
		// Gets multisig pubkey from account on chain https://github.com/sei-protocol/fuzio-sei-multisig-ui/blob/40d72350db834b284562f81513ab18cffb30e9dd/pages/multi/%5Baddress%5D/transaction/%5BtransactionID%5D.tsx#L95
		// https://github.com/sei-protocol/fuzio-sei-multisig-ui/blob/40d72350db834b284562f81513ab18cffb30e9dd/lib/multisigHelpers.ts#L58
		const broadcaster = await StargateClient.connect(RPC_URL);

		if (!multiSigAccount) {
			console.log('Can not find multi sig account on chain');
			return;
		}

		const multiSigPubkey = multiSigAccount.pubkey as unknown as MultisigThresholdPubkey;

		if (!isMultisigThresholdPubkey(multiSigPubkey)) {
			console.log('not a multi-sig threshold pubkey');
			return;
		}

		console.log('multiSigAccountOnChain', multiSigAccount);
		console.log('multiSignPubKey', multiSigPubkey);

		console.log('signResponseBody', signResponseBody);
		console.log('signResponseSignature', signResponseSignature);

		const currentAccountAddress = accounts[0].address;


		const signatures = new Map<string, Uint8Array>([
			[previousAddresses[0], fromBase64(previousSignatures[0])],
			[currentAccountAddress, fromBase64(signResponseSignature)],
		]);

		console.log('signatures', signatures);

		const multiSignedTxBytes = makeMultisignedTxBytes(
			multiSigPubkey,
			multiSigAccount.sequence,
			TX_FEE,
			fromBase64(signResponseBody),
			signatures
		);

		const result = await broadcaster.broadcastTx(multiSignedTxBytes);
		console.log(result);
		setBroadcastResponse(result);
	};

	const signTransactionForMultiSig = async () => {
		//Signing in Fuzio
		// https://github.com/sei-protocol/fuzio-sei-multisig-ui/blob/40d72350db834b284562f81513ab18cffb30e9dd/components/forms/TransactionSigning.tsx#L147
		// 1.) Get offline signer amino only
		// 2.) Get signing client
		// 3.) Sign TX
		// 4.) Fuzio base 64 encodes signatures[0] and bodyBytes, which get stored in DB and decoded later when making the multisig tx bytes
		const offlineAminoSigner = await connectedWallet.getOfflineSignerAmino(CHAIN_ID);
		const signingClient = await getSigningClient(RPC_URL, offlineAminoSigner);
		const response = await signingClient.sign(accounts[0].address, [bankSendMsg], TX_FEE, '', {
			accountNumber: multiSigAccount.accountNumber,
			sequence: multiSigAccount.sequence,
			chainId: CHAIN_ID
		});
		const decoded = registry.decodeTxBody(response.bodyBytes);
		console.log(decoded);
		setSignResponseBody(toBase64(response.bodyBytes));
		setSignResponseSignature(toBase64(response.signatures[0]));
	};

	const renderMultiSigLookup = () => {
		if(multiSigAccount) return null;

		return (
			<div className={styles.card}>
				<h3>Multi-Sig Account</h3>
				<input className={styles.input} value={multiSigAccountAddress} onChange={(e) => setMultiSigAccountAddress(e.target.value)} />
				<button className={styles.button} disabled={!isValidSeiAddress(multiSigAccountAddress)} onClick={queryMultiSigAccount}>look up multi-sig account</button>
			</div>
		)
	}

	const renderUnsignedTx = () => {
		if(!multiSigAccount) return null;

		if(parsedRecipients) return null;

		return (
			<div className={styles.card}>
				<h3>Recipients</h3>
				<p>Upload a CSV file with format recipient,amount for all the addresses you would like to send to</p>
				<CSVUpload onParseData={setParsedRecipients} />
			</div>
		)
	}

	const renderSignatureInputs = () => {
		if(!parsedRecipients) return null;

		return (
			<div className={styles.card}>
				<h3>Signatures</h3>
				<p>This multi-sig requires {multiSigAccount.pubkey.value.threshold} signatures. Please paste the other base64 encoded signatures below</p>
				{Array.from({ length: multiSigAccount.pubkey.value.threshold - 1 }, (_, index) => (
					<>
						<input
							className={styles.input}
							key={index}
							placeholder="Address..."
							onChange={(e) => setPreviousAddresses({ ...previousAddresses, [index]: e.target.value })}
						/>
						<input
							className={styles.input}
							key={index}
							placeholder="Signature..."
							onChange={(e) => setPreviousSignatures({ ...previousSignatures, [index]: e.target.value })}
						/>
					</>
				))}

				<div>
					<button className={styles.button} onClick={signTransactionForMultiSig}>sign tx myself</button>
					{accounts && signResponseSignature && (
						<>
							<p>{accounts[0].address}</p>
							<p>{signResponseSignature}</p>
						</>
					)}
				</div>
			</div>
		);
	}

	const renderContent = () => {
		return (
			<div className={styles.content}>
				{renderMultiSigLookup()}
				{renderUnsignedTx()}
				{renderSignatureInputs()}
				{signResponseSignature && previousSignatures?.[0] && <button className={styles.button} onClick={sendMultiSig}>broadcast</button>}

				{broadcastResponse && (
					<div>
						<p>Broadcast response</p>
						<p>{broadcastResponse}</p>
					</div>
				)}
			</div>
		);
	};

	return renderContent();
};

export default MultiSig;

// Steps for MULTI SIG on CLI
// 1.) Create Multi Sig Account on chain (assuming signer1 and signer2 exist in keychain)
// seid keys add multisigAccountName --multisig=signer1,signer2 --multisig-threshold=2
//
// 2.) Sign unsigned tx from both signers (see unsigned-tx.json) and output json files of signed tx's
// seid tx sign unsigned-tx.json --multisig=multisigAccountName --from=signer1 --chain-id=atlantic-2 --output-document=signer1_signedTx.json
// seid tx sign unsigned-tx.json --multisig=multisigAccountName --from=signer2 --chain-id=atlantic-2 --output-document=signer2_signedTx.json
//
// 3.) Sign tx from multisig account and output to json file of signed tx
// seid tx multisign unsigned-tx.json multisigb signer1_signedTx.json signer2_signedTx.json > signedTx.json
//
// 4.) Broadcast multisig tx
// seid tx broadcast signedTx.json --chain-id atlantic-2 --node https://rpc.atlantic-2.seinetwork.io

// sei1vmt027ycnv0klf22j8wc3mnudasz370umc3ydq
// mimgeaCo5swd38E6I+6TEjlibFuhIEHeKxgM2eRSqBpo5iJ/hH7UXlr8lNb/95UC6CrTiM8RseCTnKr1HQT+UQ==
