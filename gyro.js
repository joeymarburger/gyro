/* ===================================================
* gyro.js v1.0.0
* http://github.com/joeymarburger/gyro
* ===================================================
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
* http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
* ========================================================== */

$(function(){
	
	// Global variables
	var $gyro,
	gyroInterval,
	current = 0, // Controls the loop against the threshhold to tune data output
	threshhold = 20, // How often data is displayed, not for data sending
	gyrox = 0,
	gyroy = 0,
	gyroz = 0,
	gyrovx = 0,
	gyrovy = 0,
	gyrovz = 0,
	gyroax = 0,
	gyroay = 0,
	gyroaz = 0,
	gyroai = 0,
	gyroarAlpha = 0,
	gyroarBeta = 0,
	gyroarGamma = 0,
	gyrodelay = 100,
	gyrovMultiplier = 0.01,
	gyroalpha = 0,
	gyrobeta = 0,
	gyrogamma = 0,
	gyroenabletilt = false,
	gyroplane,
	gyrosimdegree,
	rotateSim,
	makeGyroColor,
	makeAcceleratedColor,
	gyrod2h,
	gyroh2d,
	showsimulator = false,
	shaketoggle = true,
	gyroactive = false,
	simactive = false,
	trackdata = true, // Change this to true to enable data capturing
	datasamplerate = 5000, // Change this to enable data capturing, in milliseconds
	showdatamessage = true, // If you want the alert bar to display at the top when data is sent
	sendGyroData, // The function to handle data capturing via ajax or whatever
	dataurl = '',
	gyroMotionHandler,
	gyroOrientationHandler,
	toggleGyro,
	toggleSim,
	initializeGyro,
	initializePlatform,
	resetData,
	trackOrientation,
	deviceorientation,
	pingNetwork, // Function to control connectivity detection
	connection = true; // Detect connectivity for data sending/receiving
	
	// Setup
	if(shaketoggle){
		$('input#shake-toggle').prop('checked', true); }
	if(trackdata){
		$('input#data-toggle').prop('checked', true); }
	if(showdatamessage){
		$('input#show-data-toggle').prop('checked', true); }
	if(showsimulator){
		toggleSim();
		$('input#sim-toggle').prop('checked', true); }
		
	$('input#data-toggle').click(function(){
		if(this.checked){
			trackdata = true;
			datasamplerate = 5000;
		} else {
			trackdata = false;
			datasamplerate = 0;
		}
	});
	$('input#show-data-toggle').click(function(){
		if(this.checked){
			showdatamessage = true;
		} else {
			showdatamessage = false;
		}
	});
	$('input#sim-toggle').click(function(){
		toggleSim();
	});
	
	var onlabel = '<span class="label label-success nocorners">On <i class="icon-ok-circle"></i></span>';
	var offlabel = '<span class="label label-important nocorners">Off <i class="icon-off"></i></span>';
	
	pingNetwork = function(){
		var c = navigator.onLine;
		if(c){
			connection = true;
		} else {
			connection = false;
		}
	};
	// Ping for connection every 30 secs
	setInterval(function(){
		pingNetwork();
	},30000);
	
	// Orientation
	trackOrientation = function(){
		if(window.orientation == 90 || window.orientation == -90){
			deviceorientation = 'Landscape';
		} else {
			deviceorientation = 'Portrait';
		}
		document.getElementById("orientationlabel").innerHTML = deviceorientation;
	};
	
	// Clear all data when toggled off
	resetData = function(){
		
		gyroactive = false;
		simactive = false;
		document.getElementById("simphone-degree").innerHTML = "--&deg;";
		rotateSim(0,0,0);
		
		document.getElementById("accelcolor").innerHTML = '<span class="head">Color: </span>';
		document.getElementById("accelcolor").style.background = '#cccccc';
		document.getElementById("accel").style.background = '#f5f5f5';
		document.getElementById("accel").style.color = "#000000";
		document.getElementById("gyrocolor").innerHTML = '<span class="head">Color: </span>';
		document.getElementById("gyrocolor").style.background = '#cccccc';
		document.getElementById("gyro").style.background = '#f5f5f5';
		document.getElementById("gyro").style.color = "#000000";
		
		document.getElementById("xlabel").innerHTML = "x: ";
		document.getElementById("ylabel").innerHTML = "y: ";
		document.getElementById("zlabel").innerHTML = "z: ";
		document.getElementById("ilabel").innerHTML = "i: ";
		document.getElementById("arAlphaLabel").innerHTML = "arA: ";															
		document.getElementById("arBetaLabel").innerHTML = "arB: ";
		document.getElementById("arGammaLabel").innerHTML = "arG: ";																									
		document.getElementById("alphalabel").innerHTML = "Alpha (&alpha;): ";
		document.getElementById("betalabel").innerHTML = "Beta (&beta;): ";
		document.getElementById("gammalabel").innerHTML = "Gamma (&gamma;): ";
		document.getElementById("orientationlabel").innerHTML = "";
		
		initializePlatform();
		
	};
	
	// Toggle Gyro on/off
	toggleGyro = function(){
		if(gyroactive){
			gyroactive = false;
			document.getElementById("gyrosupport").innerHTML = offlabel;
			document.getElementById("togglegyro").innerHTML = '<i class="icon-off icon-2x"></i>';
		} else {
			gyroactive = true;
			document.getElementById("gyrosupport").innerHTML = onlabel;
			document.getElementById("togglegyro").innerHTML = '<i class="icon-remove-circle icon-2x"></i>';
			trackOrientation();
		}
		initializePlatform();
	};
	
	$('#togglegyro').click(function(e){
		e.preventDefault();
		$(this).toggleClass('btn-success');
		$(this).toggleClass('btn-danger');
		toggleGyro();
		return false;
	});
	
	toggleSim = function(){
		$('#compass').toggleClass('no-sim');
		$('#simphone').toggle();
		
		if(simactive){
			simactive = false;
			//document.getElementById("togglesim").innerHTML = '<i class="icon-mobile-phone icon-2x light"></i>';
			$('input#sim-toggle').prop('checked', false);
		} else {
			simactive = true;
			//document.getElementById("togglesim").innerHTML = '<i class="icon-mobile-phone icon-2x"></i>';
		}
		$('#simphone-degree-container').toggle();
	};
	
	$('#togglesim').click(function(e){
		e.preventDefault();
		toggleSim();
		return false;
	});
	
	$('#toggleoptions').click(function(e){
		e.preventDefault();
		$('#options-bar').toggle();
		return false;
	});
	
	$('#resetdata').click(function(e){
		e.preventDefault();
		resetData();
		return false;
	});
	
	sendGyroData = function(mEvent){
		
		// Put your database or storage 
		// stuff here for tracking
		if(mEvent){
			
			// Connection?
			if(connection && dataurl){
				
				// Ajax out data
				//var send_data = $.serialize(mEvent);
				$.ajax({
				  type: "POST",
				  url: dataurl,
					data: JSON.stringify( mEvent ),
				   success: function(data){
						if(showdatamessage){
							$('#data-sent-log').html('<div class="alert alert-success"><span class="bold up"><strong>Data sent! <i class="icon-cloud"></i></span> '+data.length+'</div>');
							$('#header').parent('div').toggleClass('alert-offset');
							setTimeout(function(){
								$('#data-sent-log').html('');
								$('#header').parent('div').toggleClass('alert-offset');
								},5000);
						}
				   },
					 complete: function() {
						
					 },
				   error: function(XMLHttpRequest, textStatus, errorThrown) {
				       if(textStatus == 'timeout') {
				         if(showdatamessage){
									$('#data-sent-log').html('<div class="alert alert-danger"><span class="bold up"><strong>Connection unavailable! <i class="icon-frown"></i></span> '+data.length+'</div>');
									$('#header').parent('div').toggleClass('alert-offset');
									setTimeout(function(){
										$('#data-sent-log').html('');
										$('#header').parent('div').toggleClass('alert-offset');
										},5000);
								}
				       }
				   }
				 });
			}
			
		}
	};
	
	rotateSim = function(degree,skew,tilt){
		$('#simphone-degree').html(degree+'&deg;');
		var $elie = $("#simphone");
	    $elie.css({ WebkitTransform: 'rotate(' + degree + 'deg)'});
	    $elie.css({ '-moz-transform': 'rotate(' + degree + 'deg)'});
			//$elie.css({ WebkitTransform: 'scaleY(' + skew + ')'});
	    //$elie.css({ '-moz-transform': 'scaleY(' + skew + ')'});
			//$elie.css({ WebkitTransform: 'skewX(' + tilt + 'deg)'});
	    //$elie.css({ '-moz-transform': 'skewX(' + tilt + 'deg)'});
	};
	
	gyrod2h = function(d) { return d.toString(16); };
	gyroh2d = function(h) { return parseInt(h,16); };
	
	makeGyroColor = function(a, b, c) {
		red = Math.abs(a) % 255;
		green = Math.abs(b) % 255;
		blue = Math.abs(c) % 255;
		return "#" + gyrod2h(red) + gyrod2h(green) + gyrod2h(blue);
	};
	
	makeAcceleratedColor = function(a, b, c) {
		red = Math.round(Math.abs(a + gyroaz) % 255);
		green = Math.round(Math.abs(b + gyroay) % 255);
		blue = Math.round(Math.abs(c + gyroaz) % 255);
		return "#" + gyrod2h(red) + gyrod2h(green) + gyrod2h(blue);
	};
	
	// Collect where data is going
	initializeGyro = function (gyro) {
		$gyro = $(gyro);
		
		// Data output
		$dataoutput = $gyro.find('#dataoutput');
		
		/*gyroInterval = setInterval(function() {	
			document.getElementById("gyrosupport").innerHTML = '<span class="label label-success">On</span> - Send data...';
		}, delay);*/
		
	};
	
	$('#simphone').click(function(){
		// Reset sim
		rotateSim(0,0,0);
		return false;
	});
	
	// Handle device orientation rotation
	gyroOrientationHandler = function(rotation){
		gyroalpha = Math.round(rotation.alpha);
		gyrobeta = Math.round(rotation.beta);
		gyrogamma = Math.round(rotation.gamma);
		
		// Rotate phone
		if(simactive){
			$('#simphone-degree').html(-gyroalpha);
			rotateSim(-gyroalpha,-gyrogamma,-gyrobeta);
		}
		
		document.getElementById("alphalabel").innerHTML = "Alpha (&alpha;): " + gyroalpha;
		document.getElementById("betalabel").innerHTML = "Beta (&beta;): " + gyrobeta;
		document.getElementById("gammalabel").innerHTML = "Gamma (&gamma;): " + gyrogamma;
		document.getElementById("gyrocolor").innerHTML = '<span class="head">Color: ' + makeGyroColor(gyroalpha, gyrobeta, gyrogamma) + '</span>';
		document.getElementById("gyrocolor").style.background = makeGyroColor(gyroalpha, gyrobeta, gyrogamma);
		document.getElementById("gyro").style.background = makeGyroColor(gyroalpha, gyrobeta, gyrogamma);
		document.getElementById("gyrocolor").style.color = "#FFFFFF";
		document.getElementById("gyro").style.color = "#FFFFFF";
		document.getElementById("gyrocolor").style.fontWeight = "bold";
	};
	
	// Handle device motion
	gyroMotionHandler = function(motion){
		current++;
		//if (current%datasamplerate != 0) {return;}
		
		gyrox = Math.round(Math.abs(motion.acceleration.x * 1));
		gyroy = Math.round(Math.abs(motion.acceleration.y * 1));
		gyroz = Math.round(Math.abs(motion.acceleration.z * 1));
		gyroax = Math.round(Math.abs(motion.accelerationIncludingGravity.x * 1));
		gyroay = Math.round(Math.abs(motion.accelerationIncludingGravity.y * 1));
		gyroaz = Math.round(Math.abs(motion.accelerationIncludingGravity.z * 1));		
		gyroai = Math.round(motion.interval * 100) / 100;
		rR = motion.rotationRate;
		if (rR != null) {
			gyroarAlpha = Math.round(rR.alpha);
			gyroarBeta = Math.round(rR.beta);
			gyroarGamma = Math.round(rR.gamma);
		}
		
		// Detect Shake
		if(shaketoggle){
			var sensitivity = 80;
			var x2 = 0, y2 = 0, z2 = 0;
		
			setInterval(function () {
			var change = Math.abs(gyroax-x2+gyroay-y2+gyroaz-z2);
			if (change > sensitivity) {
				// Toggle Gyro Off
				toggleGyro();
				resetData();
				
				// Show message
				$('#shake-alert').fadeIn();
				setTimeout(function(){
					$('#shake-alert').fadeOut();
				},3000);
			}

			// Update new position
			x2 = gyroax;
			y2 = gyroay;
			z2 = gyroaz;
			}, 150);
		}
		
		var motionEvent = {
        "interval": motion.interval,
        "acceleration": {
            "x": gyrox,
            "y": gyroy,
            "z": gyroz
        }, "accelerationIncludingGravity": { 
            "x": gyroax,
            "y": gyroay,
            "z": gyroaz
        }, "rotationRate": {
            "alpha": gyroarAlpha,
            "beta": gyroarBeta,
            "gamma": gyroarGamma
        }, "colors": {
						"accColor": makeGyroColor(gyroax, gyroay, gyroaz),
						"gyroColor": makeGyroColor(gyroalpha, gyrobeta, gyrogamma)
				}
    };

		gyroalpha = Math.round(motion.alpha);
		gyrobeta = Math.round(motion.beta);
		gyrogamma = Math.round(motion.gamma);
		
		if(current==(threshhold*2)){
			if(trackdata && datasamplerate > 0){
				sendGyroData(motionEvent);
			}
			current = 0;
		}
			
			// Output Data to Page
			document.getElementById("xlabel").innerHTML = "x: " + gyroax;
			document.getElementById("ylabel").innerHTML = "y: " + gyroay;
			document.getElementById("zlabel").innerHTML = "z: " + gyroaz;
			document.getElementById("ilabel").innerHTML = "i: " + gyroai;
			document.getElementById("arAlphaLabel").innerHTML = "arA: " + gyroarAlpha;															
			document.getElementById("arBetaLabel").innerHTML = "arB: " + gyroarBeta;
			document.getElementById("arGammaLabel").innerHTML = "arG: " + gyroarGamma;

			document.getElementById("accelcolor").innerHTML = '<span class="head">Color: ' + makeGyroColor(gyroax, gyroay, gyroaz) + '</span>';
			document.getElementById("accelcolor").style.background = makeGyroColor(gyroax, gyroay, gyroaz);
			document.getElementById("accel").style.background = makeGyroColor(gyroax, gyroay, gyroaz);
			document.getElementById("accelcolor").style.color = "#FFFFFF";
			document.getElementById("accel").style.color = "#FFFFFF";
			document.getElementById("accelcolor").style.fontWeight = "bold";

			// Gamma nav example
			/*if(gyrogamma >= 25 && gyrogamma <= 30 && (gyroarGamma >= 15 || gyroarGamma <= -15)){
				console.log('Forward! '+gyrogamma+'&gamma;, '+gyroarGamma+'ar&gamma;');
			}
			if(gyrogamma <= -25 && gyrogamma >= -30 && (gyroarGamma >= 15 || gyroarGamma <= -15)){
				//window.history.back();
				console.log('Back! '+gyrogamma+'&gamma;, '+gyroarGamma+'ar&gamma;');
			}*/
		
	};

	// Platform setup
	initializePlatform = function(){
		
		if(gyroactive){
			document.getElementById("gyrosupport").innerHTML = onlabel;
			
			// Rotation orientation listener
			window.addEventListener('deviceorientation', gyroOrientationHandler, false);
			
			// Motion listener
			window.addEventListener('devicemotion', gyroMotionHandler, false);
			
			// Orientation detection
			var supportsOrientationChange = "onorientationchange" in window,
				orientationEvent = supportsOrientationChange ? "orientationchange" : "resize";

			window.addEventListener(orientationEvent, function () {
				trackOrientation();
			}, false);
			
			// Init data against a holder
			// for testing output
			initializeGyro('#data');
			
		} else {
			document.getElementById("gyrosupport").innerHTML = offlabel;
			window.DeviceMotionEvent = null;
			window.removeEventListener('deviceorientation', gyroOrientationHandler, false);
			window.removeEventListener('devicemotion', gyroMotionHandler, false);
			
			resetData();
		} // gyroactive?
		
	}; // initializePlatform();
	
	// Main init
	// Check for device support
	if (window.DeviceMotionEvent && isMobile) {
		initializePlatform();
	} else {
		document.getElementById("gyrosupport").innerHTML = '<span class="label label-important">Error <i class="icon-warning-sign"></i></span>';
		document.getElementById("data").innerHTML = '<div class="text-center alert alert-danger"><h3>Device or browser not supported.</h3></div>';
		document.getElementById("toggle-buttons").style.visibility = 'hidden';
	}

}); // Close main function