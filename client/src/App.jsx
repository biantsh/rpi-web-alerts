import { Routes, Route } from 'react-router-dom';
import AlertPage from './components/AlertPage';
import DevicePage from './components/DevicePage';
import LoginPage from './components/LoginPage';

const App = () => {
  return (
    <div>
      <Routes>
        <Route path='/' element={<LoginPage />} />
        <Route path='/sn/:serialNumber' element={<AlertPage />} />
        <Route path='/device/:serialNumber' element={<DevicePage />} ></Route>
      </Routes>
    </div>
  );
}

export default App;
