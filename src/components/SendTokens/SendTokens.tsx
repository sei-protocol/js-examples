import React, { useMemo, useState } from 'react';
import { calculateFee, GasPrice } from '@cosmjs/stargate';
import { toast } from 'react-toastify';
import { useSigningClient } from '@sei-js/react';
import { useRecoilState } from 'recoil';
import { balanceToSendAtom } from '../../recoil/atoms/sendTokens';
import { SendTokensProps } from './types';

const SendTokens = ({seiWallet}: SendTokensProps) => {
	const [balanceToSend, setBalanceToSend] = useRecoilState(balanceToSendAtom);

	const [isSending, setIsSending] = useState<boolean>(false);
	const [channelId, setChannelId] = useState<string>('');
	const [sendAmount, setSendAmount] = useState<string>('');
	const [destinationAddress, setDestinationAddress] = useState<string>('');

	const { offlineSigner, rpcUrl, accounts } = seiWallet;

	const { signingClient } = useSigningClient(rpcUrl, offlineSigner);

	const walletAccount = useMemo(() => accounts?.[0], [accounts]);

	if (!balanceToSend) return null;

	const isIbc = balanceToSend.denom.startsWith('ibc/');

	const onClickSend = async () => {
		if (!walletAccount) return;

		const fee = calculateFee(150000, GasPrice.fromString('3750usei'));
		const transferAmount = { amount: sendAmount, denom: balanceToSend.denom };

		try {
			setIsSending(true)
			if (isIbc) {
				const sendResponse = await signingClient.sendIbcTokens(
					walletAccount.address,
					destinationAddress,
					transferAmount,
					'transfer',
					channelId,
					{
						revisionHeight: '20',
						revisionNumber: '20'
					},
					0,
					fee
				);
				if (sendResponse.code === 0) {
					toast.success('Successfully sent IBC tokens!');
					setBalanceToSend(undefined);
				} else {
					toast.error('Error sending IBC Tokens', sendResponse.rawLog);
				}
			} else {
				const sendResponse = await signingClient.sendTokens(walletAccount.address, destinationAddress, [transferAmount], fee);
				if (sendResponse.code === 0) {
					toast.success('Successfully sent tokens!');
					setBalanceToSend(undefined);
				} else {
					toast.error('Error sending Tokens', sendResponse.rawLog);
				}
			}
			setIsSending(false)
		} catch (e: any) {
			toast.error(e.message);
			setIsSending(false)
		}
	};

	return (
		<div className='modal' onClick={() => setBalanceToSend(undefined)}>
			<div className='modalCard' onClick={(e) => e.stopPropagation()}>
				<h3 className='sectionHeader'>Send token</h3>
				<div className='cardContent'>
					<div className='labelInput'>
						<p className='label'>denom:</p>
						<input className='input' disabled={true} value={balanceToSend.denom}/>
					</div>
					<div className='labelInput'>
						<p className='label'>amount:</p>
						<input className='input' placeholder={`Amount in ${balanceToSend.denom}...`} value={sendAmount} onChange={(e) => setSendAmount(e.target.value)} />
					</div>
					<div className='labelInput'>
						<p className='label'>destination:</p>
						<input className='input' placeholder='Destination sei address...' value={destinationAddress} onChange={(e) => setDestinationAddress(e.target.value)} />
					</div>
					{isIbc && (
						<div className='labelInput'>
							<p className='label'>channel-id:</p>
							<input className='input' placeholder='Channel id...' value={channelId} onChange={(e) => setChannelId(e.target.value)} />
						</div>
					)}
					<div className={isSending ? 'sendButton sendButton-disabled' : 'sendButton'} onClick={onClickSend}>
						send
					</div>
				</div>
			</div>
		</div>
	);
};

export default SendTokens;
