import { CodeExecuteProps } from './types';
import styles from './CodeExecute.module.sass';
import { androidstudio, anOldHope, CodeBlock, CopyBlock } from 'react-code-blocks';
import { AiFillPlayCircle } from '@react-icons/all-files/ai/AiFillPlayCircle';
import { AiFillCaretDown } from '@react-icons/all-files/ai/AiFillCaretDown';
import { AiFillCaretUp } from '@react-icons/all-files/ai/AiFillCaretUp';
import cn from 'classnames';
import React, { useState } from 'react';
import { CopyBlockProps } from 'react-code-blocks/src/components/CopyBlock';
import { toast } from 'react-toastify';

const CodeExecute = ({ title, text, onClickExecute, response, error }: CodeExecuteProps) => {
	const [isExpanded, setIsExpanded] = useState(false);

	const success = Boolean(response);

	const language = 'typescript';

	const copyCodeProps: CopyBlockProps= {
		text: text.trim(),
		language,
		showLineNumbers: false,
		startingLineNumber: 0,
		theme: anOldHope,
		codeBlock: false,
		copied: false,
		wrapLongLines: false,
		onCopy: () => toast.info('Copied to clipboard')
	};

	const renderExecute = () => {
		if(!onClickExecute) return null;

		const responseText = JSON.stringify(response, null, 2);
		const copyBlockResponseProps: CopyBlockProps= {
			text: responseText,
			language,
			showLineNumbers: false,
			startingLineNumber: 0,
			theme: anOldHope,
			codeBlock: true,
			copied: false,
			wrapLongLines: false,
			onCopy: () => toast.info('Copied to clipboard')
		};

		const renderExecuteResponse = () => {
			if(!response && !error) return null;

			return (
				<div className={styles.responseDetails} onClick={() => setIsExpanded(!isExpanded)}>
					{isExpanded ? <AiFillCaretUp/> : <AiFillCaretDown />}
					<span className={cn({ [styles.success]: success }, { [styles.failure]: !success && response !== undefined })}>{success ? "Success" : "Error"}</span>
				</div>
			)
		}
		return (
			<div className={styles.response}>
				<div className={styles.expand}>
					<AiFillPlayCircle className={styles.executeIcon} onClick={onClickExecute} />
					{renderExecuteResponse()}
				</div>
				{
					isExpanded && (
						<>
							{success && (
								<div className={cn(styles.codeWrapper, styles.responseCode)}>
									<CodeBlock {...copyBlockResponseProps}  />
								</div>
							)}
							{error && <div className={styles.codeWrapper}><CodeBlock text={JSON.stringify(error, null, 2)} language={language} showLineNumbers={false} startingLineNumber={0} theme={androidstudio}  /></div>}
						</>
					)
				}
			</div>
		)
	}

	return (
		<div className={styles.body}>
			<div className={styles.codeWrapper}>
				<CopyBlock {...copyCodeProps}/>
				<div className={styles.header}>
					<h3 className={styles.label}>{title}</h3>
				</div>
			</div>
			{renderExecute()}
		</div>
	)
};

export default CodeExecute;
