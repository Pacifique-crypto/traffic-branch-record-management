const BASE_URL = "https://traffic-branch-backend.onrender.com/api";

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
  const res = await fetch(`${BASE_URL}/officers/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      username,
      password,
    }),
  });

  return res.json();
};

export const adminLogin = async (username, password) => {
  const res = await fetch(`${BASE_URL}/admin/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      username,
      password,
    }),
  });

  return res.json();
};

export const registerUser = async (data) => {
  const res = await fetch(`${BASE_URL}/officers/register`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  return res.json();
};

export const getUsers = async () => {
  const res = await fetch(`${BASE_URL}/users`, { headers: getHeaders() });
  return res.json();
};

export const deleteUser = async (id) => {
  const res = await fetch(`${BASE_URL}/users/${id}`, {
    method: "DELETE",
    headers: getHeaders(),
  });
  return res.json();
};

export const getDutyRoster = async () => {
  const res = await fetch(`${BASE_URL}/duty-roster`, { headers: getHeaders() });
  return res.json();
};

export const createDutyRoster = async (data) => {
  const res = await fetch(`${BASE_URL}/duty-roster`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  return res.json();
};

export const registerOfficer = async (officerData) => {
  const response = await fetch(
    "https://traffic-branch-backend.onrender.com/api/officers/register",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(officerData),
    }
  );

  return response.json();
};

// ===============================
// OFFICER MANAGEMENT
// ===============================

// Get all officers
export const getOfficers = async () => {
  const res = await fetch(`${BASE_URL}/officers`, {
    headers: getHeaders(),
  });

  return res.json();
};

// Update officer
export const updateOfficer = async (id, officerData) => {
  const res = await fetch(`${BASE_URL}/officers/${id}`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify(officerData),
  });

  return res.json();
};

// Delete officer
export const deleteOfficer = async (id) => {
  const res = await fetch(`${BASE_URL}/officers/${id}`, {
    method: "DELETE",
    headers: getHeaders(),
  });

  return res.json();
};

