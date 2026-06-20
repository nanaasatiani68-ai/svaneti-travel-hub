export default function Home() {
  return (
    <main style={{ textAlign: "center", padding: "50px" }}>
      <h1 style={{ fontSize: "48px" }}>
        🏔️ Svaneti Travel Hub
      </h1>

      <p style={{ fontSize: "20px" }}>
        დაჯავშნეთ ტურები, ტრანსფერები და ადგილობრივი გიდები სვანეთში.
      </p>

      <div style={{ marginTop: "30px" }}>
        <button style={{ padding: "12px 24px", marginRight: "10px" }}>
          ტურები
        </button>

        <button style={{ padding: "12px 24px" }}>
          ტრანსფერები
        </button>
      </div>
    </main>
  );
}