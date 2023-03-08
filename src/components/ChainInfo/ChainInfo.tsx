import React from 'react';
import { useRecoilState } from 'recoil';
import Dropdown from 'react-dropdown';
import { IoCheckmarkCircleSharp } from 'react-icons/io5';
import { WalletWindowKey } from '@sei-js/core';
import { useWallet } from '@sei-js/react';

import { selectedChainConfigAtom, customChainIdAtom, customRestUrlAtom, customRpcUrlAtom } from '../../recoil';
import './styles.css';

const ChainInfo = () => {
	const wallet = useWallet();
	const [chainConfiguration, setChainConfiguration] = useRecoilState(selectedChainConfigAtom);
	const [customChainId, setCustomChainId] = useRecoilState(customChainIdAtom);
	const [customRestUrl, setCustomRestUrl] = useRecoilState(customRestUrlAtom);
	const [customRpcUrl, setCustomRpcUrl] = useRecoilState(customRpcUrlAtom);

	const disabled = chainConfiguration !== 'custom';

	const { chainId, restUrl, rpcUrl, installedWallets, supportedWallets, connectedWallet, setInputWallet } = wallet;

	const renderSupportedWallet = (walletKey: WalletWindowKey) => {
		const isWalletInstalled = installedWallets.includes(walletKey);
		const isWalletConnected = connectedWallet === walletKey;

		const onClickWallet = () => {
			if (isWalletInstalled && setInputWallet) {
				setInputWallet(walletKey);
			} else {
				switch (walletKey) {
					case 'keplr':
						window.open('https://www.keplr.app/download', '_blank');
						return;
					case 'leap':
						window.open('https://www.leapwallet.io/', '_blank');
						return;
				}
			}
		};

		const getButtonText = () => {
			if (isWalletInstalled) {
				if (isWalletConnected) return `connected to ${walletKey}`;
				return `connect to ${walletKey}`;
			}

			return `install ${walletKey}`;
		};

		return (
			<div className='walletButton' onClick={onClickWallet} key={walletKey}>
				{isWalletConnected && <IoCheckmarkCircleSharp className='connectedIcon' />}
				{getButtonText()}
			</div>
		);
	};

	return (
		<div className='card'>
			<h3 className='sectionHeader'>Chain info</h3>
			<div className='infoHeader'>
				<Dropdown
					className='dropdown'
					options={['testnet', 'devnet', 'custom']}
					onChange={(dropdown) => setChainConfiguration(dropdown.value as any)}
					value={chainConfiguration}
					placeholder='Select an option'
				/>
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
			<div className='connect'>{supportedWallets.map(renderSupportedWallet)}</div>
		</div>
	);
};

export default ChainInfo;
