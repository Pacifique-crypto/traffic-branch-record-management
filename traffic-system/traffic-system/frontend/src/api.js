const BASE_URL = process.env.REACT_APP_API_URL || "https://traffic-branch-backend.onrender.com/api";


const getHeaders = () => ({
  "Content-Type": "application/json",
  ...(localStorage.getItem("token")
    ? { Authorization: `Bearer ${localStorage.getItem("token")}` }
    : {}),
});

export const getAccidents = async (search = "", severity = "All") => {
  const res = await fetch(
    `${BASE_URL}/accidents?search=${search}&severity=${severity}`,
    { headers: getHeaders() }
  );
  return res.json();
};

export const getAccidentById = async (id) => {
  const res = await fetch(`${BASE_URL}/accidents/${id}`, { headers: getHeaders() });
  return res.json();
};

export const createAccident = async (data) => {
  const res = await fetch(`${BASE_URL}/accidents`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  return res.json();
};

export const updateAccident = async (id, data) => {
  const res = await fetch(`${BASE_URL}/accidents/${id}`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  return res.json();
};

export const deleteAccident = async (id) => {
  const res = await fetch(`${BASE_URL}/accidents/${id}`, {
    method: "DELETE",
    headers: getHeaders(),
  });
  return res.json();
};

export const getViolations = async (search = "", status = "All") => {
  const res = await fetch(
    `${BASE_URL}/violations?search=${search}&status=${status}`,
    { headers: getHeaders() }
  );
  return res.json();
};

export const getViolationById = async (id) => {
  const res = await fetch(`${BASE_URL}/violations/${id}`, { headers: getHeaders() });
  return res.json();
};

export const createViolation = async (data) => {
  const res = await fetch(`${BASE_URL}/violations`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  return res.json();
};

export const updateViolation = async (id, data) => {
  const res = await fetch(`${BASE_URL}/violations/${id}`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  return res.json();
};

export const loginUser = async (username, password) => {
  const res = await fetch(`${BASE_URL}/users/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  return res.json();
};

export const loginAdmin = async (username, password) => {
  const res = await fetch(`${BASE_URL}/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  return res.json();
};

export const registerOfficer = async (data) => {
  const res = await fetch(`${BASE_URL}/officers/register`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  return res.json();
};

export const getOfficers = async () => {
  const res = await fetch(`${BASE_URL}/officers`, { headers: getHeaders() });
  return res.json();
};

export const updateOfficer = async (id, data) => {
  const res = await fetch(`${BASE_URL}/officers/${id}`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  return res.json();
};

export const deleteOfficer = async (id) => {
  const res = await fetch(`${BASE_URL}/officers/${id}`, {
    method: "DELETE",
    headers: getHeaders(),
  });
  return res.json();
};

export const requestPasswordReset = async (officerId) => {
  const res = await fetch(`${BASE_URL}/officers/password-reset-request`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ officerId }),
  });
  return res.json();
};

export const getPasswordResetRequests = async () => {
  const res = await fetch(`${BASE_URL}/officers/password-reset-requests`, {
    headers: getHeaders(),
  });
  return res.json();
};

export const approvePasswordReset = async (requestId) => {
  const res = await fetch(`${BASE_URL}/officers/approve-password-reset/${requestId}`, {
    method: "POST",
    headers: getHeaders(),
  });
  return res.json();
};

export const rejectPasswordReset = async (requestId, remarks) => {
  const res = await fetch(`${BASE_URL}/officers/reject-password-reset/${requestId}`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ remarks }),
  });
  return res.json();
};

export const retryResetEmail = async (requestId) => {
  const res = await fetch(`${BASE_URL}/officers/retry-reset-email/${requestId}`, {
    method: "POST",
    headers: getHeaders(),
  });
  return res.json();
};

export const changePassword = async (currentPassword, newPassword) => {
  const res = await fetch(`${BASE_URL}/officers/change-password`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ currentPassword, newPassword }),
  });
  return res.json();
};

export const getVehicles = async () => {
  const res = await fetch(`${BASE_URL}/vehicles`, { headers: getHeaders() });
  return res.json();
};

export const registerVehicle = async (data) => {
  const res = await fetch(`${BASE_URL}/vehicles`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  return res.json();
};

export const updateVehicle = async (id, data) => {
  const res = await fetch(`${BASE_URL}/vehicles/${id}`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  return res.json();
};

export const deleteVehicle = async (id) => {
  const res = await fetch(`${BASE_URL}/vehicles/${id}`, {
    method: "DELETE",
    headers: getHeaders(),
  });
  return res.json();
};

export const forgotPassword = async (email, role) => {
  const res = await fetch(`${BASE_URL}/admin/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, role }),
  });
  return res.json();
};

export const verifyOtp = async (email, otp, role) => {
  const res = await fetch(`${BASE_URL}/admin/verify-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, otp, role }),
  });
  return res.json();
};

export const resetPassword = async (email, otp, newPassword, role) => {
  const res = await fetch(`${BASE_URL}/admin/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, otp, newPassword, role }),
  });
  return res.json();
};

// ==========================================
// OFFICER AVAILABILITY API CALLS (PRESERVED FOR LEAVE MANAGEMENT)
// ==========================================

export const getOfficerAvailability = async () => {
  const res = await fetch(`${BASE_URL}/duties/availability`, { headers: getHeaders() });
  return res.json();
};

export const saveOfficerAvailability = async (data) => {
  const res = await fetch(`${BASE_URL}/duties/availability`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  return res.json();
};

// ==========================================
// OFFICER LEAVE API CALLS
// ==========================================
export const getOfficerLeaves = async () => {
  const res = await fetch(`${BASE_URL}/leaves`, { headers: getHeaders() });
  return res.json();
};

export const getLeavesByOfficer = async (officerId) => {
  const res = await fetch(`${BASE_URL}/leaves/officer/${officerId}`, { headers: getHeaders() });
  return res.json();
};

export const createOfficerLeave = async (data) => {
  const res = await fetch(`${BASE_URL}/leaves`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  return res.json();
};

export const updateOfficerLeave = async (id, data) => {
  const res = await fetch(`${BASE_URL}/leaves/${id}`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  return res.json();
};

export const deleteOfficerLeave = async (id) => {
  const res = await fetch(`${BASE_URL}/leaves/${id}`, {
    method: "DELETE",
    headers: getHeaders(),
  });
  return res.json();
};

export const getSystemHealth = async () => {
  try {
    const res = await fetch(`${BASE_URL}/health`);
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.error("Health check error:", err);
  }
  return { success: false, database: "unavailable" };
};

export const getMyProfile = async () => {
  try {
    let res = await fetch(`${BASE_URL}/officers/me`, { headers: getHeaders() });
    if (!res.ok) {
      res = await fetch(`${BASE_URL}/admin/me`, { headers: getHeaders() });
    }
    if (res.ok) {
      return res.json();
    }
  } catch (err) {
    console.error("Error fetching my profile:", err);
  }
  return null;
};

export const updateMyProfile = async (data) => {
  try {
    let res = await fetch(`${BASE_URL}/officers/me`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      res = await fetch(`${BASE_URL}/admin/me`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify(data),
      });
    }

    if (!res.ok) {
      const officer = JSON.parse(localStorage.getItem("officer") || "{}");
      const targetId = officer._id || officer.id || officer.policeId || officer.username || "me";
      res = await fetch(`${BASE_URL}/officers/${targetId}`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify(data),
      });
    }

    const resData = await res.json();
    return { ok: res.ok, data: resData };
  } catch (err) {
    console.error("Error updating profile:", err);
    return { ok: false, error: err.message };
  }
};

export const updateMyPassword = async (data) => {
  try {
    let res = await fetch(`${BASE_URL}/officers/me`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      res = await fetch(`${BASE_URL}/admin/me`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify(data),
      });
    }

    const resData = await res.json();
    return { ok: res.ok, data: resData };
  } catch (err) {
    console.error("Error updating password:", err);
    return { ok: false, error: err.message };
  }
};

// ==========================================
// DUTY ROSTER API CALLS
// ==========================================

export const getDutyRosters = async (params = {}) => {
  const query = new URLSearchParams(params).toString();
  const res = await fetch(`${BASE_URL}/duty-rosters${query ? `?${query}` : ""}`, {
    headers: getHeaders(),
  });
  return res.json();
};

export const getDutyRosterByWeek = async (startDate) => {
  const res = await fetch(`${BASE_URL}/duty-rosters/week?startDate=${startDate}`, {
    headers: getHeaders(),
  });
  return res.json();
};

export const createDutyRoster = async (data) => {
  const res = await fetch(`${BASE_URL}/duty-rosters`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  const resData = await res.json();
  return { ok: res.ok, data: resData };
};

export const updateDutyRoster = async (id, data) => {
  const res = await fetch(`${BASE_URL}/duty-rosters/${id}`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  const resData = await res.json();
  return { ok: res.ok, data: resData };
};

export const getDuties = async (params = {}) => {
  const query = new URLSearchParams(params).toString();
  const res = await fetch(`${BASE_URL}/duties${query ? `?${query}` : ""}`, {
    headers: getHeaders(),
  });
  return res.json();
};

export const createDuty = async (data) => {
  const res = await fetch(`${BASE_URL}/duties`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  const resData = await res.json();
  return { ok: res.ok, data: resData };
};

export const updateDuty = async (id, data) => {
  const res = await fetch(`${BASE_URL}/duties/${id}`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  const resData = await res.json();
  return { ok: res.ok, data: resData };
};

export const deleteDuty = async (id) => {
  const res = await fetch(`${BASE_URL}/duties/${id}`, {
    method: "DELETE",
    headers: getHeaders(),
  });
  const resData = await res.json();
  return { ok: res.ok, data: resData };
};