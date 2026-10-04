/* ================================
   Delete Modal — long-press menu
   ================================ */

.delete-modal {
  position: fixed;
  inset: 0;
  z-index: 1100;
  display: none;
  align-items: flex-end;
  justify-content: center;
  padding: 20px;
}

.delete-modal.show {
  display: flex;
}

@media (min-width: 700px) {
  .delete-modal {
    align-items: center;
  }
}

.delete-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.delete-card {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 400px;
  background: linear-gradient(180deg, rgba(10, 15, 26, 0.98), rgba(7, 11, 20, 1));
  border: 1px solid var(--border);
  border-radius: 20px;
  padding: 20px 16px 14px;
  box-shadow:
    0 0 0 1px rgba(0, 183, 255, 0.12),
    0 20px 60px rgba(0, 0, 0, 0.7);
  animation: slideUp 0.25s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.delete-title {
  text-align: center;
  font-size: 14px;
  color: var(--muted);
  letter-spacing: 0.8px;
  text-transform: uppercase;
  font-weight: 600;
  margin-bottom: 14px;
}

.delete-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
}

.delete-option {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
  background: rgba(20, 28, 48, 0.6);
  border: 1px solid var(--border);
  border-radius: 12px;
  color: var(--text);
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
  font-family: inherit;
  font-size: inherit;
  width: 100%;
}

.delete-option:hover {
  background: rgba(0, 183, 255, 0.08);
  border-color: rgba(0, 183, 255, 0.3);
}

.delete-option.danger:hover {
  background: rgba(255, 45, 85, 0.08);
  border-color: rgba(255, 45, 85, 0.4);
}

.delete-icon {
  font-size: 20px;
  flex-shrink: 0;
  line-height: 1;
}

.delete-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.delete-text strong {
  font-size: 14.5px;
  font-weight: 600;
  color: var(--text);
}

.delete-text small {
  font-size: 12px;
  color: var(--muted);
}

.delete-option.danger .delete-text strong {
  color: var(--eye);
}

.delete-cancel {
  width: 100%;
  padding: 12px;
  background: transparent;
  border: 1px solid var(--border);
  border-radius: 12px;
  color: var(--muted);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: inherit;
  letter-spacing: 0.5px;
}

.delete-cancel:hover {
  color: var(--text);
  border-color: var(--text);
}

/* Mobile */
@media (max-width: 480px) {
  .delete-card {
    padding: 18px 14px 12px;
    border-radius: 18px;
  }

  .delete-option {
    padding: 12px 14px;
  }

  .delete-icon {
    font-size: 18px;
  }

  .delete-text strong {
    font-size: 14px;
  }

  .delete-text small {
    font-size: 11.5px;
  }
                              }
