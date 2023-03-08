import './App.css';
import { RecoilRoot } from 'recoil';
import { ToastContainer } from 'react-toastify';
import 'react-dropdown/style.css';
import 'react-toastify/dist/ReactToastify.css';

import SeiExample from './SeiExample';

function App() {
	return (
		<RecoilRoot>
			<ToastContainer theme='dark' />
			<SeiExample />
		</RecoilRoot>
	);
}

export default App;
