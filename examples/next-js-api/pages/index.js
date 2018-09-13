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
    console.log(this.state);
    let result = await this._api.loginAsync(this.state.username, this.state.password);
    this.setState({ loginResult: result });
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
      <div style={{ borderColor: 'black', borderStyle: 'solid', borderRadius: 3, borderWidth: 2, padding: 8 }}>
        <style jsx global>
          {`
            body {
              font-family: Helvetica;
            }
          `}
        </style>

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
    );
  }
}

export default GhostApiExample;
