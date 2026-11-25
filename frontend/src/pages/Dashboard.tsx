// src/pages/Dashboard.tsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import EmailItem from "../components/EmailItem";
import { api, ApiError } from "../services/api";
import type { Email } from "../types/email";
import styles from "./Dashboard.module.css";

const Dashboard: React.FC = () => {
  const { token, logout } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<"scheduled" | "sent">("scheduled");
  const [searchQuery, setSearchQuery] = useState("");
  const [emails, setEmails] = useState<Email[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* =========================
     FETCH EMAILS (REUSABLE)
  ========================= */
  const fetchEmails = useCallback(async () => {
    if (!token) return;

    try {
      const data = await api.getEmails(token);
      const allEmails: Email[] = [...data.scheduled, ...data.sent];
      setEmails(allEmails);
      setError(null);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        logout();
        navigate("/login", { replace: true });
        return;
      }
      console.error("Failed to fetch emails", err);
      setError("Failed to load emails. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [token, logout, navigate]);

  /* =========================
     INITIAL LOAD + POLLING
  ========================= */
  useEffect(() => {
    const timeout = setTimeout(() => {
      void fetchEmails();
    }, 0);

    const interval = setInterval(() => {
      void fetchEmails();
    }, 5000);

    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, [fetchEmails]);

  /* =========================
     FILTERING
  ========================= */
  const filteredEmails = useMemo(() => {
    let filtered = emails.filter(
      (email) =>
        email.status === (activeTab === "scheduled" ? "SCHEDULED" : "SENT")
    );

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (email) =>
          email.subject.toLowerCase().includes(q) ||
          email.body.toLowerCase().includes(q) ||
          email.to.some((r) => r.toLowerCase().includes(q))
      );
    }

    return filtered;
  }, [emails, activeTab, searchQuery]);

  const scheduledCount = emails.filter((e) => e.status === "SCHEDULED").length;
  const sentCount = emails.filter((e) => e.status === "SENT").length;

  /* =========================
     LOADING / ERROR
  ========================= */
  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p>Loading emails...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.dashboard}>
        <Sidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          scheduledCount={scheduledCount}
          sentCount={sentCount}
        />
        <div style={{ marginLeft: "280px", padding: "40px" }}>
          <h3>Error</h3>
          <p>{error}</p>
          <button onClick={fetchEmails}>Retry</button>
        </div>
      </div>
    );
  }


  return (
    <div className={styles.dashboard}>
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        scheduledCount={scheduledCount}
        sentCount={sentCount}
      />

      <Topbar
        title={activeTab === "scheduled" ? "Scheduled Emails" : "Sent Emails"}
        onSearch={setSearchQuery}
      />

      <div className={styles.mainContent}>
        {filteredEmails.length ? (
          filteredEmails.map((email) => (
            <EmailItem key={email.id} {...email} />
          ))
        ) : (
          <div className={styles.emptyState}>No emails found</div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
