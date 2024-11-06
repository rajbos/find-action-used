const { Octokit } = require("@octokit/rest");
const { createOAuthAppAuth } = require("@octokit/auth-oauth-app");
const yaml = require("js-yaml");
const fs = require("fs");
const path = require("path");

const clientId = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;

const auth = createOAuthAppAuth({
  clientId,
  clientSecret,
});

async function authenticate() {
  const { token } = await auth({
    type: "oauth-user",
  });
  return token;
}

async function getRepositories(octokit) {
  const { data: repos } = await octokit.repos.listForAuthenticatedUser();
  return repos;
}

async function getWorkflowFiles(octokit, owner, repo) {
  const { data: contents } = await octokit.repos.getContent({
    owner,
    repo,
    path: ".github/workflows",
  });

  const workflowFiles = contents.filter(
    (file) => file.name.endsWith(".yml") || file.name.endsWith(".yaml")
  );

  return workflowFiles;
}

function parseYamlFile(content) {
  const doc = yaml.load(content);
  const actions = [];

  for (const job of Object.values(doc.jobs)) {
    for (const step of job.steps) {
      if (
        step.uses &&
        (step.uses.includes("actions/download-artifact") ||
          step.uses.includes("actions/upload-artifact"))
      ) {
        const version = step.uses.split("@")[1];
        actions.push({ action: step.uses, version });
      }
    }
  }

  return actions;
}

async function main() {
  const token = await authenticate();
  const octokit = new Octokit({ auth: token });

  const repos = await getRepositories(octokit);

  for (const repo of repos) {
    const workflowFiles = await getWorkflowFiles(
      octokit,
      repo.owner.login,
      repo.name
    );

    for (const file of workflowFiles) {
      const { data: content } = await octokit.repos.getContent({
        owner: repo.owner.login,
        repo: repo.name,
        path: file.path,
      });

      const decodedContent = Buffer.from(content.content, "base64").toString(
        "utf8"
      );
      const actions = parseYamlFile(decodedContent);

      console.log(`Repository: ${repo.name}`);
      console.log(`Workflow file: ${file.name}`);
      console.log("Actions found:", actions);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
