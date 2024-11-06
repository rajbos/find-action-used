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
let orgs = [];

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

let appOctokit; 
let userLogin;
async function startApp(token) {
  console.log('Starting app with token:', token);
  appOctokit = new Octokit({
    auth: token,
    request: {
      fetch: fetch,
    },
  });
  console.log(`Octokit initialized`);
  async function getRepositories() {
    // first fetch the current user
    const user = await appOctokit.request('GET /user')
                                    .then(response => {
                                      // store the user repos for later use
                                      return response.data;
                                    });
    userLogin = user.login;
    console.log(`Fetching repositories for user [${userLogin}]`);
    try {
      const response = await appOctokit.paginate(`GET /users/${userLogin}/repos`)
                                    .then((response) => {
                                      console.log(`[${response.length}] repositories found for user [${userLogin}]`);
                                      return response;
                                    });
      // store the user repos for later use
      console.log('Repositories fetched in response:', response.length);
      repos = response;
      
      // scan for the orgs the user has access to
      orgs = await appOctokit.request("GET /user/orgs")
                              .then(response => {
                                console.log(`[${response.data.length}] orgs found`);
                                return response.data;
                              });
    } catch (error) {
      console.error('Error fetching repositories:', error);
    }
  }

  await getRepositories();
}

app.get('/info', (req, res) => {
  // check if user already authenticated
  if (!userLogin) {
    res.send('Login first. Go to <a href="/auth">/auth</a> to authenticate.');
    return;
  }
  console.log('Received info request');
  let repoNames = repos.map(repo => repo.full_name);
  let response = `[${repos.length}] Repositories found: <pre>` + JSON.stringify(repoNames, null, 2) + `</pre><br>`;
  
  if (orgs !== undefined && orgs.length > 0) {
    console.log(`[${orgs.length}] orgs found: ` + JSON.stringify(orgs, null, 2));
    const orgNames = orgs.map(org => org.login);
    console.log(`[${orgs.length}] orgs found: ` + JSON.stringify(orgNames, null, 2));
    response += `Organizations found: <pre>` + JSON.stringify(orgNames, null, 2) + `</pre>`;
  }
  else {
    response += `No organizations found`;
  }

  res.send(response);
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