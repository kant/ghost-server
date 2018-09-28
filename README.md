Rules for this repo.

# Ten Commandments of This Repo

1. Avoid using a transpiler when possible.
2. Use `let` instead of `const` or `var`
3. Use `require` instead of `import`
4. Use the .prettierrc from the root directory
5. Use project-repl for each subproject
6. Make sure everything can be installed by just doing `yarn` in any recent officially supported version of node.
7. Keep other stuff you need to do to an absolute minimium. Ideally just cloning ghost-secret
8. Keep the server running on render.com (or whatever we migrate to).
9. Keep services directly accessible from your laptop (for now, during this early phase of development)
10. You should always be able to run ./repl in server/

# To run

1. Clone https://github.com/expo/ghost-secret into a peer directory to this one
2. `yarn` in the root of the project

### To run the repl

`cd server`

`./repl`

### To run the server

`cd server`

`yarn start`

### To deploy

Just git push
