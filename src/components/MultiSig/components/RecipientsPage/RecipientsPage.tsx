import React, { useState } from 'react';
import { AddRecipientPageProps, RecipientAmount } from './types';
import styles from '../../MultiSig.module.sass';
import { isValidSeiAddress } from '@sei-js/core';
import { toast } from 'react-toastify';
import TableWithDelete from '../Utils/TableWithDelete';
import { BiSpreadsheet } from '@react-icons/all-files/bi/BiSpreadsheet';
import CSVUpload from './CSVUpload';
import Drawer from 'react-modern-drawer'
import cn from 'classnames';

const RecipientsPage = ({multiSigAccount, handleBack, setFinalizedRecipients, setParsedRecipients, parsedRecipients, setTxMemo, txMemo}: AddRecipientPageProps) => {
    const [isPaneOpen, setIsPaneOpen] = useState<boolean>(false);
	const [recipientAddress, setRecipientAddress] = useState<string>('');
	const [recipientAmount, setRecipientAmount] = useState<number>(0);
    const [recipientDenom, setRecipientDenom] = useState<string>('usei');
    
    const renderRecipientsPage = () => {
        const renderRecipientList = () => {
            if (parsedRecipients.length === 0) return null;

            return (
                <TableWithDelete
                    items={parsedRecipients}
                    setItems={setParsedRecipients}>
                </TableWithDelete>
            );
        };

        const renderRecipientContent = () => {
            if (parsedRecipients.length !== 0) return null;

            return (
                <>
                    <div className={styles.cardTip}>
                        <BiSpreadsheet className={styles.tipBulb} />
                        <div>
                        <p>Upload a CSV file with two columns "Recipient" and "Amount" for all the addresses you would like to send funds to</p>
                        <br/>
                        <p>OR</p>
                        <br/>
                        <p>Use the Add recipient button below to add recipients manually.</p>
                        <p>Amounts MUST be in usei.</p>
                        </div>
                    </div>
                    <CSVUpload onParseData={setParsedRecipients} />
                </>
            );
        };

        const renderAddReceipientForm = () => {
            const handleSubmitRecipient = () => {
                let finalAmount = recipientAmount;
                let finalDenom = recipientDenom;
                if(recipientDenom.toLowerCase() === 'sei') {
                    finalDenom = 'usei'
                    finalAmount = recipientAmount * 1000000;
                }
                setParsedRecipients(
                    [...parsedRecipients, {recipient: recipientAddress, amount: finalAmount, denom: finalDenom}]
                )
                setIsPaneOpen(false);
                setRecipientAddress('');
                setRecipientAmount(0);
                setRecipientDenom("usei");
            };

            return (
                <>
                    <Drawer
                        className={styles.card}
                        style={{background: '#2a2a2a'}}
                        open={isPaneOpen}
                        onClose={() => setIsPaneOpen((prevState) => !prevState)}
                        direction="right"
                        size="500px"
                    >
                        <h2>Add Recipient</h2>
                        <div className={styles.slidePaneContent}>
                            <div className={styles.inputWithError}>
                                <label htmlFor="recipient">Recipient Address:</label>
                                <input
                                    type="text"
                                    placeholder='Recipient address'
                                    className={styles.input}
                                    value={recipientAddress}
                                    onChange={(e) => setRecipientAddress(e.target.value)}
                                />
                                {
                                    !isValidSeiAddress(recipientAddress) && <div className={styles.inputErrorText}>Please enter a valid sei address</div>
                                }
                            </div>
                            <div className={styles.inputWithError}>
                                <label htmlFor="amount">Amount:</label>
                                <input
                                    type="number"
                                    placeholder='amount'
                                    className={styles.input}
                                    value={recipientAmount}
                                    onChange={(e) => setRecipientAmount(e.target.valueAsNumber)}
                                />
                                {
                                    (isNaN(recipientAmount) || recipientAmount <= 0) && <div className={styles.inputErrorText}>Please enter an amount greater than 0</div>
                                }
                            </div>
                            <div className={styles.inputWithError}>
                                <label htmlFor="denom">Denom:</label>
                                <input
                                    type="text"
                                    placeholder='denom'
                                    className={styles.input}
                                    value={recipientDenom}
                                    onChange={(e) => setRecipientDenom(e.target.value)}
                                />
                            </div>
                            <button
                                className={styles.button}
                                disabled={!isValidSeiAddress(recipientAddress) || recipientAmount <= 0 || !recipientDenom }
                                type="button"
                                onClick={handleSubmitRecipient}>
                                Add Recipient
                            </button>
                        </div>
                    </Drawer>
                </>
            )
        }
        const copyAddress = () => {
            navigator.clipboard.writeText(multiSigAccount.address);
            toast.info('Address copied to clipboard');
        };

        return (
            <div>
                <div className={styles.card}>
                    <p className={styles.cardHeader}>Step 3: {parsedRecipients.length === 0 ? 'Select' : 'Confirm'} Recipients</p>
                    {renderRecipientContent()}
                    {renderRecipientList()}
                    {renderAddReceipientForm()}
                    <button
                        className={cn(styles.button)}
                        onClick={() => setIsPaneOpen(true)}>
                        Add recipient
                    </button>
                    <p>{"Add transaction memo (optional)"}</p>
                    <input
                        type="text"
                        placeholder='Memo (Optional)'
                        className={styles.input}
                        value={txMemo}
                        onChange={(e) => setTxMemo(e.target.value)}
                    />
                    <div className={styles.backAndNextSection}>
                        <button className={styles.button} onClick={handleBack}>Back</button>
                        <button 
                            disabled={parsedRecipients?.length === 0}
                            className={cn(styles.button, { [styles.buttonReady]: parsedRecipients?.length !== 0 })}
                            onClick={() => setFinalizedRecipients(parsedRecipients)}>Next</button>
                    </div>
                </div>
            </div>
            
        );
    };

    return renderRecipientsPage();
}

export default RecipientsPage