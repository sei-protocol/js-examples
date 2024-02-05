import React, { useMemo, useState } from 'react';
import {  FundAccountProps } from './types';
import styles from '../../MultiSig.module.sass';
import recipientPageStyles from './RecipientsPage.module.sass'
import { toast } from 'react-toastify';
import { FaCopy } from '@react-icons/all-files/fa/FaCopy';
import { HiLightBulb } from '@react-icons/all-files/hi/HiLightBulb';
import { useSigningClient, useWallet } from '@sei-js/react';
import { calculateFee, StargateClient } from '@cosmjs/stargate';
import Drawer from 'react-modern-drawer'
import { Coin } from '@sei-js/proto/dist/types/codegen/cosmos/base/v1beta1/coin';
import { pubkeyToAddress } from '@cosmjs/amino';
import { SeiToUsei } from '../Utils/utils';


const FundAccount = ({multiSigAccount, handleBack, setActivatedMultiSig}: FundAccountProps) => {
    const { connectedWallet, accounts, rpcUrl, chainId } = useWallet();
    const { signingClient } = useSigningClient();
    const [ isQuerying, setIsQuerying] = useState<boolean>(false);
    const [ isSending, setIsSending] = useState<boolean>(false);
    const [ sendAmount, setSendAmount] = useState<string>('');
    const [ sendDenom, setSendDenom] = useState<string>('usei');
    const [isPaneOpen, setIsPaneOpen] = useState<boolean>(false);
    const [holdings, setHoldings] = useState<readonly Coin[]>([]);
    const walletAccount = useMemo(() => accounts?.[0], [accounts]);

    const renderFundAccount = () => {

        const getHoldings = async () => {
            const client = await StargateClient.connect(rpcUrl);
            const tempHoldings = await client.getAllBalances(multiSigAccount.address);
            setHoldings(tempHoldings);
        }

        const copyString = (s: string) => {
            navigator.clipboard.writeText(s);
            toast.info('Copied to clipboard');
        };

        const sendFunds = async () => {
            if (!connectedWallet) {
                toast.info('Please connect your wallet first.');
                return;
            };

            if (!walletAccount || !signingClient || isSending) {
                return;
            }
            const fee = calculateFee(120000, '0.1usei');
            let finalAmount = sendAmount;
            let finalDenom = sendDenom;
            if (sendDenom.toLowerCase() == 'sei') {
                finalDenom = 'usei';
                finalAmount = SeiToUsei(Number(sendAmount)).toString();
            }
            const transferAmount = { amount: finalAmount, denom: finalDenom };
    
            try {
                setIsSending(true);
                const sendResponse = await signingClient.sendTokens(walletAccount.address, multiSigAccount.address, [transferAmount], fee);
                if (sendResponse.code === 0) {
                    toast.success('Successfully sent tokens!', { toastId: 'send-success' });
                } else {
                    toast.error(`Error sending Tokens ${sendResponse.rawLog}`);
                    setIsSending(false);
                    return false;
                }
                setIsSending(false);
                return true;
            } catch (e: any) {
                toast.error(e.message);
                setIsSending(false);
                return false;
            }
        };

        const isValidAmount = (): boolean => {
            return sendAmount != null && sendAmount !== '' && !isNaN(Number(sendAmount)) && Number(sendAmount) > 0
        }

        const handleConfirmAccount = async () => {
			if (isQuerying) return;
			setIsQuerying(true);
			const broadcaster = await StargateClient.connect(rpcUrl);

			const fullAccount = await broadcaster.getAccount(multiSigAccount.address);
			if (!fullAccount) {
				toast.info(`The account address you entered has not been activated on chain ${chainId}. Please send funds to this account first`);
				setIsQuerying(false);
				return;
			}
            setActivatedMultiSig({ address: fullAccount.address, pubkey: multiSigAccount.pubkey, accountNumber: fullAccount.accountNumber, sequence: fullAccount.sequence })
        }

        const renderFundAccountForm = () => {
            const handleSubmitFundAccountForm = async () => {
                let success = await sendFunds();
                if (success) {
                    setIsPaneOpen(false);
                    setSendDenom('usei');
                    setSendAmount('');
                }
            };

            return (
                <>
                    <Drawer
                        className={styles.card}
                        style={{background: '#2a2a2a'}}
                        open={isPaneOpen}
                        onClose={() => setIsPaneOpen((prevState) => !prevState)}
                        direction="left"
                        size="500px"
                    >
                        <h2>Send funds to Multisig Account</h2>
                        <div className={styles.slidePaneContent}>
                            <div>Recipient: {multiSigAccount.address}</div>
                            <div className={styles.inputWithError}>
                                <label htmlFor="Amount">Amount</label>
                                <input
                                    type="text"
                                    placeholder={'Amount to send in ' + sendDenom} 
                                    className={styles.input}
                                    value={sendAmount}
                                    onChange={(e) => setSendAmount(e.target.value)}
                                />
                            </div>
                            {
                                !isValidAmount() && <div className={styles.inputErrorText}>Please enter an amount greater than 0</div>
                            }
                            <div className={styles.inputWithError}>
                                <label htmlFor="denom">Denom:</label>
                                <input
                                    type="text"
                                    placeholder='Denom'
                                    className={styles.input}
                                    value={sendDenom}
                                    onChange={(e) => setSendDenom(e.target.value)}
                                />
                            </div>
                            <button
                                className={styles.button}
                                disabled={ !isValidAmount() || sendDenom == "" || !isSending }
                                type="button"
                                onClick={handleSubmitFundAccountForm}>
                                { isSending ? 'Sending...' : 'Send Funds' }
                            </button>
                        </div>
                    </Drawer>
                </>
            )
        }

        return (
            <div className={styles.card}>
                <div className={styles.cardHeader}>Step 2: Fund Multisig Account</div>
                <div className={styles.cardTip}>
                    <HiLightBulb className={styles.tipBulb} />
                    <div className={styles.tipContent}>
                        <p>If this is a newly created multisig, you need to activate it by transferring funds to it before it can be used in this tool.</p>
                        <p>If you leave this page before sending a transaction, you will need to re-create the account using the UI in step 1 by inputting the signer pubkeys and threshold value below.</p>
                    </div>
                </div>
                <div className={styles.multiSigAccountInfoCard}>
                    <div className={styles.textWithCopyButton}>
                        <p>MultiSig Address: {multiSigAccount.address}</p>
                        <button onClick={() => copyString(multiSigAccount.address)} className={styles.copyButton}>
                            <FaCopy /> Copy Address
                        </button>
                    </div>
                    { multiSigAccount.pubkey.value.pubkeys.map((pubkey, index) => {
                        return (
                            <div className={styles.textWithCopyButton}>
                                <p>Signer {index} Address: {pubkeyToAddress(pubkey, "sei")}</p>
                                <p>Pubkey:  {pubkey.value}</p>
                                <button onClick={() => copyString(pubkey.value)} className={styles.copyButton}>
                                    <FaCopy /> Copy Pubkey
                                </button>
                            </div>
                    )})}
                    <p>Threshold: {multiSigAccount.pubkey.value.threshold} of {multiSigAccount.pubkey.value.pubkeys.length} signatures required</p>
                    <div className={styles.multiSigAccountInfoCard}>
                        <div>Funds:</div>
                        {holdings.length ? holdings.map((coin, index) => {
                            return (
                                <p className={recipientPageStyles.fundText}>{coin.amount + " " + coin.denom}</p>
                            )
                        }) : "Refresh to show updated funds"}
                        <button className={recipientPageStyles.smallButton} onClick={() => getHoldings()}>Refresh</button>
                    </div>
                </div>
                <button className={styles.button} onClick={() => setIsPaneOpen(true)}>Fund account</button>
                {renderFundAccountForm()}
                <div className={styles.backAndNextSection}>
                        <button className={styles.button} onClick={handleBack}>Back</button>
                        <button className={styles.button} onClick={handleConfirmAccount}>Next</button>
                </div>
            </div>
        )
    }

    return renderFundAccount();;
}

export default FundAccount