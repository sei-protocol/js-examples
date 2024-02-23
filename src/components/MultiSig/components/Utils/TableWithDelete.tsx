import React, { useMemo, useState } from 'react';
import { TableWithDeleteProps } from './types';
import styles from '../../MultiSig.module.sass';
import tableStyles from './TableWithDelete.module.sass';

const TableWithDelete = ({ items, setItems }: TableWithDeleteProps) => {
	function renderRecipientTable() {
		const deleteRow = (id) => {
			setItems(items.toSpliced(id, 1));
		};

		return (
			<div className={styles.recipientList}>
				{items.length === 0 ? (
					<p className={styles.emptySet}>No accounts added yet...</p>
				) : (
					<table>
						<thead className={tableStyles.thead}>
							<tr key={'head'} className={tableStyles.tr}>
								{Object.entries(items[0]).map((pair, index) => {
									return <th key={index}>{pair[0].toUpperCase()}</th>;
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
				)}
			</div>
		);
	}

	return renderRecipientTable();
};

export default TableWithDelete;
