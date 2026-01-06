import { Aquarium } from './Aquarium';

function App() {
  const params = new URLSearchParams(window.location.search);
  
  const width = parseInt(params.get('width') || '800', 10);
  const height = parseInt(params.get('height') || '450', 10);
  // お魚の数を取得（指定がなければ 12 匹）
  const count = parseInt(params.get('count') || '12', 10);

  return (
    <div style={{ 
      width: '100vw', 
      height: '100vh', 
      backgroundColor: '#111', 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center',
      margin: 0,
      overflow: 'hidden' 
    }}>
      {/* count も渡すように変更 */}
      <Aquarium width={width} height={height} count={count} />
    </div>
  );
}

export default App;
