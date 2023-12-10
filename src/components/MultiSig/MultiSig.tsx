import React, { useState } from 'react';
import { MultiSigProps } from './types';
import styles from './MultiSig.module.sass';
import { useSigningClient, useWallet, WalletConnectButton } from '@sei-js/react';
import { CodeExecute } from '../CodeExecute';
import { calculateFee, makeMultisignedTx } from '@cosmjs/stargate';
import { createMultisigThresholdPubkey } from '@cosmjs/amino';
import { cosmos } from '@sei-js/proto';
import { TxRaw } from 'cosmjs-types/cosmos/tx/v1beta1/tx';
import { MultiSignature } from 'cosmjs-types/cosmos/crypto/multisig/v1beta1/multisig';
import { coin } from '@cosmjs/proto-signing';

const MultiSig = ({}: MultiSigProps) => {
	const { connectedWallet, accounts } = useWallet();
	const { signingClient, isLoading } = useSigningClient();

	const [signResponse, setSignResponse] = useState<any>();

	if(!connectedWallet) return <WalletConnectButton buttonClassName={styles.connectButton}/>

	const { multiSend } = cosmos.bank.v1beta1.MessageComposer.withTypeUrl;

	const senderAddress = accounts[0].address;
	const recipientAddresses = ["sei1vwda8z8rpwcagd5ks7uqr3lt3cw9464hhswfe7", "sei14ae4g3422thcyuxler2ws3w25fpesrh2uqmgm9"];
	const amountToSend = 10;

	const inputs = [{
		address: senderAddress,
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

	const firstSignature = [136,215,90,232,23,151,115,130,218,115,71,85,28,98,76,147,6,207,62,121,164,179,137,161,226,199,137,144,38,101,136,67,12,23,238,179,60,247,49,121,174,135,207,116,29,61,3,151,236,220,214,61,94,148,221,208,68,59,38,68,145,244,164,139];
	const hardcodedFirstSignature = new Uint8Array(firstSignature);

	const sendMultiSig = async (response: TxRaw) => {
		const multisigAccountAddress = "sei1xm8xw9nrnm0jt7lhqqfu8ldtehs3zaxx4ek8wg";

		const dev1Address = "sei1jetzv4xj3lstm220dqqq5a65eh3qq7dn2cp8e8";
		const dev1Account = await signingClient.getAccount(dev1Address);

		const dev2Address = "sei14ae4g3422thcyuxler2ws3w25fpesrh2uqmgm9";
		const dev2Account = await signingClient.getAccount(dev2Address);

		const multiSigAccountOnChain = await signingClient.getAccount(multisigAccountAddress);
		console.log('accountOnChain', multiSigAccountOnChain);
		console.log([hardcodedFirstSignature, response.signatures[0]])
		const multiSig = MultiSignature.fromPartial({
			signatures: [hardcodedFirstSignature, response.signatures[0]],
		});

		if(!multiSigAccountOnChain) return;

		const multiSigPubkey = createMultisigThresholdPubkey([dev1Account.pubkey, dev2Account.pubkey], 2);

		const signedTx = makeMultisignedTx(
			multiSigPubkey,
			multiSigAccountOnChain.sequence,
			{amount: [coin(100000, 'usei')], gas: '1000000'},
			response.bodyBytes,
			new Map<string, Uint8Array>([
				[dev1Address, hardcodedFirstSignature],
				[dev2Address, response.signatures[0]],
			]),
		);

		const otherResponse = await signingClient.broadcastTx(Uint8Array.from(TxRaw.encode(signedTx).finish()));

		console.log('otherResponse', otherResponse);

		// const txRaw = TxRaw.fromPartial({
		// 	bodyBytes: response.bodyBytes,
		// 	authInfoBytes: response.authInfoBytes,
		// 	signatures: [MultiSignature.encode(multiSig).finish()],
		// });

		// const broadcastResult = await signingClient.broadcastTx(TxRaw.encode(txRaw).finish());
		// console.log('broadcast', broadcastResult);
		// setSignResponse(broadcastResult);
	}



	const signAndSendTransaction = async () =>  {
		const fee = calculateFee(100000, "0.1usei");
		const response = await signingClient.sign(accounts[0].address, [message], fee, 'Multi Sig Transaction');
		console.log(`Signature for ${accounts[0].address}: ${response.signatures[0]}`)
		await sendMultiSig(response);
	}

	return (
		<div className={styles.content}>
			<CodeExecute title={"Sign a bank send"} text={JSON.stringify(message, null, 2)} onClickExecute={signAndSendTransaction} response={signResponse}/>
		</div>
	);
};

export default MultiSig;

// sei1n52las8cca8cz8hyfp7fwav7v9xan9srz4pny4f

// Local chain multisig
//sei1hmkqt6lzwr6n8am8j7ptxw6duegeffqpsgl8nl

// seid keys add multisigUI --multisig=dev1,dev2 --multisig-threshold=2 --chain-id atlantic-2 --node https://rpc.wallet.atlantic-2.sei.io
// seid tx bank send admin sei1xm8xw9nrnm0jt7lhqqfu8ldtehs3zaxx4ek8wg 10usei --fees 100000usei --chain-id atlantic-2 --node https://rpc.wallet.atlantic-2.sei.io

// seid tx bank send sei1hmkqt6lzwr6n8am8j7ptxw6duegeffqpsgl8nl sei1vpdckf2ws78glqu38pfdggvd0j65ynfn2z3yte 10usei --fees 100000usei --chain-id atlantic-2 --node https://rpc.wallet.atlantic-2.sei.io --generate-only > unsigned-tx.json

// seid tx sign unsigned-tx.json --multisig=multisig --from=admin1 --chain-id=sei-chain --output-document=admin1_signedTx.json
// seid tx sign unsigned-tx.json --multisig=multisig --from=admin2 --chain-id=sei-chain --output-document=admin2_signedTx.json

// seid tx multisign unsigned-tx.json multisig admin1_signedTx.json admin2_signedTx.json > signedTx.json
// seid tx broadcast signedTx.json

