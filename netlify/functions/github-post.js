// Barebones GitHub post function — does not push yet
exports.handler = async (event) => {
  console.log("GitHub post function triggered!");
  
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const { filename, content } = JSON.parse(event.body || "{}");
  console.log("Received publish request:", filename);

  // Respond success without touching GitHub for now
  return {
    statusCode: 200,
    body: JSON.stringify({ ok: true, message: "Barebones publish success" })
  };
};
