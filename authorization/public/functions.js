export function giveMusicInserts(){};
export function giveUserInserts(){};
/* TABLES
  Users: userID, Name
  Music: trackID, trackName, Acousticness, Danceability, Energy, Livelyness, Valence, Speechiness, Tempo
  UserTracks: UserID, MusicID*/
  function giveMusicInserts(trackList, features){
    var statements = [];
    let i = 0;
    features.forEach(index => {
      let songName = trackList[i].name;
      let songID = trackList[i].id;
      let Acousticness = features[i].acousticness;
      let Danceability = features[i].danceability;
      let Energy = features[i].energy;
      let Liveness = features[i].liveness;
      let Valence = features[i].valence;
      let Speechiness = features[i].speechiness;
      let Tempo = features[i].tempo;
      statements.push(`INSERT INTO Music VALUES (${songID}, ${songName}, ${Acousticness}, ${Danceability},  ${Energy}, ${Liveness}, ${Valence}, ${Speechiness}, ${Tempo})`);
      i++;
    })
   console.log(statements);
    return statements;
  }

  function giveUserInserts(userInfo){
    var statements = []
    let userID = userInfo.id;
    let userName = userInfo.display_name;
    statements.push(`INSERT INTO Users VALUES (${userID}, ${userName})`);
    console.log(statements);
    return statements;
  }