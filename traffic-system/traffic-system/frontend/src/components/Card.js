function Card({ title, value }) {
  return (
    <div style={{
      background: "var(--card-bg)",
      padding: "20px",
      borderRadius: "var(--radius)",
      boxShadow: "var(--shadow)"
    }}>
      <p style={{ color: "var(--text-muted)", marginBottom: "8px" }}>
        {title}
      </p>
      <h2 style={{ margin: 0 }}>{value}</h2>
    </div>
  );
}

export default Card;
