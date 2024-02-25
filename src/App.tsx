import './App.css';
import { RecoilRoot } from 'recoil';
import { toast, ToastContainer } from 'react-toastify';
import 'react-dropdown/style.css';
import 'react-toastify/dist/ReactToastify.css';
import SeiExample from './SeiExample';

function App() {
	return (
		<RecoilRoot>
			<ToastContainer position={toast.POSITION.BOTTOM_RIGHT} />
			<SeiExample />
		</RecoilRoot>
	);
}

export default App;
