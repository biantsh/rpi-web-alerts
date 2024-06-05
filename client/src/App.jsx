import { Routes, Route } from 'react-router-dom';
import AlertPage from './components/AlertPage';
import LoginPage from './components/LoginPage';

const App = () => {
  return (
    <div>
      <Routes>
        <Route path='/' element={<LoginPage />} />
        <Route path='/sn/:serialNumber' element={<AlertPage />} />
      </Routes>
    </div>
  );
}

export default App;
