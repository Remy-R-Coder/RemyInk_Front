export const ensureGuestAuth = async () => {
  const access = localStorage.getItem("access");

  // already authenticated
  if (access) return true;

  try {
    const res = await fetch(
      "http://127.0.0.1:8000/api/users/token/guest/",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!res.ok) throw new Error("Guest auth failed");

    const data = await res.json();

    localStorage.setItem("access", data.access);
    localStorage.setItem("refresh", data.refresh);
    localStorage.setItem("username", data.username);

    return true;
  } catch (err) {
    console.error("Guest auth failed:", err);
    return false;
  }
};
