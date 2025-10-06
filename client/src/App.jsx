import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Container } from '@mui/material';
import TopPage from './pages/TopPage';
import LocationPage from './pages/LocationPage';
import MasterEditPage from './pages/MasterEditPage';

function App() {
  return (
    <Router>
      <AppBar position="fixed">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            資材棚卸システム
          </Typography>
        </Toolbar>
      </AppBar>
      <Container component="main" maxWidth="lg" sx={{ mt: 10, mb: 4 }}>
        <Routes>
          <Route path="/" element={<TopPage />} />
          <Route path="/locations" element={<LocationPage />} />
          <Route path="/master" element={<MasterEditPage />} />
        </Routes>
      </Container>
    </Router>
  );
}

export default App;
