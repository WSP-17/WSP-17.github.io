// Barebones Auth function — checks POST only, no secrets exposed
exports.handler = async (event) => {
  console.log("Auth function triggered!");

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  // Accept any username/password temporarily for testing
  // Later, we can reinstate process.env.ADMIN_USER / ADMIN_PASS checks
  const { user, pass } = JSON.parse(event.body || "{}");
  console.log("Received login attempt:", user);

  return {
    statusCode: 200,
    body: JSON.stringify({ ok: true }) // Always allow login for now
  };
};
