const { Octokit } = require("@octokit/rest");

exports.handler = async function(event, context) {
  const env = process.env;
  const ADMIN_USER = env.ADMIN_USER;
  const ADMIN_PASS = env.ADMIN_PASS;
  const GITHUB_TOKEN = env.GITHUB_TOKEN;
  const REPO_OWNER = env.GITHUB_REPO_OWNER;
  const REPO_NAME = env.GITHUB_REPO_NAME;
  const BRANCH = env.GITHUB_BRANCH;
  const POSTS_PATH = env.POSTS_PATH;
  const IMAGES_PATH = 'assets/images/posts';

  try {
    const body = JSON.parse(event.body);

    // Login check
    if(body.action === 'login') {
      if(body.user === ADMIN_USER && body.pass === ADMIN_PASS) {
        return { statusCode: 200, body: JSON.stringify({ ok: true }) };
      } else {
        return { statusCode: 401, body: JSON.stringify({ ok: false }) };
      }
    }

    // Publish post
    if(body.action === 'publish') {
      const octokit = new Octokit({ auth: GITHUB_TOKEN });
      const slug = body.filename.split('-').slice(1).join('-').replace('.md','');
      const postPath = ${POSTS_PATH}/${body.filename};
      const imageFolderPath = ${IMAGES_PATH}/${slug};

      // Update existing post if flagged
      let sha;
      if(body.update) {
        try {
          const existing = await octokit.repos.getContent({
            owner: REPO_OWNER,
            repo: REPO_NAME,
            path: postPath,
            ref: BRANCH
          });
          sha = existing.data.sha;
        } catch(e) { sha = undefined; }
      }

      // Push the post file
      await octokit.repos.createOrUpdateFileContents({
        owner: REPO_OWNER,
        repo: REPO_NAME,
        path: postPath,
        message: body.update ? Update: ${body.filename} : Add: ${body.filename},
        content: Buffer.from(body.content).toString('base64'),
        branch: BRANCH,
        sha
      });

      // Create the image folder with .gitkeep if it doesn't exist
      try {
        await octokit.repos.getContent({
          owner: REPO_OWNER,
          repo: REPO_NAME,
          path: imageFolderPath,
          ref: BRANCH
        });
        // folder exists, do nothing
      } catch(e) {
        // folder not found → create .gitkeep
        await octokit.repos.createOrUpdateFileContents({
          owner: REPO_OWNER,
          repo: REPO_NAME,
          path: ${imageFolderPath}/.gitkeep,
          message: Create image folder for ${slug},
          content: Buffer.from('').toString('base64'),
          branch: BRANCH
        });
      }

      return { statusCode: 200, body: JSON.stringify({ ok: true }) };
    }

    return { statusCode: 400, body: JSON.stringify({ ok:false, error:'Invalid action'}) };

  } catch(err) {
    return { statusCode: 500, body: JSON.stringify({ ok:false, error: err.message }) };
  }
};
