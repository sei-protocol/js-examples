import React, { useEffect, useMemo, useState } from 'react';
import { IoCopySharp, IoSendSharp } from 'react-icons/io5';
import { toast } from 'react-toastify';
import { useSetRecoilState } from 'recoil';
import { useQueryClient, useWallet } from '@sei-js/react';
import { BalanceResponseType } from '../../types/BalanceResponse';
import { balanceToSendAtom } from '../../recoil/atoms/sendTokens';
import './styles.css';

const AccountInfo = () => {
	const { offlineSigner, accounts } = useWallet();
	const { queryClient } = useQueryClient();
	const setBalanceToSend = useSetRecoilState(balanceToSendAtom);

	const [walletBalances, setWalletBalances] = useState<BalanceResponseType[]>([]);

	const walletAccount = useMemo(() => accounts?.[0], [accounts]);

	useEffect(() => {
		const fetchBalances = async () => {
			if (queryClient && walletAccount) {
				const { balances } = await queryClient.cosmos.bank.v1beta1.allBalances({ address: walletAccount.address });
				return balances as BalanceResponseType[];
			}
			return [];
		};

		fetchBalances().then(setWalletBalances);
	}, [offlineSigner]);

	const renderBalances = () => {
		if (!walletAccount) {
			return <p>Wallet not connected</p>;
		}
		if (walletBalances.length === 0) {
			return (
				<div>
					<p>No tokens available</p>
				</div>
			);
		}

		return walletBalances?.map((balance) => {
			return (
				<div className='tokenRow' key={balance.denom}>
					<div className='tokenAmount'>{balance.amount}</div>
					<div className='tokenDenom'>{balance.denom}</div>
					<IoSendSharp className='icon' onClick={() => setBalanceToSend(balance)} />
				</div>
			);
		});
	};

	const onClickCopy = () => {
		toast.info('Copied address to clipboard!');
		navigator.clipboard.writeText(walletAccount?.address || '').then();
	};

	return (
		<div className='card'>
			<h3 className='sectionHeader'>Account info</h3>
			<div className='cardContent'>
				<div className='addressWrapper'>
					<p className='accountAddress'>{walletAccount?.address || 'No account found!'}</p>
					<IoCopySharp className='copy' onClick={onClickCopy} />
				</div>
				<div className='tokens'>{renderBalances()}</div>
			</div>
		</div>
	);
};

export default AccountInfo;
