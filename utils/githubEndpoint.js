import { githubRequest } from "./github.js";

///utility do szybkiego tworzenia endpointów do githuba
export function createGitHubEndpoint(app, path, method, githubPathResolver) {
  app[method.toLowerCase()](path, async (req, res) => {
    try {
      const githubPath = githubPathResolver(req);
      const data = await githubRequest(req, githubPath, method, req.body);
      res.json(data);
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  });
}

