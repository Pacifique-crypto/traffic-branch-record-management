import React, { useEffect, useState } from "react";
import Layout from "../components/Layout";

function User() {
  const [officers, setOfficers] = useState([]);

  useEffect(() => {
    fetch("https://traffic-branch-backend.onrender.com/api/officers")
      .then((res) => res.json())
      .then((data) => setOfficers(data))
      .catch((err) => console.log(err));
  }, []);

  return (
    <Layout>
      <div className="dashboard-wrapper">
        <h2>Officer Management</h2>

        <table
          style={{
            width: "100%",
            background: "#fff",
            borderCollapse: "collapse",
            marginTop: "20px",
          }}
        >
          <thead>
            <tr>
              <th>Police ID</th>
              <th>Name</th>
              <th>Username</th>
              <th>Contact</th>
            </tr>
          </thead>

          <tbody>
            {officers.map((officer) => (
              <tr key={officer._id}>
                <td>{officer.policeId}</td>
                <td>{officer.fullName}</td>
                <td>{officer.username}</td>
                <td>{officer.contactNo}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}

export default User;