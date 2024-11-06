# find-action-used

This repository contains the code for a GitHub App that allows users to quickly find GitHub workflows that use a specific GitHub Action. 

The use case for this is the notifications from GitHub in November 2024 that tells you that you are using v3 of `actions/upload-artifact` or `actions/download-artifact` and you need to upgrade to v4. Figuring out which repos are still using it is quite a hassle, so this tool tries to fix that for you.

The app will go over all your repositories it can see, check the `.github/workflows/` folder and parse the yaml that is in them. 
It will report out the repositories and workflow files that it found that contain references to the old action version, so you can fix them.
