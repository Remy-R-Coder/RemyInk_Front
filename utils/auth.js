export const ensureGuestAuth = async () => {
  const access = localStorage.getItem("access");

  if (access) return true;

  // Use the environment variable, falling back to your DigitalOcean URL
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "https://remyink-9gqjd.ondigitalocean.app";

  try {
    const res = await fetch(
      `${baseUrl}/api/users/token/guest/`, // Dynamic URL!
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
