import fetch from "node-fetch";

// Helper to slugify title for filename
function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, "-")           // Replace spaces with -
    .replace(/[^\w\-]+/g, "")       // Remove all non-word chars
    .replace(/\-\-+/g, "-")         // Replace multiple - with single -
    .replace(/^-+/, "")             // Trim - from start
    .replace(/-+$/, "");            // Trim - from end
}

// Create markdown front matter
function generateMarkdown(data) {
  const {
    title,
    date,
    category,
    authors,
    excerpt,
    featured_image,
    featured_image_alt,
    content
  } = data;

  const authorsYaml = authors
    ? authors.map(a =>   - name: "${a.name}"\n    link: "${a.link}").join("\n")
    : "";

  return ---
layout: post
title: "${title}"
date: ${date}
category: ${category}
authors:
${authorsYaml}
excerpt: "${excerpt || ""}"
featured_image: "${featured_image || ""}"
featured_image_alt: "${featured_image_alt || ""}"
---
${content}
;
}

export async function handler(event, context) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  // Basic auth
  const { username, password, post } = JSON.parse(event.body);
  if (
    username !== process.env.ADMIN_USER ||
    password !== process.env.ADMIN_PASS
  ) {
    return { statusCode: 401, body: "Unauthorized" };
  }

  // Repo info
  const owner = process.env.GITHUB_REPO_OWNER;
  const repo = process.env.GITHUB_REPO_NAME;
  const branch = process.env.GITHUB_BRANCH || "main";
  const token = process.env.GITHUB_TOKEN;

  // Generate filename: YYYY-MM-DD-slug.md
  const dateObj = new Date(post.date);
  const yyyy = dateObj.getFullYear();
  const mm = String(dateObj.getMonth() + 1).padStart(2, "0");
  const dd = String(dateObj.getDate()).padStart(2, "0");
  const slug = slugify(post.title);
  const filename = _posts/${yyyy}-${mm}-${dd}-${slug}.md;

  const content = generateMarkdown(post);

  // Check if file exists first (GitHub API)
  const getUrl = https://api.github.com/repos/${owner}/${repo}/contents/${filename}?ref=${branch};
  const getRes = await fetch(getUrl, {
    headers: { Authorization: token ${token} },
  });
  let sha = null;
  if (getRes.status === 200) {
    const data = await getRes.json();
    sha = data.sha; // needed for updating existing file
  }

  const url = https://api.github.com/repos/${owner}/${repo}/contents/${filename};
  const payload = {
    message: sha ? Update post: ${post.title} : Add new post: ${post.title},
    content: Buffer.from(content).toString("base64"),
    branch,
  };
  if (sha) payload.sha = sha;

  const res = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: token ${token},
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const result = await res.json();
  if (res.status >= 200 && res.status < 300) {
    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Post saved successfully!", result }),
    };
  } else {
    return {
      statusCode: res.status,
      body: JSON.stringify({ message: "Failed to save post", result }),
    };
  }
}
