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
          uploadFile(file: $file) {
            fileId
            hash
            name
            encoding
            mimeType
            userId
            user {
              userId
              username
              name
            }
            uploadedTime
            width
            height
            rawUrl
            imgixUrl
          }
        }
      `,
      { file: this.state.avatarFile[0] }
    );
    // let fileId = result.data.singleUpload.fileId;
    // console.log({ fileId });
    if (result.data.uploadFile) {
      this.setState({ hostedFile: result.data.uploadFile });
    }
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
        <span>{this.state.avatarFile && this.state.avatarFile[0].name}</span>
        <input
          type="submit"
          title="Upload"
          onClick={() => {
            this._uploadFileAsync();
          }}
        />
        <br />
        {this.state.hostedFile && (
          <table>
            <tbody>
              <tr>
                <td>fileId</td>
                <td>{this.state.hostedFile.fileId}</td>
              </tr>
              <tr>
                <td>filename</td>
                <td>{this.state.hostedFile.name}</td>
              </tr>
              <tr>
                <td>userId</td>
                <td>{this.state.hostedFile.userId}</td>
              </tr>
              <tr>
                <td>hash</td>
                <td>{this.state.hostedFile.hash}</td>
              </tr>
              <tr>
                <td>height</td>
                <td>{this.state.hostedFile.height}</td>
              </tr>
              <tr>
                <td>width</td>
                <td>{this.state.hostedFile.width}</td>
              </tr>
              <tr>
                <td>MIME type</td>
                <td>{this.state.hostedFile.mimeType}</td>
              </tr>
              <tr>
                <td>raw hosted</td>
                <td>
                  <img src={this.state.hostedFile.rawUrl} />
                </td>
              </tr>
              <tr>
                <td>imgix hosted</td>
                <td>
                  <img src={this.state.hostedFile.imgixUrl} />
                </td>
              </tr>
            </tbody>
          </table>
        )}
      </div>
    );
  }
}
