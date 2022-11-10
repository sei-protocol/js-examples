import './App.css';
import { RecoilRoot } from 'recoil';
import 'react-dropdown/style.css';
import 'react-toastify/dist/ReactToastify.css';
import SeiExample from './SeiExample';
import { ToastContainer } from 'react-toastify';

function App() {
	return (
		<RecoilRoot>
			<ToastContainer theme='dark' />
			<SeiExample />
		</RecoilRoot>
	);
}

export default App;
