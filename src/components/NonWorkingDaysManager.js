import React, { useState, useEffect } from "react";
import { Calendar, Trash2, Plus, X } from "lucide-react";

const NonWorkingDaysManager = () => {
  const [nonWorkingDays, setNonWorkingDays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDialog, setShowDialog] = useState(false);
  const [newDay, setNewDay] = useState({
    date: "",
    description: "",
    type: "holiday",
  });

  const fetchNonWorkingDays = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/non-working-days/`);
      const data = await response.json();
      setNonWorkingDays(Array.isArray(data) ? data : []);
      setLoading(false);
    } catch (err) {
      setError("Error al cargar los días no laborables");
      setLoading(false);
      setNonWorkingDays([]);
    }
  };

  useEffect(() => {
    fetchNonWorkingDays();
  }, []);

  const handleAddDay = async () => {
    try {
      // Convertir el objeto a un string JSON
      const formData = new URLSearchParams();
      formData.append("date", newDay.date);
      formData.append("description", newDay.description);
      formData.append("type", newDay.type);

      console.log("Datos enviados:", {
        date: newDay.date,
        description: newDay.description,
        type: newDay.type,
      });

      const response = await fetch(`${process.env.REACT_APP_API_URL}/non-working-days/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData.toString(), // Asegúrate de que esto sea un string
      });

      console.log("Response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text(); // Cambiar de .json() a .text()
        console.error("Error response:", errorText);
        throw new Error(errorText || "Error al agregar el día no laborable");
      }

      const result = await response.json();
      console.log("Success response:", result);

      await fetchNonWorkingDays();
      setShowDialog(false);
      setNewDay({ date: "", description: "", type: "holiday" });
    } catch (err) {
      console.error("Full error:", err);
      setError(err.message);
    }
  };

  const handleDeleteDay = async (id) => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/non-working-days/${id}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        fetchNonWorkingDays();
      } else {
        throw new Error("Error al eliminar el día no laborable");
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const groupedDays = Array.isArray(nonWorkingDays)
    ? nonWorkingDays.reduce((acc, day) => {
      if (!acc[day.type]) {
        acc[day.type] = [];
      }
      acc[day.type].push(day);
      return acc;
    }, {})
    : {};

  const Modal = ({ isOpen, onClose, children }) => {
    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg w-full max-w-md">{children}</div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Gestión de Días No Laborables
          </h1>
          <button
            onClick={() => setShowDialog(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={20} />
            Agregar Día No Laborable
          </button>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4 relative">
            <p className="text-red-800">{error}</p>
            <button
              className="absolute right-2 top-2 text-red-600 hover:text-red-800"
              onClick={() => setError(null)}
            >
              <X size={16} />
            </button>
          </div>
        )}

        <Modal isOpen={showDialog} onClose={() => setShowDialog(false)}>
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">
                Agregar Nuevo Día No Laborable
              </h2>
              <button
                onClick={() => setShowDialog(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Fecha</label>
                <input
                  type="date"
                  value={newDay.date}
                  onChange={(e) =>
                    setNewDay({ ...newDay, date: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Descripción</label>
                <input
                  type="text"
                  value={newDay.description}
                  onChange={(e) =>
                    setNewDay({ ...newDay, description: e.target.value })
                  }
                  placeholder="Descripción del día no laborable"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Tipo</label>
                <select
                  value={newDay.type}
                  onChange={(e) =>
                    setNewDay({ ...newDay, type: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="holiday">Festivo</option>
                  <option value="vacation">Vacaciones</option>
                  <option value="special">Día Especial</option>
                </select>
              </div>
              <button
                onClick={handleAddDay}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Guardar
              </button>
            </div>
          </div>
        </Modal>

        {loading ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Cargando días no laborables...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Object.entries(groupedDays).map(([type, days]) => (
              <div
                key={type}
                className="bg-white rounded-xl shadow-sm p-6 border border-gray-200"
              >
                <h2 className="text-xl font-semibold mb-4">
                  {type === "holiday" && "Festivos"}
                  {type === "vacation" && "Vacaciones"}
                  {type === "special" && "Días Especiales"}
                </h2>
                <div className="space-y-3">
                  {days.map((day) => (
                    <div
                      key={day.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium">
                          {new Date(day.date).toLocaleDateString("es-CO")}
                        </p>
                        <p className="text-sm text-gray-600">
                          {day.description}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeleteDay(day.id)}
                        className="p-1 hover:bg-gray-200 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} className="text-red-500" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NonWorkingDaysManager;
