"use client";

import { useState, useEffect } from "react";
import apiClient from "../utils/apiClient";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { motion } from "framer-motion";
import { 
  Monitor, Play, Users, BookOpen, 
  Clock, Link, ExternalLink, 
  Activity, Video, CheckCircle, AlertCircle 
} from "lucide-react";

export default function ManageClass() {
  const [moodleUrl, setMoodleUrl] = useState("");
  const [connected, setConnected] = useState(false);
  const [classActivities, setClassActivities] = useState([]);
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem("qaoToken");
  const config = { headers: { Authorization: `Bearer ${token}` } };

  // Fetch recent class activities when connected
  useEffect(() => {
    if (!connected) return;
    
    const fetchActivities = async () => {
      setLoading(true);
      try {
        const res = await apiClient.get("/qao/class-activities", config);
        setClassActivities(Array.isArray(res.data?.activities) ? res.data.activities : []);
      } catch (err) {
        console.error("Failed to fetch class activities:", err);
        setClassActivities([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchActivities();
  }, [connected, token]);

  const handleConnect = () => {
    if (!moodleUrl.trim()) {
      alert("Please enter a Moodle URL");
      return;
    }
    // Store the Moodle connection URL
    localStorage.setItem("moodleUrl", moodleUrl);
    setConnected(true);
  };

  const handleDisconnect = () => {
    localStorage.removeItem("moodleUrl");
    setMoodleUrl("");
    setConnected(false);
    setClassActivities([]);
  };

  const openMoodle = () => {
    const url = localStorage.getItem("moodleUrl") || moodleUrl;
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="space-y-6">
      {/* Moodle Connection Card */}
      <Card className="shadow-2xl border border-slate-200 bg-white/95">
        <CardHeader>
          <CardTitle className="text-xl text-slate-900 flex items-center gap-2">
            <Monitor className="w-5 h-5 text-blue-600" />
            Moodle Integration
          </CardTitle>
          <CardDescription>
            Connect to your Moodle instance to monitor online class activities, 
            assignments, and student progress in real time.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!connected ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Moodle Instance URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="https://moodle.yourschool.com"
                    value={moodleUrl}
                    onChange={(e) => setMoodleUrl(e.target.value)}
                    className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900"
                  />
                  <Button 
                    onClick={handleConnect}
                    className="rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-6 shadow-lg"
                  >
                    <Link className="mr-2 h-4 w-4" /> Connect
                  </Button>
                </div>
              </div>
              <p className="text-xs text-slate-400">
                Enter your Moodle instance URL to connect and start monitoring classes.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-xl bg-emerald-50 border border-emerald-200 p-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                  <div>
                    <p className="font-semibold text-emerald-800">Connected to Moodle</p>
                    <p className="text-sm text-emerald-600">{localStorage.getItem("moodleUrl") || moodleUrl}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={openMoodle}
                    className="rounded-xl bg-blue-600 text-white px-4"
                  >
                    <ExternalLink className="mr-2 h-4 w-4" /> Open Moodle
                  </Button>
                  <Button 
                    onClick={handleDisconnect}
                    variant="outline"
                    className="rounded-xl border border-rose-200 text-rose-600 px-4"
                  >
                    Disconnect
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Online Class Activities */}
      <Card className="shadow-2xl border border-slate-200 bg-white/95">
        <CardHeader>
          <CardTitle className="text-xl text-slate-900 flex items-center gap-2">
            <Activity className="w-5 h-5 text-violet-600" />
            Online Class Activities
          </CardTitle>
          <CardDescription>
            Recent activity across all online classes — assignments, quizzes, 
            and session logs.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600" />
            </div>
          ) : classActivities.length > 0 ? (
            <div className="space-y-4">
              {classActivities.map((activity, idx) => (
                <motion.div
                  key={activity._id || idx}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      {activity.type === "quiz" ? (
                        <BookOpen className="w-5 h-5 text-amber-500 mt-0.5" />
                      ) : activity.type === "live" ? (
                        <Video className="w-5 h-5 text-blue-500 mt-0.5" />
                      ) : (
                        <Play className="w-5 h-5 text-emerald-500 mt-0.5" />
                      )}
                      <div>
                        <p className="font-semibold text-slate-900">
                          {activity.title || "Class Activity"}
                        </p>
                        <p className="text-sm text-slate-500 mt-1">
                          {activity.description || "No description available"}
                        </p>
                        <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-400">
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {activity.participants || 0} participants
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {activity.date ? new Date(activity.date).toLocaleDateString() : "N/A"}
                          </span>
                          {activity.duration && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {activity.duration} min
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      activity.status === "active" 
                        ? "bg-emerald-100 text-emerald-700" 
                        : activity.status === "completed"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-slate-100 text-slate-600"
                    }`}>
                      {activity.status === "active" ? "Live" : activity.status === "completed" ? "Done" : "Scheduled"}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-10 text-center">
              <Activity className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">No recent activities</p>
              <p className="text-sm text-slate-400 mt-1">
                {connected 
                  ? "Activities from connected classes will appear here."
                  : "Connect to Moodle above to start monitoring class activities."}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <QuickStat 
          icon={<Video className="w-4 h-4" />} 
          label="Live Classes" 
          value={classActivities.filter(a => a.status === "active").length.toString()} 
          color="from-blue-500 to-cyan-500" 
        />
        <QuickStat 
          icon={<BookOpen className="w-4 h-4" />} 
          label="Quizzes" 
          value={classActivities.filter(a => a.type === "quiz").length.toString()} 
          color="from-amber-500 to-orange-500" 
        />
        <QuickStat 
          icon={<Users className="w-4 h-4" />} 
          label="Total Participants" 
          value={classActivities.reduce((sum, a) => sum + (a.participants || 0), 0).toString()} 
          color="from-violet-500 to-fuchsia-500" 
        />
        <QuickStat 
          icon={<CheckCircle className="w-4 h-4" />} 
          label="Completed" 
          value={classActivities.filter(a => a.status === "completed").length.toString()} 
          color="from-emerald-500 to-teal-500" 
        />
      </div>
    </div>
  );
}

const QuickStat = ({ icon, label, value, color }) => (
  <motion.div 
    whileHover={{ y: -3 }}
    className={`rounded-xl border border-white/80 bg-gradient-to-br ${color} p-4 text-white shadow-lg`}
  >
    <div className="flex items-center justify-between mb-2">
      <p className="text-xs font-semibold uppercase tracking-wider text-white/80">{label}</p>
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20 text-white">
        {icon}
      </div>
    </div>
    <p className="text-2xl font-bold tracking-tight">{value || "0"}</p>
  </motion.div>
);