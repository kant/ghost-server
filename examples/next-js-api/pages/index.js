import React from 'react';

class GhostApiExample extends React.Component {
  state = {
    sessionKey: null,
    loginResult: null,
    getMediaResult: null,
    getAllMediaResult: null,
    newMediaResult: null,

    username: null,
    password: null,
    mediaId: null,
  };

  _loginAsync = async () => {
    let result = await this._api.loginAsync(this.state.username, this.state.password);
    this.setState({ loginResult: result });
  };

  _getAllMediaAsync = async () => {
    let result = await this._api.callAsync('getAllMedia');
    this.setState({ getAllMediaResult: result });
  };

  componentDidMount() {
    let GhostApiClient = require('ghost-api-client');
    this._api = new GhostApiClient();
    if (window) {
      window._Api = this._api;
    }
  }

  _textChangeHandler(stateKey) {
    return (event) => {
      let x = {};
      x[stateKey] = event.target.value;
      this.setState(x);
      console.log(x);
    };
  }

  render() {
    return (
      <div>
        <style jsx global>
          {`
            body {
              font-family: Helvetica;
            }
            .box {
              borderColor: 'black',
              borderStyle: 'solid',
              borderRadius: 3,
              borderWidth: 2,
              padding: 8,
            }
          `}
        </style>

        <div className="box">
          <h3>Login</h3>
          <p>
            Username
            <input type="text" name="username" onChange={this._textChangeHandler('username')} />
          </p>
          <p>
            Password
            <input
              autoComplete="off"
              type="password"
              name="password"
              onChange={this._textChangeHandler('password')}
            />
          </p>
          <p>
            <button
              title="Login"
              onClick={() => {
                this._loginAsync();
              }}>
              Login
            </button>
          </p>
          <p>
            Result: <code>{JSON.stringify(this.state.loginResult)}</code>
          </p>
        </div>
        <div className="box">
          <h2>Media</h2>
          <h3>getAllMedia</h3>
          <p>
            <button
              title="Login"
              onClick={() => {
                this._getAllMediaAsync();
              }}>
              Get All Media
            </button>
          </p>
          <p>
            Result: <code>{JSON.stringify(this.state.getAllMediaResult)}</code>
          </p>
        </div>
      </div>
    );
  }
}

export default GhostApiExample;
