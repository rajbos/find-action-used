import 'dotenv/config';
import { Octokit } from "@octokit/rest";
import express from "express";
import fetch from "node-fetch";
import { OAuthApp } from "@octokit/oauth-app";

const port = 3001;
const clientId = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;

const auth = new OAuthApp({
  clientType: 'oauth-app',
  clientId,
  clientSecret,
  request: {
    fetch: fetch,
  },
});

const app = express();

app.get('/auth', (req, res) => {
  try {
    const { url, scopes } = auth.getWebFlowAuthorizationUrl({
      scopes: ['repo'],
    });
    res.redirect(url);
  } catch (error) {
    console.error('Error generating auth URL:', error);
    res.status(500).send('Error generating auth URL');
  }
});

app.get('/callback', async (req, res) => {
  const { code } = req.query;
  try {
    const tokenResponse = await auth.createToken({ code });
    const token = tokenResponse.authentication.token;
    if (!token) {
      throw new Error('Token is undefined');
    }
    res.redirect(`/?token=${token}`);
  } catch (error) {
    console.error('Error during callback:', error);
    res.status(500).send('Error during callback');
  }
});

app.get('/repositories', async (req, res) => {
  const token = req.query.token;
  if (!token) {
    return res.status(400).send('Token is required');
  }

  const octokit = new Octokit({
    auth: token,
    request: {
      fetch: fetch,
    },
  });

  try {
    const user = await octokit.request('GET /user');
    const repos = await octokit.paginate(`GET /users/${user.data.login}/repos`);
    res.json(repos);
  } catch (error) {
    console.error('Error fetching repositories:', error);
    res.status(500).send('Error fetching repositories');
  }
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
