import React from 'react';
import { useRecoilState } from 'recoil';
import Dropdown from 'react-dropdown';
import { useWallet } from '@sei-js/react';
import styles from './ChainInfo.module.sass';

import { customChainIdAtom, customRestUrlAtom, customRpcUrlAtom, selectedChainConfigAtom } from '../../recoil';
import './styles.css';
import { DEFAULT_CHAINS } from '../../config/chains';
import CodeExecute from '../CodeExecute/CodeExecute';

const ChainInfo = () => {
	const wallet = useWallet();
	const [chainConfiguration, setChainConfiguration] = useRecoilState(selectedChainConfigAtom);
	const [customChainId, setCustomChainId] = useRecoilState(customChainIdAtom);
	const [customRestUrl, setCustomRestUrl] = useRecoilState(customRestUrlAtom);
	const [customRpcUrl, setCustomRpcUrl] = useRecoilState(customRpcUrlAtom);

	const disabled = chainConfiguration !== 'custom';

	const { chainId, restUrl, rpcUrl } = wallet;

	const exampleCodeText = `
<SeiWalletProvider chainConfiguration={{ chainId: '${chainId}', rpcUrl: '${rpcUrl}', restUrl: '${restUrl}' }} wallets={['compass', 'fin', 'keplr']}>
	<YourApp />
</SeiWalletProvider>
`;

	return (
		<div className='card'>
			<div className={styles.header}>
				<p className={styles.pageTitle}>Chain configuration</p>
				<p className={styles.pageDescription}>Set up the connection used throughout this app</p>
			</div>
			<div className='infoHeader'>
				<h3 className='infoHeader--title'>Select a preset</h3>
				<Dropdown
					className='dropdown'
					options={DEFAULT_CHAINS}
					onChange={(dropdown) => setChainConfiguration(dropdown.value as any)}
					value={chainConfiguration}
					placeholder='Select an option'
				/>
			</div>

			<div className='labelInput'>
				<p className='label'>chain-id:</p>
				<input
					autoFocus={true}
					placeholder='Custom chain id...'
					className='input'
					disabled={disabled}
					value={disabled ? chainId : customChainId}
					onChange={(e) => setCustomChainId(e.target.value)}
				/>
			</div>
			<div className='labelInput'>
				<p className='label'>rest-url:</p>
				<input
					autoFocus={true}
					placeholder='Custom rest url...'
					className='input'
					disabled={disabled}
					value={disabled ? restUrl : customRestUrl}
					onChange={(e) => setCustomRestUrl(e.target.value)}
				/>
			</div>
			<div className='labelInput'>
				<p className='label'>rpc-url:</p>
				<input
					autoFocus={true}
					placeholder='Custom rpc url...'
					className='input'
					disabled={disabled}
					value={disabled ? rpcUrl : customRpcUrl}
					onChange={(e) => setCustomRpcUrl(e.target.value)}
				/>
			</div>
			<CodeExecute text={exampleCodeText} title={'REACT CONFIGURATION EXAMPLE'} />
		</div>
	);
};

export default ChainInfo;
