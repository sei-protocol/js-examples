import React, { useCallback, useEffect, useState } from 'react';
import './styles.css';
import { useQueryClient, useWallet } from '@sei-js/react';
import Dropdown from 'react-dropdown';
import ReactJson from 'react-json-view';

const DexModule = () => {
	const { accounts } = useWallet();
	const { queryClient } = useQueryClient();

	const [response, setResponse] = useState<object>();

	const [contractAddress, setContractAddress] = useState('sei12k3aacdygvjuran5hz60067pgu2uuuscz3styw2zk3q4aedj0v2sjq3tsj');
	const [queryType, setQueryType] = useState('getHistoricalPrices');

	const queryContract = useCallback(async () => {
		if (!queryClient) return;
		setResponse(undefined);
		try {
			switch (queryType) {
				case 'getOrders':
					const getOrdersQuery = {
						contractAddr: contractAddress,
						account: accounts[0].address
					};
					setResponse(await queryClient.seiprotocol.seichain.dex.getOrders(getOrdersQuery));
					return;
				case 'getHistoricalPrices':
					const getHistoricalPricesQuery = {
						contractAddr: contractAddress,
						priceDenom: 'ATOM',
						assetDenom: 'UST2',
						periodLengthInSeconds: 100 as never,
						numOfPeriods: 5 as never
					};
					setResponse(await queryClient.seiprotocol.seichain.dex.getHistoricalPrices(getHistoricalPricesQuery));
					return;
				case 'getMarketSummary':
					const marketSummaryQuery = {
						contractAddr: contractAddress,
						priceDenom: 'ATOM',
						assetDenom: 'UST2',
						lookbackInSeconds: 100 as never
					};
					setResponse(await queryClient.seiprotocol.seichain.dex.getMarketSummary(marketSummaryQuery));
					return;
			}
		} catch (e: any) {
			setResponse({ error: e.message });
		}
	}, [queryClient, queryType]);

	useEffect(() => {
		queryContract().then();
	}, [queryClient, contractAddress, queryType]);

	return (
		<div className='card'>
			<h3 className='sectionHeader'>Dex module</h3>
			<div className='cardContent'>
				<div className='labelInput'>
					<p className='label'>contract address:</p>
					<input
						autoFocus={true}
						placeholder='enter a dex contract address...'
						className='input'
						value={contractAddress}
						onChange={(e) => setContractAddress(e.target.value)}
					/>
				</div>
				<Dropdown
					className='dropdown'
					options={['getHistoricalPrices', 'getOrders', 'getMarketSummary']}
					onChange={(dropdown) => setQueryType(dropdown.value as any)}
					value={queryType}
					placeholder='Select a query'
				/>
				<div className='marketSummary'>
					<div className='marketSummary--item'>{response && <ReactJson theme='monokai' src={response} />}</div>
				</div>
			</div>
		</div>
	);
};

export default DexModule;
