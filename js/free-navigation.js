var allData = [];
window.onload = function () {
  const taskIntent = JSON.parse(this.localStorage.getItem('user')).taskIntent;
  //start the webgazer tracker
  webgazer
    .setRegression('ridge') /* currently must set regression and tracker */
    .setTracker('clmtrackr')
    .setGazeListener(function (data, clock) {
      if(data){
        allData.push({
          data: data,
          clock: clock,
        });
        fetch('https://dcxtextapp.herokuapp.com/api/users/saccades', {
                        method: 'POST',
                        headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({taskIntentId: taskIntent, timeInMiliseconds: Math.floor(clock), posX: data.x, posY: data.y})
                    });               
      }
    }).setOnNeedToFixPosition(function (data) {
        if(data){
        }
      }
    ).showFaceFeedbackBox(true)
    .begin()
    .showPredictionPoints(true)
    .showVideo(
      true
    ); /* shows a square every 100 milliseconds where current prediction is */

  //Set up the webgazer video feedback.
  var setup = function () {
    //Set up the main canvas. The main canvas is used to calibrate the webgazer.
    var canvas = document.getElementById('plotting_canvas');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    canvas.style.position = 'fixed';
  };

  function checkIfReady() {
    if (webgazer.isReady()) {
      setup();
    } else {
      setTimeout(checkIfReady, 100);
    }
  }
  setTimeout(checkIfReady, 100);
};

window.onbeforeunload = function () {
  //webgazer.end(); //Uncomment if you want to save the data even if you reload the page.
  //window.localStorage.clear(); //Comment out if you want to save data across different sessions
};

/**
 * Restart the calibration process by clearing the local storage and reseting the calibration point
 */
function Restart() {
  ClearCalibration();
  PopUpInstruction();
}

const onComplete = () => {
  alert('complete');
  firebase
    .firestore()
    .collection('EXPERIMENTS')
    .add({ data: allData })
    .catch((err) => alert(err.message));
  allData = [];
};
