const { Octokit } = require("@octokit/rest");

exports.handler = async function(event, context) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { filename, content } = JSON.parse(event.body);

    // ⚠️ IMPORTANT: add your GitHub Personal Access Token in Netlify Environment Variables
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    if (!GITHUB_TOKEN) {
      return { statusCode: 500, body: JSON.stringify({ message: "GitHub token not set" }) };
    }

    const octokit = new Octokit({ auth: GITHUB_TOKEN });

    const owner = "WSP-17";          // your GitHub username or org
    const repo = "WSP-17.github.io"; // your repo name
    const path = _posts/${filename};

    // 1. Check if the file exists
    let sha;
    try {
      const existing = await octokit.repos.getContent({ owner, repo, path });
      sha = existing.data.sha;
    } catch (e) {
      // file doesn't exist, so we will create a new one
    }

    // 2. Create or update the file
    const response = await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path,
      message: sha ? Update post ${filename} : Create post ${filename},
      content: Buffer.from(content).toString("base64"),
      sha
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Post saved successfully!", url: response.data.content.html_url })
    };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ message: "Error saving post" }) };
  }
};
