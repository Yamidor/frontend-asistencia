import React, { useState, useEffect, useRef } from "react";
import Webcam from "react-webcam";
import axios from "axios";

const API_URL = "http://localhost:8000";

function App() {
  const [mode, setMode] = useState("recognize");
  const [message, setMessage] = useState("");
  const [recognizedUser, setRecognizedUser] = useState(null);
  const webcamRef = useRef(null);

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    role_id: "",
    grade_id: "",
  });

  const capture = async () => {
    const imageSrc = webcamRef.current?.getScreenshot();

    if (!imageSrc) {
      console.error(
        "No se pudo capturar la imagen. Asegúrate de que la cámara esté funcionando."
      );
      setMessage("Error al capturar la imagen. Verifica la cámara.");
      return;
    }

    try {
      const base64Data = imageSrc.split(",")[1];
      const blob = await fetch(`data:image/jpeg;base64,${base64Data}`).then(
        (res) => res.blob()
      );

      const formData = new FormData();
      formData.append("image", blob, "capture.jpg");

      const response = await axios.post(`${API_URL}/recognize/`, formData);
      const userData = response.data;

      if (userData.already_registered) {
        setMessage(
          `${userData.first_name} ${userData.last_name} ya registró asistencia hoy.`
        );
      } else {
        setMessage("¡Bienvenido! Asistencia registrada correctamente.");
      }
      setRecognizedUser(userData);
    } catch (error) {
      if (error.response && error.response.status === 404) {
        setMessage("Persona no reconocida");
      } else {
        setMessage("Error en el sistema");
      }
      setRecognizedUser(null);
      console.error("Error:", error);
    }
  };

  const registerUser = async (e) => {
    e.preventDefault();
    const imageSrc = webcamRef.current?.getScreenshot();

    if (!imageSrc) {
      console.error(
        "No se pudo capturar la imagen. Asegúrate de que la cámara esté funcionando."
      );
      setMessage("Error al capturar la imagen. Verifica la cámara.");
      return;
    }

    const base64Data = imageSrc.split(",")[1];
    const blob = await fetch(`data:image/jpeg;base64,${base64Data}`).then(
      (res) => res.blob()
    );

    const userData = new FormData();
    const userObject = {
      first_name: formData.first_name,
      last_name: formData.last_name,
      email: formData.email,
      role_id: parseInt(formData.role_id),
      grade_id: formData.grade_id ? parseInt(formData.grade_id) : null,
    };

    userData.append("user", JSON.stringify(userObject));
    userData.append("face_image", blob, "face.jpg");

    try {
      await axios.post(`${API_URL}/users/`, userData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      setMessage("Usuario registrado exitosamente");
      setFormData({
        first_name: "",
        last_name: "",
        email: "",
        role_id: "",
        grade_id: "",
      });
    } catch (error) {
      setMessage("Error al registrar usuario");
      console.error("Error:", error);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  useEffect(() => {
    const interval = setInterval(() => {
      if (mode === "recognize") {
        capture();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [mode]);

  const UserInfo = ({ user }) => {
    if (!user) return null;

    const getRoleName = (roleId) => {
      const roles = {
        1: "Directivo",
        2: "Administrativo",
        3: "Estudiante",
        4: "Docente",
      };
      return roles[roleId] || "Rol desconocido";
    };

    return (
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-4">¡Bienvenido!</h2>
        <div className="space-y-2">
          <p>
            <span className="font-semibold">Nombre:</span> {user.first_name}{" "}
            {user.last_name}
          </p>
          <p>
            <span className="font-semibold">Email:</span> {user.email}
          </p>
          <p>
            <span className="font-semibold">Rol:</span>{" "}
            {getRoleName(user.role_id)}
          </p>
          {user.grade_id && (
            <p>
              <span className="font-semibold">Grado:</span> {user.grade_id}
            </p>
          )}
          <p>
            <span className="font-semibold">Hora de registro:</span>{" "}
            {new Date(user.check_in).toLocaleTimeString()}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 py-6">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-center text-blue-600 mb-8">
          Sistema de asistencias I.E de Jesús
        </h1>

        <div className="flex justify-center space-x-4 mb-8">
          <button
            onClick={() => {
              setMode("recognize");
              setMessage("");
            }}
            className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
              mode === "recognize"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Modo Reconocimiento
          </button>
          <button
            onClick={() => {
              setMode("register");
              setMessage("");
              setRecognizedUser(null);
            }}
            className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
              mode === "register"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Modo Registro
          </button>
        </div>

        <div className="flex flex-wrap md:flex-nowrap gap-8">
          {/* Lado izquierdo - Cámara */}
          <div className="w-full md:w-1/2">
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <Webcam
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                className="w-full rounded-lg shadow"
                videoConstraints={{
                  width: 1280,
                  height: 720,
                  facingMode: "user",
                }}
                onUserMediaError={(error) => {
                  console.error("Error al acceder a la cámara:", error);
                  setMessage("Error al acceder a la cámara.");
                }}
              />

              {message && (
                <div
                  className={`mt-4 text-center p-4 rounded-lg ${
                    message.includes("Error") ||
                    message.includes("no reconocida")
                      ? "bg-red-100 text-red-700"
                      : "bg-green-100 text-green-700"
                  }`}
                >
                  {message}
                </div>
              )}
            </div>
          </div>

          {/* Lado derecho - Formulario o Información del Usuario */}
          <div className="w-full md:w-1/2">
            {mode === "register" ? (
              <div className="bg-white p-6 rounded-lg shadow-lg">
                <h2 className="text-2xl font-bold mb-6">Registro de Usuario</h2>
                <form onSubmit={registerUser} className="space-y-4">
                  <input
                    type="text"
                    name="first_name"
                    placeholder="Nombre"
                    value={formData.first_name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <input
                    type="text"
                    name="last_name"
                    placeholder="Apellido"
                    value={formData.last_name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <input
                    type="email"
                    name="email"
                    placeholder="Email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <select
                    name="role_id"
                    value={formData.role_id}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Seleccionar Rol</option>
                    <option value="1">Directivo</option>
                    <option value="2">Administrativo</option>
                    <option value="3">Estudiante</option>
                    <option value="4">Docente</option>
                  </select>
                  {formData.role_id === "3" && (
                    <input
                      type="text"
                      name="grade_id"
                      placeholder="Grado"
                      value={formData.grade_id}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  )}
                  <button
                    type="submit"
                    className="w-full py-3 px-6 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors font-semibold shadow-md"
                  >
                    Registrar Usuario
                  </button>
                </form>
              </div>
            ) : (
              <UserInfo user={recognizedUser} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
