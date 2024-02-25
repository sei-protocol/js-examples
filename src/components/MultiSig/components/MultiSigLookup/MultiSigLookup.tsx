import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { Account, StargateClient } from '@cosmjs/stargate';
import { isValidSeiAddress } from '@sei-js/core';
import { HiLightBulb } from '@react-icons/all-files/hi/HiLightBulb';
import { useWallet } from '@sei-js/react';
import { createMultisigThresholdPubkey, isMultisigThresholdPubkey, pubkeyToAddress, Secp256k1Pubkey } from '@cosmjs/amino';

import TableWithDelete from '../Utils/TableWithDelete';
import { InputType, LookupType } from './config';
import { MultiSigLookupProps } from './types';
import styles from '../../MultiSig.module.sass';
import multiSigLookupStyles from './MultiiSigLookup.module.sass';
import { useRecoilState } from 'recoil';
import {
	multiSigAccountAddressAtom,
	multiSigAccountAtom,
	multiSigInputTypeAtom,
	multiSigLookupTypeAtom,
	multiSigManualAccountsAtom,
	multiSigThresholdAtom
} from '../../../../recoil';

const MultiSigLookup = ({}: MultiSigLookupProps) => {
	const [multiSigAccountAddress, setMultiSigAccountAddress] = useRecoilState(multiSigAccountAddressAtom);
	const [multiSigAccount, setMultiSigAccount] = useRecoilState(multiSigAccountAtom);
	const [multiSigThreshold, setMultiSigThreshold] = useRecoilState(multiSigThresholdAtom);
	const [multiSigManualAccounts, setMultiSigManualAccounts] = useRecoilState(multiSigManualAccountsAtom);
	const [lookupType, setLookupType] = useRecoilState(multiSigLookupTypeAtom);
	const [inputType, setInputType] = useRecoilState(multiSigInputTypeAtom);

	const [isQueryingMultiSigAccount, setIsQueryingMultiSigAccount] = useState<boolean>(false);
	const [newMultiSigAccountInput, setNewMultiSigAccountInput] = useState<string>('');

	const { chainId, rpcUrl } = useWallet();

	const queryMultiSigAccount = async () => {
		if (isQueryingMultiSigAccount) return;

		setIsQueryingMultiSigAccount(true);

		const broadcaster = await StargateClient.connect(rpcUrl);
		const account = await broadcaster.getAccount(multiSigAccountAddress);
		if (!account || !account.pubkey || !isMultisigThresholdPubkey(account.pubkey)) {
			toast.info(
				`The account address you entered is not a multi-sig account that exists on ${chainId}. Please create a new multi-sig account by entering all the signer addresses and threshold desired.`
			);
			setIsQueryingMultiSigAccount(false);
			setLookupType(LookupType.Create);
			return;
		}

		setMultiSigAccount(account);
		setIsQueryingMultiSigAccount(false);
	};

	const createMultiSigAccount = async () => {
		const pubKeys = multiSigManualAccounts.map((manualAccount) => {
			return {
				type: 'tendermint/PubKeySecp256k1',
				value: manualAccount.pubkey as unknown as string
			};
		});
		const multisigPubkey = createMultisigThresholdPubkey(pubKeys, multiSigThreshold);
		const multisigAddress = pubkeyToAddress(multisigPubkey, 'sei');
		const account = {
			address: multisigAddress,
			pubkey: multisigPubkey,
			// Account number must be overridden by making querying account on Node once funded.
			accountNumber: -1,
			sequence: 0
		};

		setMultiSigAccount(account);
	};

	const renderMultiSigLookup = () => {
		return (
			<div className={styles.card}>
				<p className={styles.cardHeader}>Step 1: Lookup multi-sig account by address</p>
				<div className={styles.cardTip}>
					<HiLightBulb className={styles.tipBulb} />
					<p className={styles.tipText}>Multi-sig must have signed and broadcast at least one transaction before this tool can be used.</p>
				</div>
				<input
					placeholder='Enter Multi-sig address...'
					className={styles.input}
					value={multiSigAccountAddress}
					onChange={(e) => setMultiSigAccountAddress(e.target.value)}
				/>
				<div className={styles.backAndNextSection}>
					<button className={styles.button} onClick={() => setLookupType(LookupType.Select)}>
						Back
					</button>
					<button className={styles.button} disabled={isQueryingMultiSigAccount || !isValidSeiAddress(multiSigAccountAddress)} onClick={queryMultiSigAccount}>
						Next
					</button>
				</div>
			</div>
		);
	};

	const renderMultiSigCreate = () => {
		const getPubkeyFromNode = async (address: string) => {
			const client = await StargateClient.connect(rpcUrl);

			try {
				const accountOnChain = await client.getAccount(address);

				if (!accountOnChain || !accountOnChain.pubkey) {
					toast.error('Account has no pubkey on chain, this address will need to send a transaction to appear on chain.');
					return;
				}

				return accountOnChain.pubkey.value;
			} catch (e) {
				toast.error('Failed to get account.' + e.toString());
				return;
			}
		};

		const handleChangeInput = () => {
			if (inputType == InputType.Address) {
				setInputType(InputType.Pubkey);
			} else {
				setInputType(InputType.Address);
			}
			setNewMultiSigAccountInput('');
		};

		const getInputPlaceholder = () => {
			if (inputType == InputType.Address) {
				return 'Add wallet address of signer';
			} else {
				return 'Add Public Key (Secp256k1) of signer';
			}
		};

		const getInputTypeChangeButtonText = () => {
			if (inputType == InputType.Address) {
				return 'Advanced: Use PubKey instead of address.';
			} else {
				return 'Basic: Use Address instead of PubKey';
			}
		};

		const handleAddAccount = async () => {
			// Input is address type
			let newAccount = { address: '', pubkey: '' };
			if (inputType == InputType.Address) {
				const pubKey = await getPubkeyFromNode(newMultiSigAccountInput);
				if (!pubKey) {
					return;
				}
				newAccount = { address: newMultiSigAccountInput, pubkey: pubKey };
			} else {
				newAccount.pubkey = newMultiSigAccountInput;
				const pubKey: Secp256k1Pubkey = {
					value: newMultiSigAccountInput,
					type: 'tendermint/PubKeySecp256k1'
				};
				newAccount.address = pubkeyToAddress(pubKey, 'sei');
			}
			setMultiSigManualAccounts([...multiSigManualAccounts, newAccount as unknown as Account]);

			setNewMultiSigAccountInput('');
		};

		const handleMultiSigAccountInput = (newInput: string) => {
			setNewMultiSigAccountInput(newInput);
			if (inputType == InputType.Address) {
				if (!isValidSeiAddress(newInput)) {
					toast.error('Please input a valid Sei address');
				}
			}
			if (inputType == InputType.Pubkey) {
				if (newInput.length != 44) {
					toast.error('Please input a valid Secp256k1 pubkey');
				}
			}
		};

		const renderThresholdSection = () => {
			if (multiSigManualAccounts.length < 2) {
				return (
					<div className={styles.card}>
						<p>At least 2 accounts are required to create a multi-sig account</p>
					</div>
				);
			}

			return (
				<div className={styles.card}>
					<p>Signatures required to send a transaction</p>
					<div className={multiSigLookupStyles.thresholdModule}>
						<input
							type='number'
							className={multiSigLookupStyles.thresholdInput}
							max={multiSigManualAccounts.length}
							value={multiSigThreshold}
							onChange={(e) => setMultiSigThreshold(e.target.valueAsNumber || undefined)}
						/>
						<p className={multiSigLookupStyles.thresholdText}>of</p>
						<p className={multiSigLookupStyles.thresholdInput}>{multiSigManualAccounts.length}</p>
					</div>
					<p>
						This means that each transaction this multisig makes will only require {multiSigThreshold || ''} of the {multiSigManualAccounts.length} members to sign
						it for it to be accepted by the validators.
					</p>
				</div>
			);
		};

		return (
			<div className={styles.card}>
				<p className={styles.cardHeader}>Step 1: Create multi-sig account</p>
				{renderThresholdSection()}
				<TableWithDelete items={multiSigManualAccounts} setItems={setMultiSigManualAccounts} />
				<div className={styles.card}>
					<p className={multiSigLookupStyles.cardHeader}>Add a signer</p>
					<div className={styles.inputWithError}>
						<input
							placeholder={getInputPlaceholder()}
							className={styles.input}
							value={newMultiSigAccountInput}
							onChange={(e) => handleMultiSigAccountInput(e.target.value)}
						/>
						<button disabled={!isValidSeiAddress(newMultiSigAccountInput)} className={styles.button} onClick={handleAddAccount}>
							Add Account
						</button>
						<p className='cursor-pointer hover:underline' onClick={handleChangeInput}>
							{getInputTypeChangeButtonText()}
						</p>
					</div>
				</div>
				<div className={styles.backAndNextSection}>
					<button className={styles.button} onClick={() => setLookupType(LookupType.Select)}>
						Back
					</button>
					<button className={styles.button} disabled={multiSigManualAccounts.length < 2 || multiSigThreshold < 1} onClick={createMultiSigAccount}>
						Next
					</button>
				</div>
			</div>
		);
	};

	const renderMultiSigSelectAccountComponent = () => {
		return (
			<div className={styles.card}>
				<p className={styles.cardHeader}>Step 1: Select multi-sig account</p>
				<div>
					<button className={styles.button} onClick={() => setLookupType(LookupType.Lookup)}>
						Lookup multi-sig account by address
					</button>
				</div>
				<div>
					<button className={styles.button} onClick={() => setLookupType(LookupType.Create)}>
						Create new multisig account
					</button>
				</div>
			</div>
		);
	};

	switch (lookupType) {
		case LookupType.Lookup:
			return renderMultiSigLookup();
		case LookupType.Create:
			return renderMultiSigCreate();
		case LookupType.Select:
		default:
			return renderMultiSigSelectAccountComponent();
	}
};

export default MultiSigLookup;
