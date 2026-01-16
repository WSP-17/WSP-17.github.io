exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const {
      username,
      password,
      title,
      date,
      category,
      authors,
      excerpt,
      featured_image,
      featured_image_alt,
      content,
      slug,
      update = false
    } = JSON.parse(event.body);

    /* ===============================
       1. AUTHENTICATION (SECURE)
    =============================== */
    if (
      username !== process.env.ADMIN_USER ||
      password !== process.env.ADMIN_PASS
    ) {
      return { statusCode: 401, body: "Unauthorized" };
    }

    /* ===============================
       2. BASIC VALIDATION
       (this is the “validating thingy”)
       → prevents broken posts
    =============================== */
    if (!title  !date  !content) {
      return {
        statusCode: 400,
        body: "Missing required fields (title, date, content)"
      };
    }

    /* ===============================
       3. SLUG + FILENAME
    =============================== */
    const safeSlug =
      slug ||
      title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

    const fileName = ${date}-${safeSlug}.md;
    const filePath = _posts/${fileName};

    /* ===============================
       4. FRONT MATTER (YOUR STRUCTURE)
    =============================== */
    const frontMatter = ---
layout: post
title: "${title.replace(/"/g, '\\"')}"
date: ${date}
category: ${category || "general"}
authors:
${(authors || []).map(a =>   - name: "${a.name}"\n    link: "${a.link}").join("\n")}
${excerpt ? excerpt: "${excerpt.replace(/"/g, '\\"')}" : ""}
${featured_image ? featured_image: "${featured_image}" : ""}
${featured_image_alt ? featured_image_alt: "${featured_image_alt}" : ""}
---

${content}
;

    /* ===============================
       5. GITHUB API DETAILS
    =============================== */
    const owner = process.env.GITHUB_REPO_OWNER;
    const repo = process.env.GITHUB_REPO_NAME;
    const branch = process.env.GITHUB_BRANCH;
    const token = process.env.GITHUB_TOKEN;

    const apiUrl = https://api.github.com/repos/${owner}/${repo}/contents/${filePath};

    /* ===============================
       6. CHECK IF FILE EXISTS
    =============================== */
    let sha = null;
    const existing = await fetch(${apiUrl}?ref=${branch}, {
      headers: {
        Authorization: Bearer ${token},
        Accept: "application/vnd.github+json"
      }
    });

    if (existing.ok) {
      const data = await existing.json();
      sha = data.sha;
    }

    /* ===============================
       7. CREATE OR UPDATE FILE
    =============================== */
    const response = await fetch(apiUrl, {
      method: "PUT",
      headers: {
        Authorization: Bearer ${token},
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: update
          ? Update post: ${title}
          : New post: ${title},
        content: Buffer.from(frontMatter).toString("base64"),
        branch,
        ...(sha && { sha })
      })
    });

    if (!response.ok) {
      const error = await response.text();
      return { statusCode: 500, body: error };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        file: fileName,
        mode: sha ? "updated" : "created"
      })
    };
  } catch (err) {
    return { statusCode: 500, body: err.message };
  }
};
