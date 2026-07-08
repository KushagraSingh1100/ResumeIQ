import HomePage from "./components/HomePage";
import LoginPage from "./components/LoginPage";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import RegisterPage from "./components/RegisterPage";
import UploadResumePage from "./components/UploadResumePage";
import ProtectedRoute from "./utils/ProtectedRoute";

function App() {
  return (
    <Router>
      <Routes>
        <Route element={<RegisterPage />} path="/register" />
        <Route element={<LoginPage />} path="/login" />
        <Route element={<ProtectedRoute />}>
          <Route element={<HomePage />} path="/" />
          <Route element={<UploadResumePage />} path="/upload-resume" />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
