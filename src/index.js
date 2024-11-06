import 'dotenv/config';
import { Octokit } from "@octokit/rest";
import { createOAuthAppAuth } from "@octokit/auth-oauth-app";
import yaml from "js-yaml";
import fs from "fs";
import path from "path";
import express from "express";
import { exec } from "child_process";

const app = express();
const port = 3000;

const clientId = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;

const auth = createOAuthAppAuth({
  clientType: "oauth-app",
  clientId,
  clientSecret,
});

app.get('/', (req, res) => {
  res.send('Welcome to the GitHub Actions Finder App! Go to <a href="/auth">/auth</a> to authenticate.');
});

app.get('/auth', async (req, res) => {
  try {
    const { url } = await auth({
      type: "oauth-app",
      clientId,
      scopes: ["repo"],
    });
    console.log(`Redirecting to: ${url}`);
    res.redirect(url);
  } catch (error) {
    console.error('Error generating auth URL:', error);
    res.status(500).send('Error generating auth URL');
  }
});

app.get('/callback', async (req, res) => {
  console.log('Received callback request');
  const { code } = req.query;
  console.log(`Authorization code received: ${code}`);
  try {
    const { token } = await auth({
      type: "token",
      code,
      clientId,
      clientSecret,
    });
    console.log('Authentication successful, token received');
    res.send("Authentication successful! You can close this window.");
    startApp(token);
  } catch (error) {
    console.error('Error during callback:', error);
    res.status(500).send('Error during callback');
  }
});

async function startApp(token) {
  console.log('Starting app with token:', token);
  const octokit = new Octokit({
    auth: token
  });
  console.log('Octokit initialized');
  // Add more logging as needed for further operations
  async function getRepositories() {
    try {
      const response = await octokit.request('GET /user/repos');
      console.log(response.data);
    } catch (error) {
      console.error(error);
    }
  }

  await getRepositories();
}

app.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`);
  exec(`xdg-open http://localhost:${port}/auth`);
});