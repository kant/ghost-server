import React from 'react';

import GhostApiClient from 'ghost-api-client';

export default class UploadPage extends React.Component {
  state = {
    avatarFile: null,
  };

  componentDidMount() {
    this._client = GhostApiClient('http://localhost:1380');
    window.client = this._client;
  }

  async _uploadFileAsync() {
    let result = await this._client(
      /* GraphQL */ `
        mutation($file: Upload!) {
          singleUpload(file: $file)
        }
      `,
      { file: this.state.avatarFile[0] }
    );
    // let fileId = result.data.singleUpload.fileId;
    // console.log({ fileId });
    console.log(result);
  }

  render() {
    return (
      <div>
        <input
          type="file"
          id="avatar"
          name="avatar"
          accept="image/png, image/jpeg"
          onChange={(e) => {
            let files = e.target.files;
            this.setState({ avatarFile: files });
            window.avatarFile = files;
            console.log('changed file input', files);
          }}
        />
        <input
          type="submit"
          onClick={() => {
            console.log("submit");
            this._uploadFileAsync();
          }}
        />
      </div>
    );
  }
}
