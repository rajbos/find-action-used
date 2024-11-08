# find-action-used

This repository contains the code for a GitHub App that allows users to quickly find GitHub workflows that use a specific GitHub Action. 

The use case for this is the notifications from GitHub in November 2024 that tells you that you are using v3 of `actions/upload-artifact` or `actions/download-artifact` and you need to upgrade to v4. Figuring out which repos are still using it is quite a hassle, so this tool tries to fix that for you.

The app will go over all your repositories it can see, check the `.github/workflows/` folder and parse the yaml that is in them. 
It will report out the repositories and workflow files that it found that contain references to the old action version, so you can fix them.

## OAuth Authentication Process

1. The app will prompt the user to authenticate via OAuth.
2. The user will be redirected to GitHub to grant access to their repositories.
3. Once authenticated, the app will receive an access token to interact with the GitHub API on behalf of the user.

## Reading Repositories and Searching for Workflows

1. The app will use the access token to fetch all repositories accessible to the authenticated user.
2. For each repository, the app will look for the `.github/workflows` folder.
3. The app will search for `yml` or `yaml` files within the `.github/workflows` folder.
4. The app will parse the yaml content of each file to find lines containing `uses: actions/download-artifact` and `uses: actions/upload-artifact`.
5. The app will extract the version number or sha hash from the line, which is located at the end of the line behind the `@` character.

## Running the React App Locally

1. Clone the repository:
   ```sh
   git clone https://github.com/rajbos/find-action-used.git
   cd find-action-used
   ```

2. Install dependencies:
   ```sh
   npm install
   ```

3. Create a `.env` file in the root of the project and add your GitHub OAuth credentials:
   ```sh
   CLIENT_ID=your_client_id
   CLIENT_SECRET=your_client_secret
   ```

4. Start the backend server:
   ```sh
   npm run server
   ```

5. Start the React app:
   ```sh
   npm start
   ```

6. Open your browser and navigate to `http://localhost:3000` to use the app.

## OAuth Setup Instructions

1. Go to your GitHub account settings and create a new OAuth App.
2. Set the "Authorization callback URL" to `http://localhost:3001/callback`.
3. Note down the `Client ID` and `Client Secret` provided by GitHub.
4. Add the `Client ID` and `Client Secret` to the `.env` file in the root of the project as shown above.
