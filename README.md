# ghost-server

First, to set things up you need to do three things:

1. Make sure you have a recent version of node. 
Do 
```
nvm install node
```
If you aren't sure.

I'm using v10.9.0 so anything newer than that should be fine.

2. Clone this repo https://github.com/expo/ghost-secret

Put it either as a peer directory to this directory named `ghost-secret`;
or if you put it somewhere else, create a symlink in this directory to it.

```sh
ln -s <PWD of ghost-secret directory> <PWD of ghost-server directory>
```

Sorry this is an extra step, but this lets us keep secret credentials separate
so we can open source this repo.

3. `yarn` in this directory 

Now, you can do three things that are useful:

To get a repl, do
```
./repl
```

To run the server, do
```
yarn start
```

To connect to the database, do
```
./pgcli
```

You might have to do `brew install pgcli` first if you don't have pgcli 
installed already.
