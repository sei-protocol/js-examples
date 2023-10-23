import React, { useState } from 'react';
import './styles.css';
import { useSigningCosmWasmClient, useWallet } from '@sei-js/react';
import { calculateFee } from '@cosmjs/stargate';
import ReactJson from 'react-json-view';

type OptionType = "query" | "execute";

const WasmModule = () => {
	const { accounts } = useWallet();

	const [response, setResponse] = useState<object>();
	const [memo, setMemo] = useState('');
	const [funds, setFunds] = useState('');
	const [contractAddress, setContractAddress] = useState('');
	const [gasPrice, setGasPrice] = useState('4usei');
	const [gasLimit, setGasLimit] = useState('100000');
	const [contractMessage, setContractMessage] = useState('');
	const [selectedOption, setSelectedOption] = useState<OptionType>("query");

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => setSelectedOption(e.target.value as OptionType);

	const { signingCosmWasmClient } = useSigningCosmWasmClient();

	const sendContractCall = async () => {
		if (!signingCosmWasmClient) return;
		try {
			if(selectedOption === "query") {
				const result = await signingCosmWasmClient.queryContractSmart(contractAddress, JSON.parse(contractMessage));
				setResponse(result);
			} else {
				const fee = calculateFee(Number(gasLimit), gasPrice);
				const result = await signingCosmWasmClient.execute(accounts[0].address, contractAddress,  JSON.parse(contractMessage), fee, memo, JSON.parse(funds));
				setResponse(result);
			}
		} catch (e: any) {
			setResponse({ error: e.message });
		}
	}

	const getMessagePlaceholder = () => {
		if(selectedOption === "query") {
			return '{"get_admins": {}}'
		} else {
			return '{"mint": {}}'
		}
	}

	return <div className='card'>
		<h3 className='sectionHeader'>Wasm module</h3>

		<div className='cardContent'>
			<div className='radioGroup'>
				<label className='radioLabel'>
					<input
						type="radio"
						value="query"
						className='radioItem'
						checked={selectedOption === "query"}
						onChange={handleChange}
					/>
					Query
				</label>
				<label className='radioLabel'>
					<input
						type="radio"
						value="execute"
						className='radioItem'
						checked={selectedOption === "execute"}
						onChange={handleChange}
					/>
					Execute
				</label>
			</div>
			<div className='labelInput'>
				<p className='label'>contract address:</p>
				<input
					autoFocus={true}
					placeholder='Contract address...'
					className='input'
					value={contractAddress}
					onChange={(e) => setContractAddress(e.target.value)}
				/>
			</div>
			<div className='labelInput'>
				<p className='label'>contract message:</p>
				<input
					autoFocus={true}
					placeholder={getMessagePlaceholder()}
					className='input'
					value={contractMessage}
					onChange={(e) => setContractMessage(e.target.value)}
				/>
			</div>
			{selectedOption === "execute" && (
				<div className='labelInput'>
					<p className='label'>gas price:</p>
					<input
						autoFocus={true}
						placeholder="Gas price..."
						className='input'
						value={gasPrice}
						onChange={(e) => setGasPrice(e.target.value)}
					/>
				</div>
			)}
			{selectedOption === "execute" && (
				<div className='labelInput'>
					<p className='label'>gas limit:</p>
					<input
						autoFocus={true}
						placeholder="Gas limit..."
						className='input'
						value={gasLimit}
						onChange={(e) => setGasLimit(e.target.value)}
					/>
				</div>
			)}
			{selectedOption === "execute" && (
				<div className='labelInput'>
					<p className='label'>memo:</p>
					<input
						autoFocus={true}
						placeholder="Memo..."
						className='input'
						value={memo}
						onChange={(e) => setMemo(e.target.value)}
					/>
				</div>
			)}
			{selectedOption === "execute" && (
				<div className='labelInput'>
					<p className='label'>funds:</p>
					<input
						autoFocus={true}
						placeholder={'[{"denom": "usei", "amount": "100"}]'}
						className='input'
						value={funds}
						onChange={(e) => setFunds(e.target.value)}
					/>
				</div>
			)}
			<button className='walletButton' onClick={sendContractCall}>{selectedOption}</button>
			<div className='marketSummary--item'>
				{response && <ReactJson theme="monokai" src={response} />}
			</div>
		</div>
	</div>
};

export default WasmModule;
