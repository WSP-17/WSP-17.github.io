exports.handler = async (event) => {
  const body = JSON.parse(event.body || "{}");

  // LOGIN CHECK
  if (body.action === "login") {
    return {
      statusCode: 200,
      body: JSON.stringify({
        ok:
          body.user === process.env.ADMIN_USER &&
          body.pass === process.env.ADMIN_PASS
      })
    };
  }

  if (body.action !== "publish") {
    return { statusCode: 400, body: "Invalid action" };
  }

  const {
    GITHUB_TOKEN,
    GITHUB_REPO_OWNER,
    GITHUB_REPO_NAME,
    GITHUB_BRANCH,
    POSTS_PATH
  } = process.env;

  const path = `${POSTS_PATH}/${body.filename}`;
  const apiUrl = `https://api.github.com/repos/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/contents/${path}`;

  // Check if file exists (edit vs new)
  let sha = null;
  const existing = await fetch(apiUrl, {
    headers: { Authorization: `token ${GITHUB_TOKEN}` }
  });

  if (existing.status === 200) {
    const data = await existing.json();
    sha = data.sha;
  }

  const res = await fetch(apiUrl, {
    method: "PUT",
    headers: {
      Authorization: `token ${GITHUB_TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      message: sha ? "Update post via admin" : "New post via admin",
      content: Buffer.from(body.content).toString("base64"),
      branch: GITHUB_BRANCH,
      sha
    })
  });

  return {
    statusCode: 200,
    body: JSON.stringify({ ok: res.status === 201 || res.status === 200 })
  };
};
