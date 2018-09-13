import React, { Component } from "react";
import logo from "./logo.svg";
import "./App.css";

import GhostApiCliient from "ghost-api-client";

let api = new GhostApiCliient();

class GhostApiExample extends React.Component {
  state = {
    isLoggedIn: false,
    username: null,
    password: null,
    result: null
  };

  _loginAsync = async () => {
    let result = await api.loginAsync(this.state.username, this.state.password);
    this.setState({ result });
  };

  _textChangeHandler(stateKey) {
    return event => {
      let update = {};
      update[stateKey] = event.target.value;
      console.log(update);
      this.setState(update);
    };
  }

  render() {
    return (
      <div>
        <h2>Results</h2>
        <input
          type="text"
          name="username"
          onChange={this._textChangeHandler("username ")}
        />
        <input
          name="password"
          type="password"
          onChange={this._textChangeHandler("password")}
        />
        <button
          title="Login"
          onClick={() => {
            this._loginAsync();
          }}
        />
        <p>{JSON.stringify(this.state.result)}</p>
      </div>
    );
  }
}

class App extends Component {
  render() {
    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h1 className="App-title">Welcome to React</h1>
        </header>
        <GhostApiExample />
      </div>
    );
  }
}

export default App;
