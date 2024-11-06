import 'dotenv/config';
import { Octokit } from "@octokit/rest";
import yaml from "js-yaml";
import fs from "fs";
import path from "path";
import express from "express";
import { exec } from "child_process";
import fetch from "node-fetch";
import { OAuthApp } from "@octokit/oauth-app";

// global data storage
let repos = [];

// setup for the app
const port = 3000;
const clientId = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;
console.log(`Booting with Client ID ${clientId} and a secret with length ${clientSecret.length}`);
const auth = new OAuthApp({
  clientType: 'oauth-app',
  clientId,
  clientSecret,
  request: {
    fetch: fetch,
  },
});

const app = express();

app.get('/', (req, res) => {
  console.log('Received request');
  res.send('Welcome to the GitHub Actions Finder App! Go to <a href="/auth">/auth</a> to authenticate.');
});

app.get('/auth', (req, res) => {
  console.log('Received auth request');
  try {
    const { url, scopes } = auth.getWebFlowAuthorizationUrl({
      scopes: ['repo'],
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
    const tokenResponse = await auth.createToken({ code });
    console.log('Token response:', tokenResponse);
    const token = tokenResponse.authentication.token;
    if (!token) {
      throw new Error('Token is undefined');
    }
    console.log(`Authentication successful, token [${token}] received`);
    res.send('Authentication successful! Go to <a href="/info">/info</a> to find your repositories.');
    startApp(token);
  } catch (error) {
    console.error('Error during callback:', error);
    res.status(500).send('Error during callback');
  }
});

async function startApp(token) {
  console.log('Starting app with token:', token);
  const octokit = new Octokit({
    auth: token,
    request: {
      fetch: fetch,
    },
  });
  console.log(`Octokit initialized`);
  async function getRepositories() {
    console.log('Fetching repositories');
    try {
      const response = await octokit.request('GET /user/repos')
                                    .then(data => {
                                      // store the user repos for later use
                                      console.log(`[${data.length}] repositories found`);
                                      //console.log(data);
                                      return data;
                                    });
      console.log('Repositories fetched in response:', response.data.length);
      repos = response.data;
    } catch (error) {
      console.error('Error fetching repositories:', error);
    }
  }

  await getRepositories();
}

app.get('/info', (req, res) => {
  // check if user already authenticated
  if (!repos.length) {
    res.send('No repositories found. Go to <a href="/auth">/auth</a> to authenticate.');
    return;
  }
  console.log('Received info request');
  let repoNames = repos.map(repo => repo.full_name);
  res.send(`[${repos.length}] Repositories found: <pre>` + JSON.stringify(repoNames, null, 2) + `</pre>`);
});

app.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`);
  exec(`xdg-open http://localhost:${port}/auth`);
});

app.on("token", async ({ token, octokit }) => {
  console.log(`Token retrieving for ${octokit.auth.username}`);
  const { data } = await octokit.request("GET /user");
  console.log(`Token retrieved for ${data.login}`);
});