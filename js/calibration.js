var PointCalibrate = 0;
var CalibrationPoints = {};
var allData = [];
/**
 * Clear the canvas and the calibration button.
 */
function ClearCanvas() {
  $('.Calibration').hide();
  var canvas = document.getElementById('plotting_canvas');
  canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
}

/**
 * Show the instruction of using calibration at the start up screen.
 */
function PopUpInstruction() {
  ClearCanvas();
  swal({
    title: 'Calibración',
    text:
      'Debes hacer click en cada uno de los 9 puntos que aparecen en pantalla, debes hacer click en cada uno hasta que se vuelva amarillo',
    buttons: {
      cancel: false,
      confirm: true,
    },
  }).then((isConfirm) => {
    ShowCalibrationPoint();
  });
}
/**
 * Show the help instructions right at the start.
 */
function helpModalShow() {
  $('#helpModal').modal('show');
}

/**
 * Load this function when the index page starts.
 * This function listens for button clicks on the html page
 * checks that all buttons have been clicked 5 times each, and then goes on to measuring the precision
 */
$(document).ready(function () {
  const taskIntent = JSON.parse(localStorage.getItem('user')).taskIntent;
  ClearCanvas();
  helpModalShow();
  $('.Calibration').click(function () {
    // click event on the calibration buttons

    var id = $(this).attr('id');

    if (!CalibrationPoints[id]) {
      // initialises if not done
      CalibrationPoints[id] = 0;
    }
    CalibrationPoints[id]++; // increments values

    if (CalibrationPoints[id] == 1) {
      //only turn to yellow after 5 clicks
      $(this).css('background-color', 'yellow');
      $(this).prop('disabled', true); //disables the button
      PointCalibrate++;
    } else if (CalibrationPoints[id] < 5) {
      //Gradually increase the opacity of calibration points when click to give some indication to user.
      var opacity = 0.2 * CalibrationPoints[id] + 0.2;
      $(this).css('opacity', opacity);
    }

    //Show the middle calibration point after all other points have been clicked.
    if (PointCalibrate == 8) {
      $('#Pt5').show();
    }

    if (PointCalibrate >= 9) {
      // last point is calibrated
      //using jquery to grab every element in Calibration class and hide them except the middle point.
      $('.Calibration').hide();
      $('#Pt5').show();

      // clears the canvas
      var canvas = document.getElementById('plotting_canvas');
      canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);

      // notification for the measurement process
      swal({
        title: 'Calculando medida',
        text:
          'Por favor no muevas el mouse por 5 segundos, esto nos ayudarà a saber el porcentaje de fectividad.',
        closeOnEsc: false,
        allowOutsideClick: false,
        closeModal: true,
      }).then((isConfirm) => {
        // makes the variables true for 5 seconds & plots the points
        $(document).ready(function () {
          store_points_variable(); // start storing the prediction points

          sleep(5000).then(() => {
            stop_storing_points_variable(); // stop storing the prediction points
            var past50 = get_points(); // retrieve the stored points
            var precision_measurement = calculatePrecision(past50);
            var accuracyLabel =
              '<a>Accuracy | ' + precision_measurement + '%</a>';
            swal({
              title: 'La precisón es' + precision_measurement + '% ',
              allowOutsideClick: false,
              buttons: {
                cancel: 'Recalibrate',
                confirm: precision_measurement >= 10,
              },
            }).then((isConfirm) => {
              if (isConfirm) {
                //clear the calibration & hide the last middle button
                ClearCanvas();

                webgazer
                  .showFaceFeedbackBox(false)
                  .showPredictionPoints(false)
                  .showFaceOverlay(false)
                  .showVideo(false)
                  .setGazeListener(function (data, clock) {
                    if (data) {
                      allData.push({
                        data: data,
                        clock: clock,
                      });
                      fetch(
                        'https://dcxtextapp.herokuapp.com/api/users/saccades',
                        {
                          method: 'POST',
                          headers: {
                            Accept: 'application/json',
                            'Content-Type': 'application/json',
                          },
                          body: JSON.stringify({
                            taskIntentId: taskIntent,
                            timeInMiliseconds: Math.floor(clock),
                            posX: data.x,
                            posY: data.y,
                          }),
                        }
                      );
                    }
                  })
                  .setOnNeedToFixPosition(function (data) {
                    if (data) {
                    }
                  });
                $('#page-container').show();
                $('#calibrationDiv').hide();
                var iframepos = $('#iframe').position();

                var iframepos = $('#iframe').position();
                var iframe = document.getElementById('iframe');
                iframe.contentWindow.postMessage(
                  {
                    clickUrl:
                      'http://localhost:8082/api/users/mouse-saccades',
                    clickData: {
                      taskIntentId: taskIntent,
                      clockStart: webgazer.getClockStart()
                    },
                    locationUrl:
                      'http://localhost:8082/api/users/task-intent-url',
                    locationData: {
                      taskIntentId: taskIntent,
                    },
                  },
                  'http://localhost:3002/'
                );
              } else {
                window.location.reload();
                //use restart function to restart the calibration
                ClearCalibration();
                ClearCanvas();
                ShowCalibrationPoint();
              }
            });
          });
        });
      });
    }
  });
});

/**
 * Show the Calibration Points
 */
function ShowCalibrationPoint() {
  $('.Calibration').show();
  $('#Pt5').hide(); // initially hides the middle button
}

/**
 * This function clears the calibration buttons memory
 */
function ClearCalibration() {
  //window.localStorage.clear();
  $('.Calibration').css('background-color', 'red');
  $('.Calibration').css('opacity', 0.2);
  $('.Calibration').prop('disabled', false);

  CalibrationPoints = {};
  PointCalibrate = 0;
}

// sleep function because java doesn't have one, sourced from http://stackoverflow.com/questions/951021/what-is-the-javascript-version-of-sleep
function sleep(time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}
