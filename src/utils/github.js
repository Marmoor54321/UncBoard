import axios from "axios";

export async function githubRequest(req, githubUrl, method = "GET", data = null) {
  const token = req.session.token;
  if (!token) throw { status: 401, message: "Not authenticated" };

  try {
    const response = await axios({
      url: `https://api.github.com${githubUrl}`,
      method,
      data,
      headers: {
        Authorization: `token ${token}`,
        Accept: "application/vnd.github+json",
      },
    });

    return response.data;
  } catch (err) {
    console.error("GitHub API error:", err.response?.data || err);
    throw { status: 500, message: "GitHub request failed" };
  }
}
