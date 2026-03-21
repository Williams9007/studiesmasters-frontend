// src/components/Admin/Users.jsx
"use client";

import { useEffect, useState } from "react";
import apiClient from "../../utils/apiClient";

export default function Users() {
  const [users, setUsers] = useState([]);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  const [selectedUser, setSelectedUser] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const [newUser, setNewUser] = useState({
    fullName: "",
    email: "",
    password: "",
    role: "teacher",
    phone: "",
    experience: "",
    curriculum: "",
  });

  // ================= FETCH USERS =================
  const fetchUsers = async () => {
    try {
      const res = await apiClient.get("/admin/users");
      setUsers(res.data.users || []);
    } catch (err) {
      console.error("Error fetching users:", err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // ================= SEARCH & FILTER =================
  const handleSearch = () => setSearch(searchInput);
  const handleClear = () => {
    setSearch("");
    setSearchInput("");
    setRoleFilter("all");
  };

  const filteredUsers = users.filter((user) => {
    return (
      (roleFilter === "all" || user.role === roleFilter) &&
      (user.fullName?.toLowerCase().includes(search.toLowerCase()) ||
        user.name?.toLowerCase().includes(search.toLowerCase()) ||
        user.email?.toLowerCase().includes(search.toLowerCase()))
    );
  });

  // ================= VIEW USER =================
  const handleView = async (id, role) => {
    try {
      const res = await apiClient.get(`/admin/users/${id}/${role}`);
      const user = res.data.user;

      const normalizedUser = {
        id: user._id,
        name: user.fullName || user.name || "N/A",
        email: user.email || "N/A",
        role: user.role || role || "N/A",
        status: user.status || "active",
        joined: user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "-",
        additional: { ...user._doc },
      };

      setSelectedUser(normalizedUser);
    } catch (err) {
      console.error("Error fetching user profile:", err);
      alert("Failed to fetch user profile.");
    }
  };

  // ================= DELETE USER =================
  const handleDelete = async (id, role) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      await apiClient.delete(`/admin/users/${id}/${role}`);
      fetchUsers();
    } catch (err) {
      console.error("Failed to delete user:", err);
      alert("Failed to delete user.");
    }
  };

  // ================= ADD USER =================
  const handleAddUser = async () => {
    if (!newUser.fullName || !newUser.email || !newUser.password) {
      alert("Full Name, Email, and Password are required");
      return;
    }

    const role = newUser.role.toLowerCase();

    const payload = {
      fullName: newUser.fullName,
      email: newUser.email,
      password: newUser.password,
      role,
    };

    // Teacher extra fields
    if (role === "teacher") {
      if (!newUser.phone || !newUser.experience || !newUser.curriculum) {
        alert("Teacher requires phone, experience, and curriculum");
        return;
      }
      payload.phone = newUser.phone;
      payload.experience = newUser.experience;
      payload.curriculum = newUser.curriculum;
    }

    // QAO uses name instead of fullName (if your schema requires it)
    if (role === "qao") {
      payload.name = newUser.fullName;
    }

    try {
      await apiClient.post("/admin/users/create", payload);
      fetchUsers();
      setShowAddModal(false);

      setNewUser({
        fullName: "",
        email: "",
        password: "",
        role: "teacher",
        phone: "",
        experience: "",
        curriculum: "",
      });
    } catch (err) {
      console.error("❌ Error creating user:", err.response?.data || err);
      alert(err.response?.data?.message || "Failed to create user");
    }
  };

  // ================= ROLE BADGE =================
  const getRoleBadge = (role) => {
    const base = "px-2 py-1 rounded text-xs font-semibold";
    switch (role) {
      case "teacher":
        return <span className={`${base} bg-green-200 text-green-800`}>Teacher</span>;
      case "admin":
        return <span className={`${base} bg-purple-200 text-purple-800`}>Admin</span>;
      case "qao":
        return <span className={`${base} bg-yellow-200 text-yellow-800`}>QAO</span>;
      default:
        return <span className={`${base} bg-gray-200 text-gray-800`}>{role}</span>;
    }
  };

  // ================= RETURN =================
  return (
    <div className="bg-white text-black p-6 rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-6">User Management</h2>

      {/* Search & Filter */}
      <div className="flex flex-wrap gap-4 items-end mb-6">
        <div className="flex flex-col">
          <label className="text-sm font-semibold mb-1">Search Users</label>
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Enter name or email"
            className="border p-2 rounded w-64 text-black"
          />
        </div>

        <button
          onClick={handleSearch}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Search
        </button>
        <button
          onClick={handleClear}
          className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
        >
          Clear
        </button>

        <div className="flex flex-col">
          <label className="text-sm font-semibold mb-1">Filter by Role</label>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="border p-2 rounded text-black"
          >
            <option value="all">All Roles</option>
            <option value="teacher">Teachers</option>
            <option value="admin">Admins</option>
            <option value="qao">QAO</option>
          </select>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="bg-green-600 text-white px-4 py-2 rounded"
        >
          Add User
        </button>
      </div>

      {/* Users Table */}
      <div className="overflow-x-auto">
        <table className="w-full border text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 text-left">Name</th>
              <th className="p-3 text-left">Email</th>
              <th className="p-3 text-left">Role</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Joined</th>
              <th className="p-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user._id} className="border-t hover:bg-gray-50">
                <td className="p-3">{user.fullName || user.name}</td>
                <td className="p-3">{user.email}</td>
                <td className="p-3">{getRoleBadge(user.role)}</td>
                <td className="p-3 capitalize">{user.status || "active"}</td>
                <td className="p-3">
                  {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "-"}
                </td>
                <td className="p-3 flex gap-3">
                  <button
                    onClick={() => handleView(user._id, user.role)}
                    className="bg-blue-500 text-white px-3 py-1 rounded"
                  >
                    View
                  </button>
                  <button
                    onClick={() => handleDelete(user._id, user.role)}
                    className="bg-red-600 text-white px-3 py-1 rounded"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredUsers.length === 0 && (
          <div className="text-center p-6 text-gray-500">No users found.</div>
        )}
      </div>

      {/* Modals */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded w-96 text-black shadow-lg">
            <h3 className="text-xl font-bold mb-4">User Profile</h3>
            <p><strong>Name:</strong> {selectedUser.name}</p>
            <p><strong>Email:</strong> {selectedUser.email}</p>
            <p><strong>Role:</strong> {selectedUser.role}</p>
            <p><strong>Status:</strong> {selectedUser.status}</p>
            <p><strong>Joined:</strong> {selectedUser.joined}</p>
            <button
              onClick={() => setSelectedUser(null)}
              className="mt-4 bg-gray-600 text-white px-4 py-2 rounded"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded w-96 text-black shadow-lg">
            <h3 className="text-xl font-bold mb-4">Add New User</h3>
            <div className="flex flex-col gap-3">
              <input
                type="text"
                placeholder="Full Name"
                value={newUser.fullName}
                onChange={(e) => setNewUser({ ...newUser, fullName: e.target.value })}
                className="border p-2 rounded text-black"
              />
              <input
                type="email"
                placeholder="Email"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                className="border p-2 rounded text-black"
              />
              <input
                type="password"
                placeholder="Password"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                className="border p-2 rounded text-black"
              />
              <select
                value={newUser.role}
                onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                className="border p-2 rounded text-black"
              >
                <option value="teacher">Teacher</option>
                <option value="qao">QAO</option>
                <option value="admin">Admin</option>
              </select>

              {newUser.role === "teacher" && (
                <>
                  <input
                    type="text"
                    placeholder="Phone"
                    value={newUser.phone}
                    onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                    className="border p-2 rounded text-black"
                  />
                  <input
                    type="text"
                    placeholder="Experience"
                    value={newUser.experience}
                    onChange={(e) => setNewUser({ ...newUser, experience: e.target.value })}
                    className="border p-2 rounded text-black"
                  />
                  <input
                    type="text"
                    placeholder="Curriculum"
                    value={newUser.curriculum}
                    onChange={(e) => setNewUser({ ...newUser, curriculum: e.target.value })}
                    className="border p-2 rounded text-black"
                  />
                </>
              )}
            </div>
            <div className="flex gap-3 mt-4">
              <button
                onClick={handleAddUser}
                className="bg-green-600 text-white px-4 py-2 rounded"
              >
                Add
              </button>
              <button
                onClick={() => setShowAddModal(false)}
                className="bg-gray-600 text-white px-4 py-2 rounded"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
