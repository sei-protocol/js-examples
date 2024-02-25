import React from 'react';
import { TableWithDeleteProps } from './types';
import styles from '../../MultiSig.module.sass';
import tableStyles from './TableWithDelete.module.sass';

const TableWithDelete = ({ items, setItems }: TableWithDeleteProps) => {
	function renderRecipientTable() {
		const deleteRow = (id: number) => {
			setItems(items.splice(id, 1));
		};

		const renderTableContent = () => {
			if (items.length === 0) return <p className={styles.card}>No accounts added yet...</p>;

			return (
				<table>
					<thead className={tableStyles.thead}>
						<tr key={'head'} className={tableStyles.tr}>
							{Object.entries(items[0]).map((pair, index) => {
								return <th key={pair[0]}>{pair[0].toUpperCase()}</th>;
							})}
						</tr>
					</thead>
					<tbody className={tableStyles.tbody}>
						{items.map((item, index) => {
							return (
								<tr key={index} className={tableStyles.tr}>
									{Object.values(item).map((value, _) => {
										return <td>{value.toString()}</td>;
									})}
									<td className={tableStyles.td}>
										<button className={tableStyles.deleteButton} onClick={() => deleteRow(index)}>
											x
										</button>
									</td>
								</tr>
							);
						})}
					</tbody>
				</table>
			);
		};

		return <div className={styles.recipientList}>{renderTableContent()}</div>;
	}

	return renderRecipientTable();
};

export default TableWithDelete;
