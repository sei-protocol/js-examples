import React from 'react';
import './styles.css';
import { useRecoilState, useSetRecoilState } from 'recoil';
import Dropdown from 'react-dropdown';
import { selectedChainConfigAtom, customChainIdAtom, customRestUrlAtom, customRpcUrlAtom } from '../../recoil/atoms/chainInfo';
import { inputWalletAtom } from '../../recoil/atoms/wallet';
import { IoCheckmarkCircleSharp } from 'react-icons/io5';
import { ChainInfoProps } from './types';

const ChainInfo = ({ seiWallet }: ChainInfoProps) => {
	const [chainConfiguration, setChainConfiguration] = useRecoilState(selectedChainConfigAtom);
	const [customChainId, setCustomChainId] = useRecoilState(customChainIdAtom);
	const [customRestUrl, setCustomRestUrl] = useRecoilState(customRestUrlAtom);
	const [customRpcUrl, setCustomRpcUrl] = useRecoilState(customRpcUrlAtom);

	const setInputWallet = useSetRecoilState(inputWalletAtom);

	const disabled = chainConfiguration !== 'custom';

	const { chainId, restUrl, rpcUrl, installedWallets, supportedWallets, connectedWallet } = seiWallet;

	const renderSupportedWallet = (wallet) => {
		const isWalletInstalled = installedWallets.includes(wallet);
		const isWalletConnected = connectedWallet === wallet;

		const onClickWallet = () => {
			if (isWalletInstalled) setInputWallet(wallet);
			else {
				switch (wallet) {
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
				if (isWalletConnected) return `connected to ${wallet}`;
				return `connect to ${wallet}`;
			}

			return `install ${wallet}`;
		};

		return (
			<div className='walletButton' onClick={onClickWallet} key={wallet}>
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
