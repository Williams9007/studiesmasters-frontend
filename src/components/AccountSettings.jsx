import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs";
import apiClient from "../utils/apiClient";

export function AccountSettings() {
<<<<<<< HEAD
=======
  const [password, setPassword] = useState("");
>>>>>>> 8ddc26ece182e2445f99f3923ba32f7dfd1086dc
  const [email, setEmail] = useState("");
  const [helpContent, setHelpContent] = useState("");
  const [loadingHelp, setLoadingHelp] = useState(false);

  // 🔹 Change Password Handler
  const handleChangePassword = async () => {
    try {
<<<<<<< HEAD
      const response = await apiClient.post("/students/change-password/request");
      alert(response.data.message || "Check your email to confirm the password change.");
    } catch (err) {
      console.error("Failed to change password:", err);
      alert(err.response?.data?.message || "Failed to send a confirmation link. Please try again.");
=======
      if (!password) {
        alert("Please enter a new password.");
        return;
      }

      const response = await apiClient.post("/auth/change-password", {
        newPassword: password,
      });

      alert(response.data.message || "Password changed successfully!");
      setPassword("");
    } catch (err) {
      console.error("Failed to change password:", err);
      alert(err.response?.data?.message || "Failed to change password.");
>>>>>>> 8ddc26ece182e2445f99f3923ba32f7dfd1086dc
    }
  };

  // 🔹 Change Email Handler
  const handleChangeEmail = async () => {
    try {
      if (!email) {
        alert("Please enter a new email.");
        return;
      }

<<<<<<< HEAD
      const response = await apiClient.post("/api/auth/change-email", { newEmail: email });
=======
      const response = await apiClient.post("/auth/change-email", {
        newEmail: email,
      });

>>>>>>> 8ddc26ece182e2445f99f3923ba32f7dfd1086dc
      alert(response.data.message || "Email changed successfully!");
      setEmail("");
    } catch (err) {
      console.error("Failed to change email:", err);
<<<<<<< HEAD
      alert("Failed to change email. Please try again.");
=======
      alert(err.response?.data?.message || "Failed to change email.");
>>>>>>> 8ddc26ece182e2445f99f3923ba32f7dfd1086dc
    }
  };

  // 🔹 Fetch Help Content
  const fetchHelpContent = async () => {
    try {
      setLoadingHelp(true);
<<<<<<< HEAD
      const response = await apiClient.get("/api/help");
      setHelpContent(response.data.content || "No help content available.");
    } catch (err) {
      console.error("Failed to fetch help content:", err);
      alert("Failed to fetch help content. Please try again.");
=======
      const response = await apiClient.get("/help");
      setHelpContent(response.data.content || "No help content available.");
    } catch (err) {
      console.error("Failed to fetch help content:", err);
      alert("Failed to fetch help content.");
>>>>>>> 8ddc26ece182e2445f99f3923ba32f7dfd1086dc
    } finally {
      setLoadingHelp(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Account Settings</h1>
<<<<<<< HEAD
=======

>>>>>>> 8ddc26ece182e2445f99f3923ba32f7dfd1086dc
      <Tabs defaultValue="change-password" className="rounded-xl bg-white shadow-md">
        <TabsList className="flex p-1 bg-blue-50 rounded-xl">
          <TabsTrigger value="change-password" className="flex-1 text-center py-2 rounded-lg font-semibold">
            Change Password
          </TabsTrigger>
          <TabsTrigger value="change-email" className="flex-1 text-center py-2 rounded-lg font-semibold">
            Change Email
          </TabsTrigger>
          <TabsTrigger value="help" className="flex-1 text-center py-2 rounded-lg font-semibold">
            Help
          </TabsTrigger>
        </TabsList>

<<<<<<< HEAD
        {/* Change Password Tab */}
        <TabsContent value="change-password" className="p-6">
          <h2 className="text-lg font-semibold mb-4">Change Password</h2>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">For your security, we will email you a confirmation link before your password can be changed.</p>
            <button
              onClick={handleChangePassword}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
            >
              Send Confirmation Link
            </button>
          </div>
        </TabsContent>

        {/* Change Email Tab */}
        <TabsContent value="change-email" className="p-6">
          <h2 className="text-lg font-semibold mb-4">Change Email</h2>
          <div className="space-y-4">
            <input
              type="email"
              placeholder="Enter new email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border rounded p-2"
            />
            <button
              onClick={handleChangeEmail}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
            >
              Change Email
            </button>
          </div>
        </TabsContent>

        {/* Help Tab */}
        <TabsContent value="help" className="p-6">
          <h2 className="text-lg font-semibold mb-4">Help</h2>
          <div className="space-y-4">
            <button
              onClick={fetchHelpContent}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
            >
              Fetch Help Content
            </button>
            {loadingHelp ? (
              <p>Loading...</p>
            ) : (
              <p className="text-gray-600">{helpContent || "No help content available."}</p>
            )}
          </div>
=======
        {/* Change Password */}
        <TabsContent value="change-password" className="p-6">
          <input
            type="password"
            placeholder="Enter new password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border rounded p-2 mb-4"
          />
          <button
            onClick={handleChangePassword}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
          >
            Change Password
          </button>
        </TabsContent>

        {/* Change Email */}
        <TabsContent value="change-email" className="p-6">
          <input
            type="email"
            placeholder="Enter new email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border rounded p-2 mb-4"
          />
          <button
            onClick={handleChangeEmail}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
          >
            Change Email
          </button>
        </TabsContent>

        {/* Help */}
        <TabsContent value="help" className="p-6">
          <button
            onClick={fetchHelpContent}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded mb-4"
          >
            Fetch Help Content
          </button>

          {loadingHelp ? (
            <p>Loading...</p>
          ) : (
            <p className="text-gray-600">
              {helpContent || "No help content available."}
            </p>
          )}
>>>>>>> 8ddc26ece182e2445f99f3923ba32f7dfd1086dc
        </TabsContent>
      </Tabs>
    </div>
  );
}
