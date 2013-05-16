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
	gyroactive = false,
	simactive = false,
	trackdata = false, // Change this to true to enable data capturing
	datasamplerate = 0, // Change this to enable data capturing
	sendGyroData, // The function to handle data capturing via ajax or whatever
	gyroMotionHandler,
	gyroOrientationHandler,
	toggleGyro,
	initializeGyro,
	initializePlatform,
	resetData,
	trackOrientation,
	deviceorientation;
	
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
		trackdata = false;
		datasamplerate = 0;
		
		document.getElementById("simphone-degree").innerHTML = "--";
		
		rotateSim(0);
		
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
		
		
	};
	
	// Toggle Gyro on/off
	toggleGyro = function(){
		if(gyroactive){
			gyroactive = false;
			document.getElementById("gyrosupport").innerHTML = '<span class="label label-important">Off</span>';
			document.getElementById("togglegyro").innerHTML = 'Start Gyro';
		} else {
			gyroactive = true;
			document.getElementById("gyrosupport").innerHTML = '<span class="label label-success">On</span>';
			document.getElementById("togglegyro").innerHTML = 'Stop Gyro';
			
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
	
	$('#togglesim').click(function(e){
		e.preventDefault();
		$(this).toggleClass('btn-inverse');
		$(this).toggleClass('btn-danger');
		$('#compass').toggleClass('no-sim');
		$('#simphone').toggle();
		
		if(simactive){
			simactive = false;
			document.getElementById("togglesim").innerHTML = 'Show Simulator';
		} else {
			simactive = true;
			document.getElementById("togglesim").innerHTML = 'Hide Simulator';
		}
		$('#simphone-degree-container').toggle();
		return false;
	});
	
	sendGyroData = function(mEvent){
		
		// Put your database or storage 
		// stuff here for tracking
		if(mEvent){
			//mEvent["accelerationIncludingGravity"].z
			$('#data-sent-log').html('<div class="alert alert-success"><span class="bold up"><strong>Data sent!</span></div>');
			setTimeout(function(){
				$('#data-sent-log').html('');
			},3000);
		}
	};
	
	rotateSim = function(degree){
		$('#simphone-degree').html(degree);
		var $elie = $("#simphone");
	    // For webkit browsers: e.g. Chrome
	    $elie.css({ WebkitTransform: 'rotate(' + degree + 'deg)'});
	    // For Mozilla browser: e.g. Firefox
	    $elie.css({ '-moz-transform': 'rotate(' + degree + 'deg)'});
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
		
		gyroInterval = setInterval(function() {	
			document.getElementById("gyrosupport").innerHTML = '<span class="label label-success">On</span> - Send data...';
		}, delay);
		
	};
	
	// Handle device orientation rotation
	gyroOrientationHandler = function(rotation){
		gyroalpha = Math.round(rotation.alpha);
		gyrobeta = Math.round(rotation.beta);
		gyrogamma = Math.round(rotation.gamma);
		
		// Rotate phone
		if(simactive){
			$('#simphone-degree').html(-gyroalpha);
			rotateSim(-gyroalpha);
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
		
		if(current==(threshhold*5)){
			
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
			document.getElementById("gyrosupport").innerHTML = '<span class="label label-success">On</span>';
			
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
			document.getElementById("gyrosupport").innerHTML = '<span class="label label-important">Off</span>';
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
		document.getElementById("gyrosupport").innerHTML = '<span class="label label-important">Not Supported</span>';
	}

}); // Close main function