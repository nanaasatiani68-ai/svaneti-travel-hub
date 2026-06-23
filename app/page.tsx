export default function Home() {
  return (
    <main
      style={{
        minHeight: "100vh",
        backgroundImage: "url('/background.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        style={{
          background: "rgba(0,0,0,0.5)",
          padding: "40px",
          borderRadius: "16px",
          textAlign: "center",
          color: "white",
        }}
      >
        <h1>Svaneti Travel Hub</h1>

        <p>აღმოაჩინე სვანეთის ულამაზესი ტურები</p>

        <a
          href="/bookings"
          style={{
            display: "inline-block",
            marginTop: "20px",
            padding: "12px 24px",
            backgroundColor: "#2563eb",
            color: "white",
            textDecoration: "none",
            borderRadius: "8px",
            fontWeight: "bold",
          }}
        >
          Book Now
        </a>
      </div>
    </main>
  );
}