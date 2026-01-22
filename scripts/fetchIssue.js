import fs from "node:fs/promises";

const owner = "Marmoor54321";
const repo = "UncBoard";

async function getIssues() {
  try {
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/issues`);
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

    const data = await response.json();

    const issues = data;

    console.log("Issues:", issues);
    issues.forEach(issue => {
      console.log(`#${issue.number}: ${issue.title}`);
    });

    await fs.writeFile("issues.json", JSON.stringify(issues, null, 2));
    console.log("Zapisano dane do issues.json");

    return issues;
  } catch (err) {
    console.error("Błąd:", err);
  }
}

const issues = await getIssues();
