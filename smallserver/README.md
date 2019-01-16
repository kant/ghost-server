Get playlist data:

```
# Write your query or mutation here
query {
  playlist(playlistId: "playlist:ghost-games") {
    playlistId
    name
    description
    createdTime
    coverImage {
      imgixUrl
      height
      width
    }
    user {
      userId
      name
      username
      isReal
      photo {
        imgixUrl
        height
        width
      }
    }
    mediaItems {
      name
      published
      createdTime
      updatedTime
      instructions
      description
      mediaUrl
      mediaId
      jamVotingUrl
      coverImage {
        url
        imgixUrl
        height
        width
      }
      user {
        userId
        name
        username
        isReal
        photo {
          imgixUrl
          height
          width
        }
      }
    }
  }
}
```
