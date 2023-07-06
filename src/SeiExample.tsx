import { SeiWalletProvider } from '@sei-js/react';
import { useRecoilValue } from 'recoil';

import { ChainInfo, AccountInfo, SendTokens, DexModule, WasmModule } from './components';
import { selectedChainConfigSelector } from './recoil';
import './common.css';

const SeiExample = () => {
	const selectedChainConfigUrls = useRecoilValue(selectedChainConfigSelector);

	return (
		<SeiWalletProvider chainConfiguration={selectedChainConfigUrls} wallets={['compass', 'fin', 'keplr' ] }>
			<div className='app'>
				<div className='appHeader'>
					<h2>@sei-js playground</h2>
				</div>
				<div className='appContent'>
					<ChainInfo />
					<AccountInfo />
					<WasmModule />
					<DexModule />
				</div>
				<SendTokens />
			</div>
		</SeiWalletProvider>
	);
};

export default SeiExample;
