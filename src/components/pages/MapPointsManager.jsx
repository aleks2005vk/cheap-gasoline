import React, { useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import { selectCurrentUser, selectCurrentToken } from "../../app/api/authSlice";
import { API_URL } from "../../config";

const MapPointsManager = () => {
  const user = useSelector(selectCurrentUser);
  const token = useSelector(selectCurrentToken);

  const [points, setPoints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingPoint, setEditingPoint] = useState(null);
  const [editForm, setEditForm] = useState({
    title: "",
    price: "",
    lat: "",
    lng: "",
  });

  const fetchPoints = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/admin/points`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setPoints(data.points || []);
      } else {
        setError("Failed to fetch points");
      }
    } catch (err) {
      setError("Connection error");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (user?.role === "admin" || user?.is_admin) {
      fetchPoints();
    }
  }, [user, fetchPoints]);

  const handleApprove = async (id) => {
    try {
      const response = await fetch(`${API_URL}/api/admin/points/${id}/approve`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        setPoints(points.map(p => p.id === id ? { ...p, status: "active" } : p));
      } else {
        alert("Failed to approve");
      }
    } catch (err) {
      console.error(err);
      alert("Error approving point");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this point?")) return;
    try {
      const response = await fetch(`${API_URL}/api/admin/points/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        setPoints(points.filter(p => p.id !== id));
      } else {
        alert("Failed to delete");
      }
    } catch (err) {
      console.error(err);
      alert("Error deleting point");
    }
  };

  const handleEdit = (point) => {
    setEditingPoint(point);
    setEditForm({
      title: point.title || "",
      price: point.price || "",
      lat: point.lat || "",
      lng: point.lng || "",
    });
  };

  const saveEdit = async () => {
    try {
      const response = await fetch(`${API_URL}/api/admin/points/${editingPoint.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editForm),
      });
      if (response.ok) {
        setPoints(points.map(p => p.id === editingPoint.id ? { ...p, ...editForm } : p));
        setEditingPoint(null);
      } else {
        alert("Failed to update");
      }
    } catch (err) {
      console.error(err);
      alert("Error updating point");
    }
  };

  if (loading) return <div className="p-8 text-white">Loading points...</div>;
  if (error) return <div className="p-8 text-red-400">{error}</div>;

  return (
    <div className="p-8 text-white">
      <h1 className="text-2xl font-bold mb-6">Map Points Manager</h1>
      <div className="space-y-4">
        {points.map(point => (
          <div key={point.id} className="bg-gray-800 p-4 rounded-lg flex justify-between items-center">
            <div>
              <h3 className="font-semibold">{point.title}</h3>
              <p>Price: {point.price}</p>
              <p>Status: {point.status}</p>
              <p>Lat: {point.lat}, Lng: {point.lng}</p>
            </div>
            <div className="space-x-2">
              {point.status !== "active" && (
                <button
                  onClick={() => handleApprove(point.id)}
                  className="bg-green-600 px-4 py-2 rounded"
                >
                  Approve
                </button>
              )}
              <button
                onClick={() => handleEdit(point)}
                className="bg-blue-600 px-4 py-2 rounded"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(point.id)}
                className="bg-red-600 px-4 py-2 rounded"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {editingPoint && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-gray-800 p-6 rounded-lg w-96">
            <h2 className="text-xl mb-4">Edit Point</h2>
            <input
              type="text"
              placeholder="Title"
              value={editForm.title}
              onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
              className="w-full p-2 mb-2 bg-gray-700 text-white rounded"
            />
            <input
              type="number"
              placeholder="Price"
              value={editForm.price}
              onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
              className="w-full p-2 mb-2 bg-gray-700 text-white rounded"
            />
            <input
              type="number"
              step="any"
              placeholder="Latitude"
              value={editForm.lat}
              onChange={(e) => setEditForm({ ...editForm, lat: e.target.value })}
              className="w-full p-2 mb-2 bg-gray-700 text-white rounded"
            />
            <input
              type="number"
              step="any"
              placeholder="Longitude"
              value={editForm.lng}
              onChange={(e) => setEditForm({ ...editForm, lng: e.target.value })}
              className="w-full p-2 mb-4 bg-gray-700 text-white rounded"
            />
            <div className="flex space-x-2">
              <button onClick={saveEdit} className="bg-green-600 px-4 py-2 rounded">Save</button>
              <button onClick={() => setEditingPoint(null)} className="bg-gray-600 px-4 py-2 rounded">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapPointsManager;