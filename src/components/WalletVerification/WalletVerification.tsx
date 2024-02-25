import React from 'react';
import { WalletInfoProps } from './types';
import styles from './WalletVerificaton.module.sass';
import { useWallet, WalletConnectButton } from '@sei-js/react';
import CodeExecute from '../CodeExecute/CodeExecute';
import { SIGN_ARBITRARY_TEXT, useWalletTests } from './hooks';
import { WalletReleaseTest } from './WalletReleaseTest';

const WalletVerification = ({}: WalletInfoProps) => {
	const { connectedWallet, chainId, accounts } = useWallet();
	const {
		signArbitraryResponse,
		signArbitraryError,
		getOfflineSignerResponse,
		getOfflineSignerError,
		getAccountsResponse,
		getAccountsError,
		getOfflineSignerAutoResponse,
		getOfflineSignerAutoError,
		testGetOfflineSigner,
		testGetAccounts,
		testSignArbitrary,
		testGetOfflineSignerAuto
	} = useWalletTests();

	const renderSignArbitrary = () => {
		return (
			<CodeExecute
				title='Sign Arbitrary'
				text={`await connectedWallet.signArbitrary('${chainId}', '${accounts[0].address}', '${SIGN_ARBITRARY_TEXT}');`}
				response={signArbitraryResponse}
				error={signArbitraryError}
				onClickExecute={testSignArbitrary}
			/>
		);
	};

	const renderGetAccounts = () => {
		return (
			<CodeExecute
				title='GET ACCOUNTS'
				text={`const offlineSigner = await connectedWallet.getOfflineSigner('${chainId}');\nofflineSigner.getAccounts()`}
				response={getAccountsResponse}
				error={getAccountsError}
				onClickExecute={testGetAccounts}
			/>
		);
	};

	const renderGetOfflineSigner = () => {
		return (
			<CodeExecute
				title='GET OFFLINE SIGNER'
				text={`await connectedWallet.getOfflineSigner('${chainId}');`}
				response={getOfflineSignerResponse}
				error={getOfflineSignerError}
				onClickExecute={testGetOfflineSigner}
			/>
		);
	};

	const renderGetOfflineSignerAuto = () => {
		return (
			<CodeExecute
				title='GET OFFLINE SIGNER AUTO'
				text={`await connectedWallet.getOfflineSignerAuto('${chainId}');`}
				response={getOfflineSignerAutoResponse}
				error={getOfflineSignerAutoError}
				onClickExecute={testGetOfflineSignerAuto}
			/>
		);
	};

	const renderContent = () => {
		if (!connectedWallet) return <WalletConnectButton buttonClassName={styles.connectButton} />;

		return (
			<div className={styles.tests}>
				{renderSignArbitrary()}
				{renderGetOfflineSigner()}
				{renderGetOfflineSignerAuto()}
				{renderGetAccounts()}
			</div>
		);
	};

	return (
		<div className='card'>
			<div className={styles.header}>
				<p className={styles.pageTitle}>Wallet connection</p>
				<p className={styles.pageDescription}>Verify your wallet connection is configured properly</p>
			</div>
			<div className='cardContent'>
				<WalletReleaseTest />
				{renderContent()}
			</div>
		</div>
	);
};

export default WalletVerification;
