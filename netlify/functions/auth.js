exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return {
      statusCode: 400,
      body: JSON.stringify({ ok: false })
    };
  }

  const { user, pass } = body;

  if (
    user === process.env.ADMIN_USER &&
    pass === process.env.ADMIN_PASS
  ) {
    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true })
    };
  }

  return {
    statusCode: 401,
    body: JSON.stringify({ ok: false })
  };
};
