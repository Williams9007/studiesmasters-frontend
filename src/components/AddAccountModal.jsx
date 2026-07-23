import { useState } from "react";
import { Button } from "@/components/ui/button";
import apiClient from "@/utils/apiClient";

export default function AddAccountModal({ onClose }) {
  const [role, setRole] = useState("teacher");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreate = async (e) => {
    e.preventDefault();

    if (!name || !email) {
      alert("Please fill in all required fields.");
      return;
    }

    setLoading(true);
    try {
      const res = await apiClient.post("/admin/users/create", {
        fullName: name,
        email,
        role,
      });
      alert(`${role === "qao" ? "Tutor Manager" : role} account created! Credentials sent to ${email}.`);
      setName("");
      setEmail("");
      setRole("teacher");
      onClose();
    } catch (err) {
      alert(err.response?.data?.message || "Error creating account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-2xl w-full max-w-md shadow-lg">
        <h2 className="text-xl font-semibold mb-4">Add New Account</h2>
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block mb-1">Role</label>
            <select
              className="border rounded p-2 w-full"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
              <option value="qao">Tutor Manager</option>
            </select>
          </div>

          <div>
            <label className="block mb-1">Full Name</label>
            <input
              type="text"
              className="border rounded p-2 w-full"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter full name"
            />
          </div>

          <div>
            <label className="block mb-1">Email</label>
            <input
              type="email"
              className="border rounded p-2 w-full"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter email"
            />
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-green-600 hover:bg-green-700 text-white"
              disabled={loading}
            >
              {loading ? "Creating..." : "Create"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
