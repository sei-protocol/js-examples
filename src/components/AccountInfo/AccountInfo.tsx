import React, { useEffect, useMemo, useState } from 'react';
import { IoSendSharp } from 'react-icons/io5';
import { useSetRecoilState } from 'recoil';
import { useQueryClient, useWallet } from '@sei-js/react';

import { BalanceResponseType } from '../../types';
import { balanceToSendAtom } from '../../recoil';
import './styles.css';
import { QueryAllBalancesRequest } from '@sei-js/proto/dist/types/codegen/cosmos/bank/v1beta1/query';
import { toast } from 'react-toastify';

const AccountInfo = () => {
	const { accounts } = useWallet();
	const { queryClient } = useQueryClient();

	const setBalanceToSend = useSetRecoilState(balanceToSendAtom);

	const [walletBalances, setWalletBalances] = useState<BalanceResponseType[]>([]);
	const [isFetchingBalances, setIsFetchingBalances] = useState<boolean>(true);

	const firstAccount = useMemo(() => accounts?.[0], [accounts]);

	useEffect(() => {
		const fetchBalances = async (): Promise<BalanceResponseType[]> => {
			if (queryClient && firstAccount) {
				const { balances } = await queryClient.cosmos.bank.v1beta1.allBalances({ address: firstAccount.address } as QueryAllBalancesRequest);
				return balances as BalanceResponseType[];
			}
			return [];
		};

		setIsFetchingBalances(true);
		fetchBalances()
			.then((balances) => {
				setIsFetchingBalances(false);
				setWalletBalances(balances);
			})
			.catch((e) => {
				console.error('Error fetching balances', e.message);
				toast.error('Error fetching balances');
				return [];
			});
	}, [queryClient, firstAccount]);

	const renderBalances = () => {
		if (!firstAccount) {
			return <p>Wallet not connected</p>;
		}

		if (isFetchingBalances) {
			return null;
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

	const renderContent = () => {
		return (
			<div className='tokens'>
				<div className='tokenRow'>
					<div className='tokenAmount'>AMOUNT</div>
					<div className='tokenDenom'>DENOM</div>
					<div className='icon' />
				</div>
				{renderBalances()}
			</div>
		);
	};

	return (
		<div className='card'>
			<h3 className='sectionHeader'>Account</h3>
			<div className='cardContent'>{renderContent()}</div>
		</div>
	);
};

export default AccountInfo;
