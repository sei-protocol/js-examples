import React, { useMemo } from 'react';
import './common.css';
import { useWallet } from '@sei-js/react';
import { useRecoilValue } from 'recoil';
import { ChainInfo, AccountInfo, SendTokens } from './components';
import { selectedChainConfigAtom, customChainIdAtom, customRestUrlAtom, customRpcUrlAtom, inputWalletAtom } from './recoil';

const SeiExample = () => {
	const inputWallet = useRecoilValue(inputWalletAtom);

	const selectedChainConfig = useRecoilValue(selectedChainConfigAtom);
	const customChainId = useRecoilValue(customChainIdAtom);
	const customRestUrl = useRecoilValue(customRestUrlAtom);
	const customRpcUrl = useRecoilValue(customRpcUrlAtom);

	const useWalletChainConfiguration = useMemo(() => {
		if (selectedChainConfig !== 'custom') return selectedChainConfig;
		return {
			chainId: customChainId,
			restUrl: customRestUrl,
			rpcUrl: customRpcUrl
		};
	}, [selectedChainConfig, customChainId, customRestUrl, customRpcUrl]);

	const seiWallet = useWallet(window, {
		inputWallet,
		autoConnect: inputWallet !== undefined,
		chainConfiguration: useWalletChainConfiguration
	});

	return (
		<div className='app'>
			<div className='appHeader'>
				<h2>@sei-js/react examples</h2>
			</div>
			<div className='appContent'>
				<ChainInfo seiWallet={seiWallet} />
				<AccountInfo seiWallet={seiWallet} />
			</div>
			<SendTokens seiWallet={seiWallet} />
		</div>
	);
};

export default SeiExample;
