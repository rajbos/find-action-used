const { Octokit } = require("@octokit/rest");
const { createOAuthAppAuth } = require("@octokit/auth-oauth-app");
const yaml = require("js-yaml");
const fs = require("fs");
const path = require("path");
const { parseYamlFile } = require("../utils");

jest.mock("@octokit/rest");
jest.mock("@octokit/auth-oauth-app");

describe("OAuth Authentication Process", () => {
  it("should authenticate the user and return a token", async () => {
    const mockAuth = jest.fn().mockResolvedValue({ token: "mock-token" });
    createOAuthAppAuth.mockReturnValue(mockAuth);

    const token = await authenticate();
    expect(token).toBe("mock-token");
  });
});

describe("Reading Repositories", () => {
  it("should fetch all repositories accessible to the authenticated user", async () => {
    const mockRepos = [{ name: "repo1" }, { name: "repo2" }];
    Octokit.mockImplementation(() => ({
      repos: {
        listForAuthenticatedUser: jest.fn().mockResolvedValue({ data: mockRepos }),
      },
    }));

    const octokit = new Octokit();
    const repos = await getRepositories(octokit);
    expect(repos).toEqual(mockRepos);
  });
});

describe("Finding Workflow Files", () => {
  it("should find yml or yaml files in the .github/workflows folder", async () => {
    const mockContents = [
      { name: "workflow1.yml" },
      { name: "workflow2.yaml" },
      { name: "not-a-workflow.txt" },
    ];
    Octokit.mockImplementation(() => ({
      repos: {
        getContent: jest.fn().mockResolvedValue({ data: mockContents }),
      },
    }));

    const octokit = new Octokit();
    const workflowFiles = await getWorkflowFiles(octokit, "owner", "repo");
    expect(workflowFiles).toEqual([
      { name: "workflow1.yml" },
      { name: "workflow2.yaml" },
    ]);
  });
});

describe("Parsing YAML Content", () => {
  it("should extract the version number from actions/download-artifact and actions/upload-artifact lines", () => {
    const yamlContent = `
      jobs:
        job1:
          steps:
            - uses: actions/download-artifact@v2
            - uses: actions/upload-artifact@v3
    `;
    const actions = parseYamlFile(yamlContent);
    expect(actions).toEqual([
      { action: "actions/download-artifact@v2", version: "v2" },
      { action: "actions/upload-artifact@v3", version: "v3" },
    ]);
  });
});
