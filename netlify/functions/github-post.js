const { Octokit } = require("@octokit/rest");

exports.handler = async function(event) {
  const body = JSON.parse(event.body || '{}');
  const {
    action, user, pass,
    filename, content, update
  } = body;

  const ADMIN = {
    username: process.env.ADMIN_USER,
    password: process.env.ADMIN_PASS
  };

  if(action === 'login'){
    return {
      statusCode: 200,
      body: JSON.stringify({ ok: user === ADMIN.username && pass === ADMIN.password })
    };
  }

  if(action !== 'publish') {
    return { statusCode: 400, body: "Unknown action" };
  }

  if(!user || !pass) return { statusCode: 401, body: "Unauthorized" };

  // GitHub API push
  const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
  const owner = process.env.GITHUB_REPO_OWNER;
  const repo = process.env.GITHUB_REPO_NAME;
  const branch = process.env.GITHUB_BRANCH || 'main';
  const postsPath = process.env.POSTS_PATH || "_posts";

  try {
    // Check if file exists (for update)
    let sha;
    if(update){
      try {
        const resp = await octokit.repos.getContent({
          owner, repo, path: ${postsPath}/${filename}, ref: branch
        });
        sha = resp.data.sha;
      } catch(e){
        // File does not exist
      }
    }

    // Create/Update file
    await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path: ${postsPath}/${filename},
      message: update ? Update post: ${filename} : Create post: ${filename},
      content: Buffer.from(content).toString('base64'),
      branch,
      sha
    });

    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch(err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ ok: false, error: err.message }) };
  }
};
