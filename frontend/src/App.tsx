import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import DocumentList from './components/DocumentList';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<DocumentList />} />
      </Routes>
    </Router>
  );
}

export default App;
