import React, { useState, useEffect } from "react";
import axios from "axios";
import { Download, Users, UserCheck, UserX, Calendar } from "lucide-react";
import * as XLSX from "xlsx";

const AdminDashboard = () => {
  const [dateRange, setDateRange] = useState({
    start: new Date().toISOString().split("T")[0],
    end: new Date().toISOString().split("T")[0],
  });
  const [stats, setStats] = useState({
    total: 0,
    present: 0,
    absent: 0,
  });
  const [absenceData, setAbsenceData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Role configuration for styling and naming
  const roleConfig = {
    1: { name: "Directivo", style: "bg-purple-100 text-purple-800" },
    2: { name: "Administrativo", style: "bg-blue-100 text-blue-800" },
    3: { name: "Estudiante", style: "bg-green-100 text-green-800" },
    4: { name: "Docente", style: "bg-orange-100 text-orange-800" },
  };

  // Fetch attendance data for the selected date range
  const fetchAttendanceData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/attendance/`, {
        params: {
          start_date: dateRange.start,
          end_date: dateRange.end,
        },
      });

      setStats(response.data.stats);

      // Process absence data
      const processedAbsences = Object.entries(response.data.attendance_by_role)
        .flatMap(([roleId, users]) =>
          users.map((user) => ({
            ...user,
            roleId,
            roleName: roleConfig[roleId]?.name || "Desconocido",
          }))
        )
        .sort((a, b) => b.daysAbsent - a.daysAbsent);

      setAbsenceData(processedAbsences);
    } catch (error) {
      console.error("Error fetching attendance data:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAttendanceData();
  }, [dateRange.start, dateRange.end]);

  // Export absence data to Excel
  const exportToExcel = () => {
    const exportData = absenceData.map((user) => ({
      Documento: user.document_number,
      "Nombre Completo": `${user.first_name} ${user.last_name}`,
      Rol: user.roleName,
      Email: user.email,
      "Días Ausente": user.daysAbsent,
      "Último Registro": user.check_in
        ? new Date(user.check_in).toLocaleDateString("es-CO")
        : "Sin registro",
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Inasistencias");

    // Adjust column widths
    ws["!cols"] = [
      { wch: 15 }, // Documento
      { wch: 30 }, // Nombre
      { wch: 15 }, // Rol
      { wch: 30 }, // Email
      { wch: 15 }, // Días Ausente
      { wch: 20 }, // Último Registro
    ];

    XLSX.writeFile(
      wb,
      `inasistencias_${dateRange.start}_${dateRange.end}.xlsx`
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Panel de Control de Asistencias
          </h1>
          <div className="flex items-center gap-4">
            <div className="flex gap-2 items-center">
              <Calendar className="text-gray-500" size={20} />
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) =>
                  setDateRange((prev) => ({ ...prev, start: e.target.value }))
                }
                className="px-4 py-2 border rounded-lg"
              />
              <span className="text-gray-500">hasta</span>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) =>
                  setDateRange((prev) => ({ ...prev, end: e.target.value }))
                }
                className="px-4 py-2 border rounded-lg"
              />
            </div>
            <button
              onClick={exportToExcel}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download size={20} />
              Exportar Inasistencias
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-blue-500">
            <div className="flex items-center gap-4">
              <Users className="w-12 h-12 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600">Total Usuarios</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-green-500">
            <div className="flex items-center gap-4">
              <UserCheck className="w-12 h-12 text-green-500" />
              <div>
                <p className="text-sm text-gray-600">Presentes</p>
                <p className="text-2xl font-bold">{stats.present}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-red-500">
            <div className="flex items-center gap-4">
              <UserX className="w-12 h-12 text-red-500" />
              <div>
                <p className="text-sm text-gray-600">Ausentes</p>
                <p className="text-2xl font-bold">{stats.absent}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Absence List */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-6">
            Registro de Inasistencias ({dateRange.start} - {dateRange.end})
          </h2>
          <div className="space-y-4">
            {loading ? (
              <p className="text-center text-gray-500 py-8">
                Cargando datos...
              </p>
            ) : absenceData.length > 0 ? (
              absenceData.map((user) => (
                <div
                  key={user.id}
                  className="p-4 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">
                        {user.first_name} {user.last_name}
                      </p>
                      <p className="text-sm text-gray-600">
                        {user.document_number} • {user.email}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span
                        className={`px-3 py-1 rounded-full ${
                          roleConfig[user.roleId]?.style
                        }`}
                      >
                        {user.roleName}
                      </span>
                      <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full">
                        {user.daysAbsent} días ausente
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 py-8">
                No se encontraron inasistencias en el rango de fechas
                seleccionado
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
