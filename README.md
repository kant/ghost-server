# ghost-server

First, to set things up you need to do two things:

1. Clone this repo https://github.com/expo/ghost-secret

Put it either as a peer directory to this directory named `ghost-secret`;
or if you put it somewhere else, create a symlink in this directory to it.

Sorry this is an extra step, but this lets us keep secret credentials separate
so we can open source this repo.

2. `yarn` in this directory 

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
