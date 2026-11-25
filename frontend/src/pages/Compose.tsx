import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api, ApiError } from "../services/api";
import type { BulkEmailPayload } from "../types/email";
import styles from "./Compose.module.css";

const Compose: React.FC = () => {
  const navigate = useNavigate();
  const { user, token, isAuthenticated, logout } = useAuth();
  
  // Form state
  const [emails, setEmails] = useState<string[]>([]);
  const [emailInput, setEmailInput] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [delayBetweenEmails, setDelayBetweenEmails] = useState<number>(0);
  const [hourlyLimit, setHourlyLimit] = useState<number>(0);
  
  // Schedule state
  const [scheduleType, setScheduleType] = useState<"now" | "custom">("now");
  const [scheduleDate, setScheduleDate] = useState<string>("");
  const [scheduleTime, setScheduleTime] = useState<string>("");
  const [predefinedTime, setPredefinedTime] = useState<string>("");
  
  // UI state
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  /* =========================
     AUTH CHECK & REDIRECT
  ========================= */
  useEffect(() => {
    if (!isAuthenticated || !token) {
      navigate("/login");
    }
  }, [isAuthenticated, token, navigate]);

  /* =========================
     SIMPLE EMAIL HANDLERS
  ========================= */
  const handleAddEmail = (): void => {
    const trimmed = emailInput.trim();
    
    // SIMPLE VALIDATION - Just check if not empty
    if (!trimmed) {
      setError("Please enter an email");
      return;
    }
    
    // Accept ANY text as email
    if (!emails.includes(trimmed)) {
      setEmails([...emails, trimmed]);
      setEmailInput("");
      setError("");
    } else {
      setError("Email already added");
    }
  };

  const handleRemoveEmail = (index: number): void => {
    setEmails(emails.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === "Enter" || e.key === "," || e.key === " ") {
      e.preventDefault();
      handleAddEmail();
    }
  };

  /* =========================
     SCHEDULE HANDLERS
  ========================= */
  const handlePredefinedTimeSelect = (time: string): void => {
    setPredefinedTime(time);
    setScheduleType("custom");
    
    // Set date to tomorrow for predefined times
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];
    setScheduleDate(dateStr);
    
    // Set time based on selection
    const timeMap: Record<string, string> = {
      "Tomorrow, 10:00 AM": "10:00",
      "Tomorrow, 11:00 AM": "11:00", 
      "Tomorrow, 3:00 PM": "15:00"
    };
    setScheduleTime(timeMap[time] || "10:00");
  };

  /* =========================
     DATE/TIME HELPERS
  ========================= */
  const getMinDate = (): string => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const getDefaultTime = (): string => {
    const now = new Date();
    now.setHours(now.getHours() + 1);
    return `${now.getHours().toString().padStart(2, '0')}:00`;
  };

  /* =========================
     SUBMIT HANDLER
  ========================= */
  const handleSendLater = async (): Promise<void> => {
    // SIMPLE VALIDATION
    if (emails.length === 0) {
      setError("Please add at least one recipient");
      return;
    }

    if (!subject.trim()) {
      setError("Please enter a subject");
      return;
    }

    if (!body.trim()) {
      setError("Please enter email body");
      return;
    }

    // Check authentication
    if (!isAuthenticated || !token) {
      setError("Please login first");
      navigate("/login");
      return;
    }

    // Calculate schedule time
    let scheduleAt: string;
    if (scheduleType === "now") {
      scheduleAt = new Date().toISOString();
    } else {
      if (!scheduleDate || !scheduleTime) {
        setError("Please select date and time");
        return;
      }
      scheduleAt = new Date(`${scheduleDate}T${scheduleTime}`).toISOString();
    }

    const payload: BulkEmailPayload = {
  emails: emails,   
  subject,
  body,
  scheduleAt,
  hourlyLimit,
  delayBetweenEmails,
};
    // Submit
    try {
      setLoading(true);
      setError("");
      
      const response = await api.scheduleBulk(token, payload);
      
      if (response.success) {
        // Reset form
        setEmails([]);
        setSubject("");
        setBody("");
        setDelayBetweenEmails(0);
        setHourlyLimit(0);
        setScheduleType("now");
        setScheduleDate("");
        setScheduleTime("");
        setPredefinedTime("");
        
        // Redirect to dashboard
        navigate("/dashboard");
      } else {
        throw new Error("Failed to schedule campaign");
      }
    } catch (err: unknown) {
      if (err instanceof ApiError && err.status === 401) {
        logout();
        navigate("/login", { replace: true });
        return;
      }
      console.error("Scheduling error:", err);
      setError(err instanceof Error ? err.message : "Failed to schedule campaign");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = (): void => {
    setEmails([]);
    setSubject("");
    setBody("");
    setDelayBetweenEmails(0);
    setHourlyLimit(0);
    setError("");
    navigate("/dashboard");
  };

  // If not authenticated, show loading
  if (!isAuthenticated || !user) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingState}>
          <div className={styles.spinner}></div>
          <p>Checking authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.header}>Compose New Email</h1>

      {/* Error Message */}
      {error && (
        <div className={styles.errorAlert}>
          <span className={styles.errorIcon}>⚠️</span>
          {error}
          <button 
            className={styles.errorClose}
            onClick={() => setError("")}
          >
            ×
          </button>
        </div>
      )}

      {/* From Section */}
      <div className={styles.formSection}>
        <label className={styles.label}>From</label>
        <div className={styles.fromValue}>
          {user.email}
          {user.name && (
            <div className={styles.userName}>{user.name}</div>
          )}
        </div>
      </div>

      {/* To Section */}
      <div className={styles.formSection}>
        <label className={styles.label}>To</label>
        <div className={styles.emailInputContainer}>
          <input
            type="text"
            placeholder="Enter recipient email"
            value={emailInput}
            onChange={(e) => {
              setEmailInput(e.target.value);
              setError("");
            }}
            onKeyDown={handleKeyDown}
            className={styles.inputField}
            disabled={loading}
          />
          <button
            type="button"
            onClick={handleAddEmail}
            className={styles.addButton}
            disabled={loading}
          >
            Add
          </button>
        </div>
        
        {/* Email Chips */}
        {emails.length > 0 && (
          <div className={styles.toContainer}>
            {emails.slice(0, 3).map((email, index) => (
              <div key={index} className={styles.emailChip}>
                {email}
                <button
                  type="button"
                  onClick={() => handleRemoveEmail(index)}
                  className={styles.removeChipBtn}
                  disabled={loading}
                  aria-label={`Remove ${email}`}
                >
                  ×
                </button>
              </div>
            ))}
            {emails.length > 3 && (
              <div className={styles.addMoreChip}>
                +{emails.length - 3} more
              </div>
            )}
          </div>
        )}
      </div>

      {/* Subject */}
      <div className={styles.formSection}>
        <label className={styles.label}>Subject</label>
        <input
          type="text"
          placeholder="Enter email subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className={styles.inputField}
          disabled={loading}
        />
      </div>

      {/* Delay & Limit */}
      <div className={styles.formSection}>
        <div className={styles.numberInputsRow}>
          <div>
            <label className={styles.label}>Delay between 2 emails (minutes)</label>
            <input
              type="number"
              min="0"
              max="60"
              value={delayBetweenEmails}
              onChange={(e) => setDelayBetweenEmails(Math.max(0, parseInt(e.target.value) || 0))}
              className={styles.numberInput}
              disabled={loading}
            />
          </div>
          <div>
            <label className={styles.label}>Hourly Limit (0 = no limit)</label>
            <input
              type="number"
              min="0"
              value={hourlyLimit}
              onChange={(e) => setHourlyLimit(Math.max(0, parseInt(e.target.value) || 0))}
              className={styles.numberInput}
              disabled={loading}
            />
          </div>
        </div>
      </div>

      {/* Email Body */}
      <div className={styles.formSection}>
        <label className={styles.label}>Type Your Reply...</label>
        <textarea
          placeholder="Write your email content here..."
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className={styles.bodyTextarea}
          disabled={loading}
          rows={8}
        />
      </div>

      {/* Schedule Section */}
      <div className={styles.scheduleSection}>
        <div className={styles.scheduleHeader}>Pick date & time</div>
        
        <div className={styles.scheduleButtons}>
          <button
            type="button"
            className={`${styles.scheduleBtn} ${scheduleType === "now" ? styles.active : ""}`}
            onClick={() => setScheduleType("now")}
            disabled={loading}
          >
            Now
          </button>
          <button
            type="button"
            className={`${styles.scheduleBtn} ${scheduleType === "custom" ? styles.active : ""}`}
            onClick={() => {
              setScheduleType("custom");
              if (!scheduleDate) {
                setScheduleDate(getMinDate());
              }
              if (!scheduleTime) {
                setScheduleTime(getDefaultTime());
              }
            }}
            disabled={loading}
          >
            Custom
          </button>
        </div>

        {scheduleType === "custom" && (
          <>
            {/* Predefined Times */}
            <div className={styles.scheduleButtons}>
              {["Tomorrow, 10:00 AM", "Tomorrow, 11:00 AM", "Tomorrow, 3:00 PM"].map((time) => (
                <button
                  key={time}
                  type="button"
                  className={`${styles.scheduleBtn} ${predefinedTime === time ? styles.active : ""}`}
                  onClick={() => handlePredefinedTimeSelect(time)}
                  disabled={loading}
                >
                  {time}
                </button>
              ))}
            </div>

            {/* Custom Date/Time Inputs */}
            <div className={styles.dateTimeInputs}>
              <div>
                <label className={styles.label}>Date</label>
                <input
                  type="date"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  className={styles.inputField}
                  min={getMinDate()}
                  disabled={loading}
                />
              </div>
              <div>
                <label className={styles.label}>Time</label>
                <input
                  type="time"
                  value={scheduleTime}
                  onChange={(e) => setScheduleTime(e.target.value)}
                  className={styles.inputField}
                  disabled={loading}
                />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Action Buttons */}
      <div className={styles.actionButtons}>
        <button
          type="button"
          onClick={handleCancel}
          className={styles.cancelBtn}
          disabled={loading}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSendLater}
          className={styles.sendLaterBtn}
          disabled={loading || emails.length === 0 || !subject.trim() || !body.trim()}
        >
          {loading ? (
            <>
              <span className={styles.spinnerSmall}></span>
              Scheduling...
            </>
          ) : (
            "Send Later"
          )}
        </button>
      </div>
    </div>
  );
};

export default Compose;