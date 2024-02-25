import { Account, DeliverTxResponse } from '@cosmjs/stargate';
import { RecipientAmount } from '../RecipientsPage/types';

export type SignaturePageProps = {
	setBroadcastResponse: (broadcastResponse: DeliverTxResponse) => void;
};
