// src/components/EmailItem/EmailItem.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './EmailItem.module.css';

interface EmailItemProps {
  id: string;
  to: string[];
  subject: string;
  body: string;
  status: 'SENT' | 'SCHEDULED';
  scheduleAt?: string;
  createdAt: string;
}

const EmailItem: React.FC<EmailItemProps> = ({
  id,
  to,
  subject,
  body,
  status,
  scheduleAt,
  createdAt
}) => {
  const navigate = useNavigate();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Today ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString('en-US', { 
        weekday: 'short', 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    }
  };

  const handleClick = () => {
    navigate(`/email/${id}`);
  };

  return (
    <div className={styles.emailItem} onClick={handleClick}>
      <div className={styles.emailHeader}>
        <div>
          <div className={styles.recipient}>
            To: <span>{to.join(', ')}</span>
          </div>
          <div className={styles.subject}>{subject}</div>
        </div>
        <div className={`${styles.statusBadge} ${status === 'SENT' ? styles.statusSent : styles.statusScheduled}`}>
          {status === 'SENT' ? 'Sent' : 'Scheduled'}
        </div>
      </div>

      <div className={styles.preview}>
        {body.length > 100 ? `${body.substring(0, 100)}...` : body}
      </div>

      <div className={styles.emailMeta}>
        <div className={styles.dateTime}>
          {formatDate(status === 'SCHEDULED' && scheduleAt ? scheduleAt : createdAt)}
        </div>
      </div>
    </div>
  );
};

export default EmailItem;