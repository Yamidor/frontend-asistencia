import React, { useState, useEffect, useRef } from "react";
import Webcam from "react-webcam";
import axios from "axios";
import Swal from "sweetalert2";

const API_URL = "http://localhost:8000";

const AttendanceSystem = () => {
  const [mode, setMode] = useState("recognize");
  const [message, setMessage] = useState("");
  const [recognizedUser, setRecognizedUser] = useState(null);
  const [grades, setGrades] = useState({});
  const [isDocumentExists, setIsDocumentExists] = useState(false);
  const webcamRef = useRef(null);

  const [formData, setFormData] = useState({
    document_number: "",
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

  const checkDocument = async (documentNumber) => {
    try {
      const response = await axios.get(
        `${API_URL}/check-document/${documentNumber}`
      );
      if (response.data.exists) {
        setIsDocumentExists(true);
        setMessage("Este documento ya está registrado");
        return true;
      }
      setIsDocumentExists(false);
      setMessage("");
      return false;
    } catch (error) {
      console.error("Error checking document:", error);
      return false;
    }
  };

  useEffect(() => {
    const fetchGrades = async () => {
      if (formData.role_id === "3") {
        try {
          const response = await axios.get(`${API_URL}/grades/levels`);
          console.log(response.data);
          setGrades(response.data);
        } catch (error) {
          console.error("Error fetching grades:", error);
        }
      }
    };
    fetchGrades();
  }, [formData.role_id]);

  const registerUser = async (e) => {
    e.preventDefault();

    const documentExists = await checkDocument(formData.document_number);
    if (documentExists) return;

    const imageSrc = webcamRef.current?.getScreenshot();

    if (!imageSrc) {
      setMessage("Error al capturar la imagen. Verifica la cámara.");
      return;
    }

    const base64Data = imageSrc.split(",")[1];
    const blob = await fetch(`data:image/jpeg;base64,${base64Data}`).then(
      (res) => res.blob()
    );

    // Obtener nombre de grado
    const getSelectedGradeName = () => {
      if (formData.role_id === "3" && formData.grade_id) {
        for (const level in grades) {
          const gradeList = grades[level];
          const grade = gradeList.find(
            (g) => g.id.toString() === formData.grade_id
          );
          if (grade) return grade.name;
        }
      }
      return "N/A";
    };

    // Preview antes de registrar
    const result = await Swal.fire({
      title: "Confirmar Registro",
      html: `
        <div class="text-left">
          <p><strong>Documento:</strong> ${formData.document_number}</p>
          <p><strong>Nombre:</strong> ${formData.first_name} ${
        formData.last_name
      }</p>
          <p><strong>Email:</strong> ${formData.email}</p>
          <p><strong>Rol:</strong> ${getRoleName(formData.role_id)}</p>
          ${
            formData.role_id === "3"
              ? `<p><strong>Grado:</strong> ${getSelectedGradeName()}</p>`
              : ""
          }
        </div>
        <img src="${imageSrc}" class="mx-auto mt-4" style="max-width: 300px;">
      `,
      showCancelButton: true,
      confirmButtonText: "Confirmar",
      cancelButtonText: "Cancelar",
      customClass: {
        popup: "w-auto max-w-lg",
      },
    });

    if (!result.isConfirmed) return;

    const userData = new FormData();
    const userObject = {
      document_number: formData.document_number,
      first_name: formData.first_name,
      last_name: formData.last_name,
      email: formData.email,
      role_id: parseInt(formData.role_id),
      grade_id: formData.grade_id ? parseInt(formData.grade_id) : null,
    };

    userData.append("user", JSON.stringify(userObject));
    userData.append("face_image", blob, "face.jpg");

    try {
      const response = await axios.post(`${API_URL}/users/`, userData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      await Swal.fire({
        icon: "success",
        title: "Usuario Registrado",
        text: "Usuario registrado exitosamente",
      });

      setFormData({
        document_number: "",
        first_name: "",
        last_name: "",
        email: "",
        role_id: "",
        grade_id: "",
      });
    } catch (error) {
      await Swal.fire({
        icon: "error",
        title: "Error",
        text: error.response?.data?.detail || "Error al registrar usuario",
      });
      console.error("Error:", error);
    }
  };

  const handleInputChange = async (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });

    if (name === "document_number" && value.length > 5) {
      await checkDocument(value);
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      if (mode === "recognize") {
        capture();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [mode]);

  const getRoleName = (roleId) => {
    const roles = {
      1: "Directivo",
      2: "Administrativo",
      3: "Estudiante",
      4: "Docente",
    };
    return roles[roleId] || "Rol desconocido";
  };

  const getGradeName = (gradeId) => {
    // Verificar si grades está definido y no está vacío
    if (!grades || Object.keys(grades).length === 0) {
      return "Grado no disponible";
    }

    // Buscar en todos los niveles de grados
    const levels = ["prescolar", "primaria", "secundaria", "media"];

    for (const level of levels) {
      const gradeList = grades[level];

      // Verificar si la lista de grados existe
      if (gradeList && Array.isArray(gradeList)) {
        const grade = gradeList.find(
          (g) => g.id.toString() === gradeId.toString()
        );

        if (grade) return grade.name;
      }
    }

    return "Grado no encontrado";
  };

  const UserInfo = ({ user }) => {
    if (!user) return null;

    const gradeName = user.grade_id
      ? getGradeName(user.grade_id.toString())
      : "N/A";

    const getUserImage = (imageData) => {
      if (!imageData) return null;

      // Si la imagen comienza con FFD8 (header JPEG) o similar, es una imagen raw
      if (imageData.startsWith("ffd8") || imageData.match(/^[0-9a-fA-F]+$/)) {
        return `data:image/jpeg;base64,${imageData}`;
      }

      // Si ya incluye el prefijo data:image, retornarlo tal cual
      if (imageData.startsWith("data:image")) {
        return imageData;
      }

      // Para cualquier otro caso, intentar como base64 directo
      try {
        // Verificar si es una cadena base64 válida
        btoa(atob(imageData));
        return `data:image/jpeg;base64,${imageData}`;
      } catch (e) {
        console.error("Invalid base64 string:", e);
        return null;
      }
    };

    const userImage = getUserImage(user.face_image);

    return (
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-4">¡Bienvenido!</h2>

        <div className="space-y-2">
          <p>
            <span className="font-semibold">Documento:</span>{" "}
            {user.document_number}
          </p>
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
              <span className="font-semibold">Grado:</span> {gradeName}
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

  // El resto del código del componente se mantiene igual
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

          <div className="w-full md:w-1/2">
            {mode === "register" ? (
              <div className="bg-white p-6 rounded-lg shadow-lg">
                <h2 className="text-2xl font-bold mb-6">Registro de Usuario</h2>
                <form onSubmit={registerUser} className="space-y-4">
                  <input
                    type="text"
                    name="document_number"
                    placeholder="Número de Documento"
                    value={formData.document_number}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
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
                    <select
                      name="grade_id"
                      value={formData.grade_id}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Seleccionar Grado</option>
                      {Object.entries(grades).map(([level, gradeList]) => (
                        <optgroup key={level} label={level}>
                          {gradeList.map((grade) => (
                            <option key={grade.id} value={grade.id}>
                              {grade.name}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  )}
                  <button
                    type="submit"
                    disabled={isDocumentExists}
                    className={`w-full py-3 px-6 text-white rounded-lg font-semibold shadow-md transition-colors ${
                      isDocumentExists
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-blue-600 hover:bg-blue-700"
                    }`}
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
};

export default AttendanceSystem;
