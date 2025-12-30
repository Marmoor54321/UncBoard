// utils/github.js (lub tam gdzie masz tę funkcję)
import axios from "axios";

export async function githubRequest(req, githubUrl, method = "GET", data = null) {
  // 1. Sprawdzamy sesję
  let token = req.session?.token;

  // 2. Jeśli nie ma w sesji, sprawdzamy nagłówek Authorization (dla Postmana)
  if (!token && req.headers.authorization) {
    const authHeader = req.headers.authorization;
    if (authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }
  }

  // Jeśli nadal brak tokena -> błąd
  if (!token) throw { status: 401, message: "Not authenticated" };

  try {
    const response = await axios({
      url: `https://api.github.com${githubUrl}`,
      method,
      data,
      headers: {
        Authorization: `token ${token}`, // Tu wstawiamy znaleziony token
        Accept: "application/vnd.github+json",
      },
    });

    return response.data;
  } catch (err) {
    console.error("GitHub API error:", err.response?.data || err);
    throw { status: 500, message: "GitHub request failed" };
  }
}