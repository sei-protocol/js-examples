import { useEffect, useState } from 'react';
import { StdSignature } from '@cosmjs/amino';
import { AccountData, OfflineSigner } from '@cosmjs/proto-signing';
import { toast } from 'react-toastify';
import { useWallet } from '@sei-js/react';

export const SIGN_ARBITRARY_TEXT = 'Testing signArbitrary';

export const useWalletTests = () => {
	const { connectedWallet, chainId, accounts } = useWallet();

	const [signArbitraryResponse, setSignArbitraryResponse] = useState<StdSignature | false | undefined>();
	const [signArbitraryError, setSignArbitraryError] = useState<string | undefined>();

	const [getOfflineSignerResponse, setGetOfflineSignerResponse] = useState<OfflineSigner | undefined>();
	const [getOfflineSignerError, setGetOfflineSignerError] = useState<string | undefined>();

	const [getAccountsResponse, setGetAccountsResponse] = useState<readonly AccountData[] | undefined>();
	const [getAccountsError, setGetAccountsError] = useState<string | undefined>();

	const [getOfflineSignerAutoResponse, setGetOfflineSignerAutoResponse] = useState<OfflineSigner | undefined>();
	const [getOfflineSignerAutoError, setGetOfflineSignerAutoError] = useState<string | undefined>();

	useEffect(() => {
		if(!connectedWallet) {
			setSignArbitraryResponse(undefined);
			setSignArbitraryError(undefined);
			setGetOfflineSignerResponse(undefined);
			setGetOfflineSignerError(undefined);
			setGetAccountsResponse(undefined);
			setGetAccountsError(undefined);
			setGetOfflineSignerAutoResponse(undefined);
			setGetOfflineSignerAutoError(undefined);
		}
	}, [connectedWallet]);

	const testGetAccounts = async () => {

		try {
			setGetAccountsResponse(undefined);
			setGetAccountsError(undefined);

			const getOfflineSignerResponse = await connectedWallet?.getOfflineSigner(chainId);
			const accounts = await getOfflineSignerResponse?.getAccounts();
			setGetAccountsResponse(accounts);
		} catch (e: any) {
			setGetAccountsError(e.message);
		}
	};

	const testGetOfflineSigner = async () => {
		try {
			setGetOfflineSignerResponse(undefined);
			setGetOfflineSignerError(undefined);

			const getOfflineSignerResponse = await connectedWallet?.getOfflineSigner(chainId);
			setGetOfflineSignerResponse(getOfflineSignerResponse);
		} catch (e: any) {
			setGetOfflineSignerError(e.message);
		}
	};

	const testGetOfflineSignerAuto = async () => {
		if (!connectedWallet?.walletInfo.windowKey) return;

		try {
			setGetOfflineSignerAutoResponse(undefined);
			setGetOfflineSignerAutoError(undefined);

			const getOfflineSignerAutoResponse = await window[connectedWallet.walletInfo.windowKey].getOfflineSignerAuto(chainId);
			setGetOfflineSignerAutoResponse(getOfflineSignerAutoResponse);
		} catch (e: any) {
			setGetOfflineSignerAutoError(e.message);
		}
	};

	const testSignArbitrary = async () => {
		if (!connectedWallet?.signArbitrary) {
			toast.error('signArbitrary not supported');
		} else {
			setSignArbitraryResponse(undefined);
			setSignArbitraryError(undefined);
			try {
				const signArbitraryResponse = await connectedWallet.signArbitrary(chainId, accounts[0].address, SIGN_ARBITRARY_TEXT);
				setSignArbitraryResponse(signArbitraryResponse);
			} catch (e: any) {
				setSignArbitraryError(e.message);
				setSignArbitraryResponse(false);
			}
		}
	};

	return { signArbitraryResponse, signArbitraryError, getOfflineSignerResponse, getOfflineSignerError, getAccountsResponse, getAccountsError, getOfflineSignerAutoResponse, getOfflineSignerAutoError, testGetOfflineSigner, testGetAccounts, testSignArbitrary, testGetOfflineSignerAuto };
}
