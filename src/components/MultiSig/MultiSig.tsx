import React, { useState } from 'react';
import { MultiSigProps } from './types';
import styles from './MultiSig.module.sass';
import { calculateFee, makeMultisignedTxBytes, StargateClient } from '@cosmjs/stargate';
import { cosmos } from '@sei-js/proto';
import { coin } from '@cosmjs/proto-signing';
import { isMultisigThresholdPubkey, MultisigThresholdPubkey } from '@cosmjs/amino';
import { getSigningClient } from '@sei-js/core';

const CHAIN_ID = "atlantic-2";
const RPC_URL = "https://rpc.atlantic-2.seinetwork.io";
const TX_FEE = calculateFee(100000, "0.1usei");

const MultiSig = ({}: MultiSigProps) => {
	// MultiSig sei18ec4x56fc74rnxgv34mj8uua6dtsxy5dlvfemt exists on atlantic-2 with accounts sei1vmt027ycnv0klf22j8wc3mnudasz370umc3ydq and sei14ae4g3422thcyuxler2ws3w25fpesrh2uqmgm9
	// https://www.seiscan.app/atlantic-2/accounts/sei18ec4x56fc74rnxgv34mj8uua6dtsxy5dlvfemt/overview
	// Successfully broadcast multisig transaction from CLI with TX HASH 33F337F989804EEAE6C36C5C6C5A767437F7330B10C97E640D67C5F304F6B748 on atlantic-2

	const [finAddress, setFinAddress] = useState<any>("sei1vmt027ycnv0klf22j8wc3mnudasz370umc3ydq");
	const [compassAddress, setCompassAddress] = useState<any>("sei14ae4g3422thcyuxler2ws3w25fpesrh2uqmgm9");
	const [multiSigAccountAddress, setMultiSigAccountAddress] = useState<string>("sei18ec4x56fc74rnxgv34mj8uua6dtsxy5dlvfemt");

	const [finSignResponse, setFinSignResponse] = useState<any>();
	const [compassSignResponse, setCompassSignResponse] = useState<any>();
	const [broadcastResponse, setBroadcastResponse] = useState<any>();

	const { multiSend } = cosmos.bank.v1beta1.MessageComposer.withTypeUrl;

	const recipientAddresses = ["sei1vwda8z8rpwcagd5ks7uqr3lt3cw9464hhswfe7", "sei14ae4g3422thcyuxler2ws3w25fpesrh2uqmgm9"];
	const amountToSend = 10;

	const inputs = [{
		address: multiSigAccountAddress,
		coins: [{ denom: "usei", amount: (amountToSend * recipientAddresses.length).toString() }]
	}];

	const outputs = recipientAddresses.map(address => ({
		address: address,
		coins: [{ denom: "usei", amount: amountToSend.toString() }]
	}));

	const message = multiSend({
		inputs: inputs,
		outputs: outputs
	});

	const sendMultiSig = async () => {
		// Fuzio
		// https://github.com/sei-protocol/fuzio-sei-multisig-ui/blob/40d72350db834b284562f81513ab18cffb30e9dd/pages/multi/%5Baddress%5D/transaction/%5BtransactionID%5D.tsx#L122
		// 1.) base64 decodes the signatures[0] and bodyBytes from signing
		// 2.) Makes the multisig tx bytes with makeMultisignedTxBytes
		// 3.) Creates StargateClient and broadcasts tx bytes
		// Gets multisig pubkey from account on chain https://github.com/sei-protocol/fuzio-sei-multisig-ui/blob/40d72350db834b284562f81513ab18cffb30e9dd/pages/multi/%5Baddress%5D/transaction/%5BtransactionID%5D.tsx#L95
		// https://github.com/sei-protocol/fuzio-sei-multisig-ui/blob/40d72350db834b284562f81513ab18cffb30e9dd/lib/multisigHelpers.ts#L58
		const broadcaster = await StargateClient.connect(RPC_URL);

		const compassOfflineSigner = await window['compass'].getOfflineSignerOnlyAmino(CHAIN_ID);
		const compassSigningClient = await getSigningClient(RPC_URL, compassOfflineSigner)
		const compassAccount = await compassSigningClient.getAccount(compassAddress);

		const finOfflineSigner = await window['fin'].getOfflineSignerOnlyAmino(CHAIN_ID);
		const finSigningClient = await getSigningClient(RPC_URL, finOfflineSigner)
		const finAccount = await finSigningClient.getAccount(finAddress);

		console.log('compassAccount', compassAccount);
		console.log('finAccount', finAccount);

		const multiSigAccountOnChain = await broadcaster.getAccount(multiSigAccountAddress);
		if(!multiSigAccountOnChain) {
			console.log('Can not find multi sig account on chain')
			return;
		}

		const multiSigPubkey = multiSigAccountOnChain.pubkey as unknown as MultisigThresholdPubkey;

		if(!isMultisigThresholdPubkey(multiSigPubkey)) {
			console.log('not a multi-sig threshold pubkey')
			return;
		}

		console.log('multiSigAccountOnChain', multiSigAccountOnChain);
		console.log('multiSignPubKey', multiSigPubkey);

		// console.log('finSignResponse', finSignResponse);
		// console.log('compassSignResponse', compassSignResponse);

		const multiSignedTxBytes = makeMultisignedTxBytes(
			multiSigPubkey,
			multiSigAccountOnChain.sequence,
			{amount: [coin(100000, 'usei')], gas: '1000000'},
			compassSignResponse.bodyBytes,
			new Map<string, Uint8Array>([
				[compassAddress, compassSignResponse.signatures[0]],
				[finAddress, finSignResponse.signatures[0]],
			]),
		);

		const result = await broadcaster.broadcastTx(multiSignedTxBytes);
		setBroadcastResponse(result)
	}

	const signFinTransaction = async () =>  {
		//Signing in Fuzio
		// https://github.com/sei-protocol/fuzio-sei-multisig-ui/blob/40d72350db834b284562f81513ab18cffb30e9dd/components/forms/TransactionSigning.tsx#L147
		// 1.) Get offline signer amino only
		// 2.) Get signing client
		// 3.) Sign TX
		// 4.) Fuzio base 64 encodes signatures[0] and bodyBytes, which get stored in DB and decoded later when making the multisig tx bytes
		const finOfflineSigner = await window['fin'].getOfflineSignerOnlyAmino(CHAIN_ID);
		const finAccounts = await finOfflineSigner.getAccounts();
		const finSigningClient = await getSigningClient(RPC_URL, finOfflineSigner)
		const response = await finSigningClient.sign(finAccounts[0].address, [message], TX_FEE, 'Multi Sig Transaction');
		setFinSignResponse(response);
	}

	const signCompassTransaction = async () =>  {
		//Signing in Fuzio
		// https://github.com/sei-protocol/fuzio-sei-multisig-ui/blob/40d72350db834b284562f81513ab18cffb30e9dd/components/forms/TransactionSigning.tsx#L147
		// 1.) Get offline signer amino only
		// 2.) Get signing client
		// 3.) Sign TX
		// 4.) Fuzio base 64 encodes signatures[0] and bodyBytes, which get stored in DB and decoded later when making the multisig tx bytes
		const compassOfflineSigner = await window['compass'].getOfflineSignerOnlyAmino(CHAIN_ID);
		const compassAccounts = await compassOfflineSigner.getAccounts();
		const compassSigningClient = await getSigningClient(RPC_URL, compassOfflineSigner)
		const response = await compassSigningClient.sign(compassAccounts[0].address, [message], TX_FEE, 'Multi Sig Transaction');
		setCompassSignResponse(response);
	}

	const renderContent = () => {
		return <div className={styles.content}>
			<div>
				<p>MultiSig account address</p>
				<input className={styles.input} value={multiSigAccountAddress} onChange={(e) => setMultiSigAccountAddress(e.target.value)}/>
			</div>
			<div>
				<p>Fin account address</p>
				<input className={styles.input} value={finAddress} onChange={(e) => setFinAddress(e.target.value)}/>
			</div>
			<div>
				<p>Compass account address</p>
				<input className={styles.input} value={compassAddress} onChange={(e) => setCompassAddress(e.target.value)}/>
			</div>
			<button onClick={signFinTransaction}>sign tx Fin</button>
			{finSignResponse && <button onClick={signCompassTransaction}>sign tx Compass</button>}
			{compassSignResponse && <button onClick={sendMultiSig}>broadcast</button>}


			{broadcastResponse && (
				<div>
					<p>Broadcast response</p>
					<p>{broadcastResponse}</p>
				</div>
			)}
		</div>
	}

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
