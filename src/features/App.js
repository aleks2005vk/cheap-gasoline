import { Routes, Route } from "react-router-dom";
import Public from "../features/public/Public";
import Login from "../features/auth/Login";
import Welcome from "../features/auth/Welcome";
import UserLoginForm from "../components/user/UserLoginForm";
import UserRegistrationForm from "../components/user/UserRegistrationForm";
import RequiredAuth from "../features/auth/requiredAuth";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Public />} />
      <Route path="/login" element={<Login />} />
      <Route element={<RequiredAuth />}>
        <Route path="/welcome" element={<Welcome />} />
      </Route>
      <Route path="/userloginform" element={<UserLoginForm />} />
      <Route path="/register" element={<UserRegistrationForm />} />
    </Routes>
  );
}

export default App;
