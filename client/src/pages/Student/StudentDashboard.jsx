import React from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";

export default function StudentDashboard() {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path) =>
    location.pathname === path || location.pathname.startsWith(path + "/");

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("user");
    navigate("/");
  };

  return (
    <div style={styles.root}>
      {/* SIDEBAR */}
      <aside style={styles.sidebar}>
        <div style={styles.brandWrap}>
          <div style={styles.brandTitle}>UniExam</div>
          <div style={styles.brandSub}>Student Panel</div>
        </div>

        <nav style={styles.nav}>
          <Link
            to="/student"
            style={{
              ...styles.navItem,
              ...(location.pathname === "/student"
                ? styles.navItemActive
                : {}),
            }}
          >
            Dashboard
          </Link>

          <Link
            to="/student/exam-notice"
            style={{
              ...styles.navItem,
              ...(isActive("/student/exam-notice")
                ? styles.navItemActive
                : {}),
            }}
          >
            Exam Notice
          </Link>

          <Link
            to="/student/attempt"
            style={{
              ...styles.navItem,
              ...(isActive("/student/attempt")
                ? styles.navItemActive
                : {}),
            }}
          >
            Attempt the Exam
          </Link>

          <Link
            to="/student/results"
            style={{
              ...styles.navItem,
              ...(isActive("/student/results")
                ? styles.navItemActive
                : {}),
            }}
          >
            View Results
          </Link>

          <Link
            to="/student/feedback"
            style={{
              ...styles.navItem,
              ...(isActive("/student/feedback")
                ? styles.navItemActive
                : {}),
            }}
          >
            Feedback
          </Link>
        </nav>

        <button onClick={handleLogout} style={styles.logoutBtn}>
          Logout
        </button>
      </aside>

      {/* MAIN CONTENT */}
      <main style={styles.main}>
        {/* Top Bar */}
        <section style={styles.topBar}>
          <div>
            <div style={styles.welcomeTitle}>Welcome, Student</div>
            <div style={styles.welcomeSub}>
              View exam notices, attempt exams, check results, and send feedback
            </div>
          </div>
          <div style={styles.roleBadge}>Role: student</div>
        </section>

        {/* Dashboard Cards (only when exact /student) */}
        {location.pathname === "/student" && (
          <>
            <section style={styles.card}>
              <div style={styles.cardHeader}>
                <div style={styles.cardTitle}>Student Dashboard</div>
                <div style={styles.cardDesc}>
                  Choose a section to continue.
                </div>
              </div>

              <div style={styles.cardsRow}>
                <Link to="/student/exam-notice" style={styles.actionCard}>
                  <div style={styles.actionTitle}>Exam Notice</div>
                  <div style={styles.actionSub}>
                    See upcoming exams & announcements
                  </div>
                </Link>

                <Link to="/student/attempt" style={styles.actionCard}>
                  <div style={styles.actionTitle}>Attempt the Exam</div>
                  <div style={styles.actionSub}>
                    Start your assigned exams
                  </div>
                </Link>

                <Link to="/student/results" style={styles.actionCard}>
                  <div style={styles.actionTitle}>View Results</div>
                  <div style={styles.actionSub}>
                    Check marks & performance
                  </div>
                </Link>

                <Link to="/student/feedback" style={styles.actionCard}>
                  <div style={styles.actionTitle}>Feedback</div>
                  <div style={styles.actionSub}>
                    Send your feedback to staff/admin
                  </div>
                </Link>
              </div>
            </section>
          </>
        )}

        {/* ✅ Outlet ALWAYS render */}
        <div style={styles.outletWrap}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}

/* ================= STYLES ================= */

const styles = {
  root: {
    minHeight: "100vh",
    display: "flex",
    background: "#f6f7fb",
    fontFamily:
      "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica",
  },

  sidebar: {
    width: 260,
    background: "#ffffff",
    borderRight: "1px solid #e8e8ee",
    padding: 18,
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },

  brandWrap: {
    padding: "6px 4px 10px",
  },

  brandTitle: {
    fontSize: 22,
    fontWeight: 800,
    color: "#1f4fff",
  },

  brandSub: {
    fontSize: 13,
    color: "#6b7280",
    fontWeight: 600,
  },

  nav: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },

  navItem: {
    textDecoration: "none",
    padding: "12px 14px",
    borderRadius: 8,
    border: "1px solid #e8e8ee",
    color: "#1f2937",
    fontWeight: 700,
  },

  navItemActive: {
    background: "#1f4fff",
    borderColor: "#1f4fff",
    color: "#ffffff",
  },

  logoutBtn: {
    marginTop: "auto",
    padding: "12px 14px",
    borderRadius: 8,
    border: "none",
    background: "#dc2626",
    color: "#ffffff",
    fontWeight: 800,
    cursor: "pointer",
  },

  main: {
    flex: 1,
    padding: 22,
  },

  topBar: {
    background: "#ffffff",
    border: "1px solid #e8e8ee",
    borderRadius: 12,
    padding: 18,
    display: "flex",
    justifyContent: "space-between",
  },

  welcomeTitle: {
    fontSize: 20,
    fontWeight: 900,
  },

  welcomeSub: {
    fontSize: 13.5,
    color: "#6b7280",
    fontWeight: 600,
  },

  roleBadge: {
    fontSize: 12,
    fontWeight: 800,
    color: "#6b7280",
  },

  card: {
    marginTop: 18,
    background: "#ffffff",
    border: "1px solid #e8e8ee",
    borderRadius: 12,
    padding: 18,
  },

  cardHeader: {
    marginBottom: 14,
  },

  cardTitle: {
    fontSize: 18,
    fontWeight: 900,
  },

  cardDesc: {
    fontSize: 13.5,
    color: "#6b7280",
  },

  cardsRow: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: 14,
  },

  actionCard: {
    textDecoration: "none",
    border: "1px solid #e8e8ee",
    borderRadius: 12,
    padding: 16,
    color: "#111827",
  },

  actionTitle: {
    fontSize: 16,
    fontWeight: 900,
  },

  actionSub: {
    marginTop: 6,
    fontSize: 13,
    color: "#6b7280",
  },

  outletWrap: {
    marginTop: 18,
  },
};
