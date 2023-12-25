import React, { useState } from 'react';
import './App.scss';
import MapComponent from './components/Map';
import DnD from './DnD';

function App() {
  const [lapInfo, setLapInfo] = useState<any>(null);

  
  return (
    <div>
      <DnD setLapInfo={setLapInfo} />
      <MapComponent lapInfo={lapInfo} />
    </div>
  );
}

export default App;
