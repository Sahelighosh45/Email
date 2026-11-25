// src/pages/EmailDetail.tsx - CORRECTED
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api, ApiError } from "../services/api";
import type { Email } from "../types/email";
import styles from "./EmailDetail.module.css";

const EmailDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { token, logout } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState<Email | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id || !token) return;

    const fetchEmail = async () => {
      try {
        const data = await api.getEmailDetail(token, id);
        setEmail(data);
      } catch (err: unknown) {
        if (err instanceof ApiError && err.status === 401) {
          logout();
          navigate("/login", { replace: true });
          return;
        }
        setError(err instanceof Error ? err.message : "Failed to load email");
      } finally {
        setLoading(false);
      }
    };

    fetchEmail();
  }, [id, token, logout, navigate]);

  if (loading) return <div className={styles.loading}>Loading…</div>;

  if (error || !email) {
    return (
      <div className={styles.error}>
        <p>{error || "Email not found"}</p>
        <button onClick={() => navigate("/dashboard")}>Back</button>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {/* TOP BAR */}
      <div className={styles.topBar}>
        <button className={styles.backBtn} onClick={() => navigate(-1)}>
          ←
        </button>

        <h2 className={styles.title}>{email.subject}</h2>

        <span
          className={`${styles.status} ${
            email.status === "SENT"
              ? styles.sent
              : email.status === "SCHEDULED"
              ? styles.scheduled
              : styles.failed
          }`}
        >
          {email.status}
        </span>
      </div>

      {/* META */}
      <div className={styles.meta}>
        <div className={styles.avatar}>
          {email.from.charAt(0).toUpperCase()}
        </div>

        <div className={styles.metaText}>
          <div className={styles.from}>{email.from}</div>
          <div className={styles.to}>
            to {email.to.join(", ")}
          </div>
        </div>

        <div className={styles.time}>
          {new Date(
            email.scheduleAt || email.createdAt
          ).toLocaleString()}
        </div>
      </div>

      {/* BODY */}
      <div className={styles.body}>
        {email.body.split("\n").map((line, i) => (
          <p key={i}>{line}</p>
        ))}
      </div>
    </div>
  );
};

export default EmailDetail;