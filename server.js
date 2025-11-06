import express from "express";
import mongoose from "mongoose";
import axios from "axios";
import session from "express-session";
import dotenv from "dotenv";
import cors from "cors";
import createGitHubRoutes from "./routes/githubAuth.js";


dotenv.config();
const app = express();

app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(session({ secret: "secret", resave: false, saveUninitialized: true }));
app.use(express.json());

const CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;

app.use(
  createGitHubRoutes(CLIENT_ID, CLIENT_SECRET)
);


// Połącz z MongoDB
mongoose.connect('mongodb://localhost:27017/uncboard', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log("✅ Połączono z MongoDB"))
.catch(err => console.log(err));



// Get repository issues
app.get("/api/github/issues/:owner/:repo", async (req, res) => {
  const token = req.session.token;
  if (!token) return res.status(401).send("Not authenticated");

  const { owner, repo } = req.params;

  try {
    const response = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}/issues?state=all&per_page=100`,
      {
        headers: { Authorization: `token ${token}` },
      }
    );
    res.json(response.data);
  } catch (err) {
    console.error("GitHub API error:", err.response?.data || err.message);
    res.status(500).send("Failed to fetch issues");
  }
});

// get project items and columns 
app.get("/api/github/project-items/:owner/:repo", async (req, res) => {
  const token = req.session.token;
  if (!token) return res.status(401).send("Not authenticated");

  const { owner, repo } = req.params;

  const query = `
  query {
    repository(owner: "${owner}", name: "${repo}") {
      projectsV2(first: 1) {
        nodes {
          id
          title
          fields(first: 20) {
            nodes {
              ... on ProjectV2SingleSelectField {
                id
                name
                options {
                  id
                  name
                }
              }
            }
          }
          items(first: 100) {
            nodes {
              id
              content {
                ... on Issue {
                  id
                  number
                  title
                  body
                  createdAt
                  author {
                    login
                    avatarUrl
                    url
                  }
                  assignees(first: 10) {
                    nodes {
                      login
                      avatarUrl
                      url
                    }
                  }
                  labels(first: 10) {
                    nodes {
                      name
                      color
                    }
                  }
                  comments(first: 20, orderBy: {field: UPDATED_AT, direction: DESC}) {
                    nodes {
                      id
                      body
                      createdAt
                      author {
                        login
                        avatarUrl
                        url
                      }
                    }
                  }
                  timelineItems(first: 20, itemTypes: [LABELED_EVENT, UNLABELED_EVENT, ASSIGNED_EVENT, UNASSIGNED_EVENT, CLOSED_EVENT, REOPENED_EVENT]) {
                    nodes {
                      __typename
                      ... on LabeledEvent {
                        createdAt
                        label {
                          name
                          color
                        }
                        actor {
                          login
                        }
                      }
                      ... on UnlabeledEvent {
                        createdAt
                        label {
                          name
                          color
                        }
                        actor {
                          login
                        }
                      }
                      ... on AssignedEvent {
                        createdAt
                        actor {
                          login
                        }
                        assignee {
                          ... on User {
                            login
                          }
                        }
                      }
                      ... on UnassignedEvent {
                        createdAt
                        actor {
                          login
                        }
                        assignee {
                          ... on User {
                            login
                          }
                        }
                      }
                      ... on ClosedEvent {
                        createdAt
                        actor {
                          login
                        }
                      }
                      ... on ReopenedEvent {
                        createdAt
                        actor {
                          login
                        }
                      }
                    }
                  }
                }
              }
              fieldValues(first: 20) {
                nodes {
                  ... on ProjectV2ItemFieldSingleSelectValue {
                    field {
                      ... on ProjectV2SingleSelectField {
                        name
                      }
                    }
                    name
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`;





  try {
    const response = await axios.post(
      "https://api.github.com/graphql",
      { query },
      { headers: { Authorization: `bearer ${token}` } }
    );

    //console.log(JSON.stringify(response.data, null, 2));
    res.json(response.data);
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).send("Error fetching project items");
  }
});



// update project field value
app.post("/api/github/update-item", async (req, res) => {
  const token = req.session.token;
  if (!token) return res.status(401).send("Not authenticated");

  const { projectId, itemId, fieldId, optionId } = req.body;

  const query = `
    mutation {
      updateProjectV2ItemFieldValue(
        input: {
          projectId: "${projectId}",
          itemId: "${itemId}",
          fieldId: "${fieldId}",
          value: { singleSelectOptionId: "${optionId}" }
        }
      ) {
        clientMutationId
      }
    }
  `;

  try {
    const response = await axios.post(
      "https://api.github.com/graphql",
      { query },
      { headers: { Authorization: `bearer ${token}` } }
    );
    res.json(response.data);
  } catch (err) {
    console.error("GitHub mutation error:", err.response?.data || err.message);
    res.status(500).send("Error updating item field value");
  }
});


// clear a project field value (for "No Status")
app.post("/api/github/clear-item-field", async (req, res) => {
  const token = req.session.token;
  if (!token) return res.status(401).send("Not authenticated");

  const { projectId, itemId, fieldId } = req.body;

  const query = `
    mutation {
      clearProjectV2ItemFieldValue(
        input: {
          projectId: "${projectId}",
          itemId: "${itemId}",
          fieldId: "${fieldId}"
        }
      ) {
        clientMutationId
      }
    }
  `;

  try {
    const response = await axios.post(
      "https://api.github.com/graphql",
      { query },
      { headers: { Authorization: `bearer ${token}` } }
    );
    res.json(response.data);
  } catch (err) {
    console.error("GitHub clear mutation error:", err.response?.data || err.message);
    res.status(500).send("Error clearing item field value");
  }
});



app.listen(3000, () => console.log("Server running on http://localhost:3000"));
