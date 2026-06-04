import { useState } from "react";
import LoginForm from "./LoginForm";
import SignupForm from "./SignupForm";
import ForgotPassword from "./ForgotPassword";

export default function Navbar() {
  const [modal, setModal] = useState(null);
  const onClose = () => {
    setModal(null);
  };
  return (
    <>
      <header className="fixed top-0 left-0 w-full z-50 bg-black/70 backdrop-blur-md border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <h1 className="font-bold text-3xl">
            AUTO<span className="text-blue-400">RENT</span>
          </h1>

          <nav className="hidden md:flex gap-10 text-zinc-200 text-sm">
            <a href="#">Cars</a>
            <a href="#">Motorcycles</a>
            <a href="#">Electric</a>
            <a href="#">Fleet</a>
          </nav>

          <div className="flex items-center gap-4">
            <button
              className="text-zinc-200 hover:text-white"
              onClick={() => {
                setModal("Login");
              }}
            >
              Login
            </button>

            <button
              className="bg-blue-500 hover:bg-blue-600 px-5 py-2 rounded-md font-medium"
              onClick={() => {
                setModal("SignUp");
              }}
            >
              Sign Up
            </button>
          </div>
        </div>
      </header>
      {modal === "Login" && (
        <LoginForm
          onClose={onClose}
          onSignUp={() => {
            onClose();
            setModal("SignUp");
          }}
          forgot={() => {
            setModal("Forgot");
          }}
        />
      )}
      {modal === "SignUp" && (
        <SignupForm
          onClose={onClose}
          onLogin={() => {
            onClose();
            setModal("Login");
          }}
        />
      )}
      {modal === "Forgot" && <ForgotPassword onClose={onClose} />}
    </>
  );
}
