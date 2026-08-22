const BASE_URL = "http://localhost:5000/api";

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
// DUTY ROSTER API CALLS
// ==========================================
export const getDutyRules = async () => {
  const res = await fetch(`${BASE_URL}/duties/rules`, { headers: getHeaders() });
  return res.json();
};

export const createDutyRule = async (data) => {
  const res = await fetch(`${BASE_URL}/duties/rules`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  return res.json();
};

export const updateDutyRule = async (id, data) => {
  const res = await fetch(`${BASE_URL}/duties/rules/${id}`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  return res.json();
};

export const deleteDutyRule = async (id) => {
  const res = await fetch(`${BASE_URL}/duties/rules/${id}`, {
    method: "DELETE",
    headers: getHeaders(),
  });
  return res.json();
};

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

export const getDutyRosters = async (status = "", rosterType = "") => {
  let url = `${BASE_URL}/duties/rosters`;
  const params = [];
  if (status) params.push(`status=${status}`);
  if (rosterType) params.push(`rosterType=${rosterType}`);
  if (params.length > 0) url += `?${params.join("&")}`;

  const res = await fetch(url, { headers: getHeaders() });
  return res.json();
};

export const getDutyRosterById = async (id) => {
  const res = await fetch(`${BASE_URL}/duties/rosters/${id}`, { headers: getHeaders() });
  return res.json();
};

export const generateAIDutyRoster = async (data) => {
  const res = await fetch(`${BASE_URL}/duties/rosters/generate`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  return res.json();
};

export const validateDutyRoster = async (data) => {
  const res = await fetch(`${BASE_URL}/duties/rosters/validate`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  return res.json();
};

export const createDutyRoster = async (data) => {
  const res = await fetch(`${BASE_URL}/duties/rosters`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  return res.json();
};

export const updateDutyRosterStatus = async (id, data) => {
  const res = await fetch(`${BASE_URL}/duties/rosters/${id}`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  return res.json();
};

export const getDutyShifts = async () => {
  const res = await fetch(`${BASE_URL}/duties/shifts`, { headers: getHeaders() });
  return res.json();
};

export const createDutyShift = async (data) => {
  const res = await fetch(`${BASE_URL}/duties/shifts`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  return res.json();
};

export const updateDutyShift = async (id, data) => {
  const res = await fetch(`${BASE_URL}/duties/shifts/${id}`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  return res.json();
};

export const deleteDutyShift = async (id) => {
  const res = await fetch(`${BASE_URL}/duties/shifts/${id}`, {
    method: "DELETE",
    headers: getHeaders(),
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