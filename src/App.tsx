import { useEffect, useState } from 'react';
import { Aquarium } from './Aquarium';

function App() {
  const [dimensions, setDimensions] = useState({ width: 800, height: 400 });

  useEffect(() => {
    // URLのパラメータを取得 (?width=1200&height=300)
    const params = new URLSearchParams(window.location.search);
    const w = parseInt(params.get('width') || '800');
    const h = parseInt(params.get('height') || '400');
    setDimensions({ width: w, height: h });
  }, []);

  return (
    <div style={{ backgroundColor: '#222', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <Aquarium width={dimensions.width} height={dimensions.height} />
    </div>
  );
}

export default App;
