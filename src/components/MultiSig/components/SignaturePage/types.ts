import {Account, DeliverTxResponse} from '@cosmjs/stargate';
import { RecipientAmount } from '../RecipientsPage/types';

export type SignaturePageProps = {multiSigAccount: Account, finalizedRecipients: RecipientAmount[], handleBack: () => void, previousSignatures: string[], setBroadcastResponse: (broadcastResponse: DeliverTxResponse) => void, setPreviousSignatures: (previousSignatures: string[]) => void};