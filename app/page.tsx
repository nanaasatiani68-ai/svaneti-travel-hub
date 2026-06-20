"use client";

export default function Home() {
  return (
    <main>
      <img
        src="/svaneti.jpg"
        alt="Svaneti"
        style={{
          width: "100%",
          height: "500px",
          objectFit: "cover",
        }}
      />

      <div style={{ textAlign: "center", padding: "40px" }}>
        <h1>Svaneti Travel Hub</h1>

        <p>
          Book tours, transfers and local guides in Svaneti.
        </p>
      </div>
    </main>
  );
}