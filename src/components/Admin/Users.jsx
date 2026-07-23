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
    role: "teacher",
    phone: "",
    experience: "",
    curriculum: "",
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await apiClient.get("/admin/users");
      setUsers(res.data.users);
    } catch (err) {
      console.error("Error fetching users:", err);
    }
  };

  const handleSearch = () => setSearch(searchInput);
  const handleClear = () => {
    setSearch("");
    setSearchInput("");
    setRoleFilter("all");
  };

  const filteredUsers = users.filter((user) => {
    return (
      (roleFilter === "all" || user.role === roleFilter) &&
      (user.name?.toLowerCase().includes(search.toLowerCase()) ||
        user.email?.toLowerCase().includes(search.toLowerCase()))
    );
  });

  const handleView = async (id, role) => {
    try {
      const res = await apiClient.get(`/admin/users/${id}/${role}`);
      const user = res.data.user;
      setSelectedUser({
        id: user._id,
        name: user.fullName || user.name || "N/A",
        email: user.email || "N/A",
        role: user.role || role || "N/A",
        status: user.status || "active",
        joined: user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "-",
      });
    } catch (err) {
      console.error("Error fetching user profile:", err);
      alert("Failed to fetch user profile.");
    }
  };

  const handleDelete = async (id, role) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      await apiClient.delete(`/admin/users/${id}/${role}`);
      fetchUsers();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddUser = async () => {
    if (!newUser.fullName || !newUser.email) {
      alert("Full Name and Email are required");
      return;
    }

    const role = newUser.role.toLowerCase();
    const payload = {
      fullName: newUser.fullName,
      email: newUser.email,
      role,
    };

    if (role === "teacher") {
      if (!newUser.phone || !newUser.experience || !newUser.curriculum) {
        alert("Teacher requires phone, experience and curriculum");
        return;
      }
      payload.phone = newUser.phone;
      payload.experience = newUser.experience;
      payload.curriculum = newUser.curriculum;
    }

    if (role === "qao") {
      payload.name = newUser.fullName;
    }

    try {
      await apiClient.post("/admin/users/create", payload);
      alert("User created! Credentials sent via email.");
      fetchUsers();
      setShowAddModal(false);
      setNewUser({ fullName: "", email: "", role: "teacher", phone: "", experience: "", curriculum: "" });
    } catch (err) {
      alert(err.response?.data?.message || "Failed to create user");
    }
  };

  const getRoleBadge = (role) => {
    const base = "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold capitalize";
    switch (role?.toLowerCase()) {
      case "teacher":
        return <span className={`${base} bg-emerald-50 text-emerald-700 border border-emerald-200/60`}>Teacher</span>;
      case "admin":
        return <span className={`${base} bg-purple-50 text-purple-700 border border-purple-200/60`}>Admin</span>;
      case "qao":
        return <span className={`${base} bg-indigo-50 text-indigo-700 border border-indigo-200/60`}>Tutor Manager</span>;
      default:
        return <span className={`${base} bg-slate-100 text-slate-700 border border-slate-200`}>{role}</span>;
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">User Management</h2>
          <p className="text-sm text-slate-500">Manage teachers, administrators, and tutor managers.</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 transition"
        >
          + Add New User
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4">
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-72">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Search by name or email..."
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <button
            onClick={handleSearch}
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 transition"
          >
            Search
          </button>
          {(search || roleFilter !== "all") && (
            <button
              onClick={handleClear}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 shadow-sm hover:bg-slate-100 transition"
            >
              Reset
            </button>
          )}
        </div>

        {/* Role Filter Tabs */}
        <div className="flex items-center gap-1 rounded-xl bg-slate-200/60 p-1 text-xs font-semibold text-slate-600">
          {["all", "teacher", "qao", "admin"].map((role) => (
            <button
              key={role}
              onClick={() => setRoleFilter(role)}
              className={`rounded-lg px-3 py-1.5 capitalize transition ${
                roleFilter === role ? "bg-white text-slate-900 shadow-sm" : "hover:text-slate-900"
              }`}
            >
              {role === "qao" ? "Tutor Managers" : role === "all" ? "All Users" : `${role}s`}
            </button>
          ))}
        </div>
      </div>

    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-500">
          <tr>
            <th className="px-5 py-3.5">User</th>
            <th className="px-5 py-3.5">Email</th>
            <th className="px-5 py-3.5">Role</th>
            <th className="px-5 py-3.5">Status</th>
            <th className="px-5 py-3.5">Joined</th>
            <th className="px-5 py-3.5 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-slate-700">
          {filteredUsers.map((user) => (
            <tr key={user._id} className="hover:bg-slate-50/80 transition">
              <td className="px-5 py-4 font-semibold text-slate-900">{user.name}</td>
              <td className="px-5 py-4 text-slate-500">{user.email}</td>
              <td className="px-5 py-4">{getRoleBadge(user.role)}</td>
              <td className="px-5 py-4 capitalize">{user.status || "active"}</td>
              <td className="px-5 py-4 text-xs text-slate-500">{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "-"}</td>
              <td className="px-5 py-4 text-right">
                <div className="flex justify-end gap-2">
                  <button onClick={() => handleView(user._id, user.role)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition">View</button>
                  <button onClick={() => handleDelete(user._id, user.role)} className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition">Delete</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {filteredUsers.length === 0 && <div className="text-center p-6 text-slate-500">No users found.</div>}
    </div>

  {
    selectedUser && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
        <div className="bg-white p-6 rounded w-96 text-black shadow-lg">
          <h3 className="text-xl font-bold mb-4">User Profile</h3>
          <p><strong>Name:</strong> {selectedUser.name}</p>
          <p><strong>Email:</strong> {selectedUser.email}</p>
          <p><strong>Role:</strong> {selectedUser.role}</p>
          <p><strong>Status:</strong> {selectedUser.status}</p>
          <p><strong>Joined:</strong> {selectedUser.joined}</p>
          <button onClick={() => setSelectedUser(null)} className="mt-4 bg-gray-600 text-white px-4 py-2 rounded">Close</button>
        </div>
      </div>
    )
  }

  {
    showAddModal && (
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
            <select
              value={newUser.role}
              onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
              className="border p-2 rounded text-black"
            >
              <option value="teacher">Teacher</option>
              <option value="qao">Tutor Manager</option>
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
            <button onClick={handleAddUser} className="bg-green-600 text-white px-4 py-2 rounded">Add</button>
            <button onClick={() => setShowAddModal(false)} className="bg-gray-600 text-white px-4 py-2 rounded">Cancel</button>
          </div>
        </div>
      </div>
    )
  }
    </div >
  );
}