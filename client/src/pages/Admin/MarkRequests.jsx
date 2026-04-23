import React, { useEffect, useState } from "react";

const API_BASE = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:8000`;

export default function MarkRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState("all");

  // Modals state
  const [approveModal, setApproveModal] = useState({ open: false, id: null });
  const [rejectModal, setRejectModal] = useState({ open: false, id: null, reason: "" });

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/admin/mark-requests`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const data = await res.json();
      if (data.ok) {
        setRequests(data.data);
      } else {
        showToast("err", data.message || "Failed to fetch requests");
      }
    } catch (e) {
      showToast("err", e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const openApprove = (id) => setApproveModal({ open: true, id });
  const closeApprove = () => setApproveModal({ open: false, id: null });
  
  const openReject = (id) => setRejectModal({ open: true, id, reason: "" });
  const closeReject = () => setRejectModal({ open: false, id: null, reason: "" });

  const confirmApprove = async () => {
    const { id } = approveModal;
    if (!id) return;
    try {
      const res = await fetch(`${API_BASE}/api/admin/mark-requests/${id}/approve`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`
        }
      });
      const data = await res.json();
      if (data.ok) {
        showToast("ok", "Request approved successfully");
        fetchRequests();
      } else {
        showToast("err", data.message || "Failed to approve request");
      }
    } catch (e) {
      showToast("err", e.message);
    } finally {
      closeApprove();
    }
  };

  const confirmReject = async () => {
    const { id, reason } = rejectModal;
    if (!id) return;
    if (!reason.trim()) {
      showToast("err", "A reason is required to reject a request.");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/admin/mark-requests/${id}/reject`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({ admin_comment: reason })
      });
      const data = await res.json();
      if (data.ok) {
        showToast("ok", "Request rejected successfully & staff notified.");
        fetchRequests();
      } else {
        showToast("err", data.message || "Failed to reject request");
      }
    } catch (e) {
      showToast("err", e.message);
    } finally {
      closeReject();
    }
  };

  const filteredRequests = requests.filter(r => {
    if (statusFilter === "all") return true;
    return r.approval_status === statusFilter;
  });

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto dark:text-gray-200">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 p-4 rounded-xl shadow-2xl z-[9999] text-white flex items-center gap-3 transition-all transform duration-300 font-semibold ${toast.type === "ok" ? "bg-green-600" : "bg-red-600"}`}>
          {toast.type === "ok" ? "✅" : "⚠️"} {toast.msg}
        </div>
      )}
      
      {/* Header and Filter */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-black dark:text-white tracking-tight">Mark Edit Requests</h2>
          <p className="text-gray-500 text-sm mt-1">Review, approve or reject mark changes updated by staff members.</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-sm font-bold text-gray-500 dark:text-gray-400">Filter Status:</label>
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 text-sm font-bold bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
           id="markrequests-select-1">
            <option value="all">All Requests</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50/50 dark:bg-gray-900/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-black text-gray-500 tracking-wider">Exam Info</th>
                <th className="px-6 py-4 text-left text-xs font-black text-gray-500 tracking-wider">Student</th>
                <th className="px-6 py-4 text-left text-xs font-black text-gray-500 tracking-wider">Requested By</th>
                <th className="px-6 py-4 text-left text-xs font-black text-gray-500 tracking-wider text-center">Marks Update</th>
                <th className="px-6 py-4 text-left text-xs font-black text-gray-500 tracking-wider text-center">Status</th>
                <th className="px-6 py-4 text-right text-xs font-black text-gray-500 tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-100 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-10 text-center font-semibold text-gray-500">Loading requests...</td>
                </tr>
              ) : filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-10 text-center font-semibold text-gray-400">No requests found for this filter.</td>
                </tr>
              ) : (
                filteredRequests.map((r) => {
                  const status = r.approval_status;
                  return (
                    <tr key={r.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/20 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-900 dark:text-white text-[13px]">{r.exam_title}</div>
                        <div className="text-gray-500 text-xs mt-1">{r.subject_name}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-900 dark:text-gray-200 text-[13px]">{r.student_name}</div>
                        <div className="text-gray-500 text-xs mt-1">{r.student_email || r.student_id}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-900 dark:text-gray-200 text-[13px]">{r.staff_name || "Unknown"}</div>
                        <div className="text-gray-500 text-xs mt-1">{r.staff_email}</div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center space-x-3">
                           <span className="bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-3 py-1 rounded-lg line-through text-xs font-black">{r.current_marks}</span>
                           <span className="text-gray-400 text-xs font-black">➔</span>
                           <span className="bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 px-3 py-1 rounded-lg text-sm font-black ring-1 ring-orange-500/30">{r.requested_marks}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {status === "pending" && <span className="inline-block px-3 py-1 rounded-full bg-yellow-100 text-yellow-800 text-[11px] font-black uppercase tracking-wider">Pending</span>}
                        {status === "approved" && <span className="inline-block px-3 py-1 rounded-full bg-green-100 text-green-800 text-[11px] font-black uppercase tracking-wider">Approved</span>}
                        {status === "rejected" && <span className="inline-block px-3 py-1 rounded-full bg-red-100 text-red-800 text-[11px] font-black uppercase tracking-wider">Rejected</span>}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {status === "pending" ? (
                          <div className="flex justify-end gap-2">
                            <button onClick={() => openApprove(r.id)} className="text-white bg-green-600 hover:bg-green-700 px-3 py-1.5 rounded-lg text-xs font-black transition-colors shadow-sm" id="markrequests-button-1">Approve</button>
                            <button onClick={() => openReject(r.id)} className="text-white bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded-lg text-xs font-black transition-colors shadow-sm" id="markrequests-button-2">Reject</button>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs font-bold uppercase tracking-widest block mt-1">- Processed -</span>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* APPROVE MODAL */}
      {approveModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
             <div className="p-6">
                <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
                   <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                </div>
                <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">Approve Request?</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium leading-relaxed">
                  Are you sure you want to approve this mark override? The new marks will become permanent and immediately visible to the student.
                </p>
             </div>
             <div className="bg-gray-50 dark:bg-gray-900/50 px-6 py-4 flex justify-end gap-3 border-t border-gray-100 dark:border-gray-700">
                <button onClick={closeApprove} className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition" id="markrequests-button-3">Cancel</button>
                <button onClick={confirmApprove} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-green-600/30 transition" id="markrequests-button-4">Yes, Approve</button>
             </div>
          </div>
        </div>
      )}

      {/* REJECT MODAL */}
      {rejectModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
             <div className="p-6">
                <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
                   <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                </div>
                <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">Reject Request</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium leading-relaxed mb-4">
                  Please provide a reason for rejecting this mark edit. The staff member will receive an automated email detailing your explanation.
                </p>
                <textarea
                   className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-3 text-sm font-medium text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                   rows="3"
                   placeholder="Type the valid reason here..."
                   value={rejectModal.reason}
                   onChange={(e) => setRejectModal({ ...rejectModal, reason: e.target.value })}
                 id="markrequests-textarea-1"></textarea>
             </div>
             <div className="bg-gray-50 dark:bg-gray-900/50 px-6 py-4 flex justify-end gap-3 border-t border-gray-100 dark:border-gray-700">
                <button onClick={closeReject} className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition" id="markrequests-button-5">Cancel</button>
                <button onClick={confirmReject} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-red-600/30 transition" id="markrequests-button-6">Reject & Notifiy</button>
             </div>
          </div>
        </div>
      )}

    </div>
  );
}
