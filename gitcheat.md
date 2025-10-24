### Essential Git Branching Cheatsheet

A quick reference for the most common Git branching commands.

#### 🌿 Creating & Switching Branches

* Create a new branch and switch to it:
    ```
    git switch -c new--branch-name
    ```
    *(Or the classic `git checkout -b new-branch-name`)*

* Switch to an existing branch:
    ```
    git switch existing-branch-name
    ```

* List all local branches:
    ```
    git branch
    ```

* List all remote branches:
    ```
    git branch -r
    ```

* List all local and remote branches:
    ```
    git branch -a
    ```

#### 💾 Saving Your Work

* Stage changes for commit:
    ```
    git add .
    ```

* Commit your staged changes:
    ```
    git commit -m "Your descriptive message here"
    ```

* Push your branch to the remote:
    ```
    git push -u origin your-branch-name
    ```

#### 🔄 Merging & Updating

* Switch to your main branch:
    ```
    git switch main
    ```

* Pull the latest changes from the remote:
    ```
    git pull origin main
    ```

* Merge your feature branch into main:
    ```
    git merge your-branch-name
    ```

#### 🧹 Cleaning Up

* Delete a local branch:
    ```
    git branch -d branch-to-delete
    ```

* Delete a remote branch:
    ```
    git push origin --delete branch-to-delete
    ```   ``` ```
