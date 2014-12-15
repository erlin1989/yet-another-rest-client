var clientApp = angular.module('clientApp', ['ui.bootstrap', 'hljs']);

/*
//TODO is this used?
clientApp.config(function (hljsServiceProvider) {
  hljsServiceProvider.setOptions({
    // replace tab with 2 spaces
    tabReplace: '  '
  });
});
*/

/**
 *
 */
clientApp.controller('ClientController', function($scope, $http, $location, $anchorScroll, AuthService) {

	//Populate the form.
	$scope.environments = servicesConfig.environments;
	$scope.environmentSelected = servicesConfig.environments[0].id;
	$scope.services = servicesConfig.services;
	$scope.serviceSelected = servicesConfig.services[0].id;

	//Submit the configured Service Request.
	$scope.submit = function() {
		//Remove any previous errors/alerts and hide the previous response.
		$scope.alerts = [];
		$scope.displayResponse = false;

		//Update Progress Bar.
		updateProgressbar($scope, 10, 'Authenticating... ');

		//Retrieve an Authorisation Token based on the selected environment.
		var authEndpoint = configureServiceUrl($scope.environmentSelected, "auth");
		AuthService.getAuthCookie(authEndpoint).then(
			function(payload) {
				$scope.authenticationCookie = payload.authorization;

				//Determine the configured service endpoint.
				$scope.requestUrl = configureServiceUrl($scope.environmentSelected, $scope.serviceSelected, $scope.duns);

				//Call the endpoint.
				updateProgressbar($scope, 50, 'Making Service Request... ');
				callService($scope, $http, $location, $anchorScroll);
			},
			function(error) {
				var errorMessage = "An error occurred while authenticating... " + error.msg + ". Error Code: " + error.code;
				$scope.alerts.push({type: 'danger', msg: errorMessage});
			}
		);
	}

	//Remove the selected alert/error.
	$scope.closeAlert = function(index) {
		$scope.alerts.splice(index, 1);
	};
});


/**
 *
 */
clientApp.controller('ToggleController', function($scope) {
	//$scope.status = false;
	$scope.toggle = function(status) {
		$scope.status = !status;
	}
});


/**
 * Based on the selected environment and service, determine the correct URL to use.
 */
function configureServiceUrl(environmentSelected, serviceSelected, dunsSelected) {
	var url = "";
	var duns = servicesConfig.placeholderDuns;

	//Determine the endpoint based on selected Environment and Service.
	for (var i in servicesConfig.endpoints) {
		var endpoint = servicesConfig.endpoints[i];
		if (endpoint.env === environmentSelected && endpoint.service === serviceSelected) {
			url = endpoint.url;
			break;
		}
	}

	//Replace the DUNS placeholder.
	if (dunsSelected) {
		duns = replaceAll(dunsSelected, "-", "");
	}
	if (url) {
		url = url.replace("{duns}", duns);
	}
	return url;
}


/**
 * Retrieves an Authentication Cookie for a specified environment.
 */
clientApp.factory('AuthService', function($http, $q) {
	var cachedAuthCookies = [];

	return {
		getAuthCookie: function(authEndpoint) {
			var deferred = $q.defer();

			if (typeof cachedAuthCookies[authEndpoint] !== 'undefined') {
				deferred.resolve({authorization: cachedAuthCookies[authEndpoint]});
			} else {
				var AUTHENTICATION_REQUEST_CONFIG = { headers: {
					'ApplicationId': '36',
					'x-dnb-user': 'teamjoly@dnb.com',
					'x-dnb-pwd': 'password'
				}};

				$http.get(authEndpoint, AUTHENTICATION_REQUEST_CONFIG).
					success(function(data, status, headers, config) {
						cachedAuthCookies[authEndpoint] = headers('authorization');
						deferred.resolve({authorization: headers('authorization')});
					}).
					error(function(msg, code) {
						deferred.reject({msg: msg, code: code});
					}
				);
			}
			return deferred.promise;
		}
	}
});


/**
 * Call the specified endpoint and update the UI.
 *
 * TODO:
 * -the auth service requires different params
 * -consider using config() to setup the $httpProvider and include headers there.
 * -remove magic number. e.g. the app id.
 * -can we reuse the auth service method?
 */
function callService($scope, $http, $location, $anchorScroll) {

	var requestConfig = { headers: {
			'Authorization': $scope.authenticationCookie,
			'ApplicationId': '36'
		}
	};

	$http.get($scope.requestUrl, requestConfig).
		success(function(data, status, headers, config) {
			populateView($scope, data, headers(), config, status);
			displayView($scope, $location, $anchorScroll);
		}).
		error(function(data, status, headers, config) {
			populateView($scope, data, headers(), config, status);
			displayView($scope, $location, $anchorScroll);
		}
	);
}


 /**
  * The name says it all.
  */
function replaceAll(input, target, replacement) {
	return input.split(target).join(replacement);
}


/**
 *
 */
function populateView($scope, data, headers, config, status) {
	updateProgressbar($scope, 100, 'Response Received');
	headers['status'] = status;
	$scope.responseBody = JSON.stringify(data, null, 2);
	$scope.responseHeaders = JSON.stringify(headers, null, 2);
	$scope.requestHeaders = JSON.stringify(config, null, 2);
}


/**
 *
 */
function displayView($scope, $location, $anchorScroll) {
	$scope.displayResponse = true;
	var old = $location.hash();
    $location.hash('response');
    $anchorScroll();
    $location.hash(old);
}


/**
 *
 */
function updateProgressbar($scope, value, label) {
	$scope.progressValue = value;
	$scope.progressLabel = label;
}









































function Authenticate3($http) {

	var AUTHENTICATION_REQUEST_CONFIG = { headers: {
			'ApplicationId': '36',
			'x-dnb-user': 'teamjoly@dnb.com',
			'x-dnb-pwd': 'password'
		}
	};
	var STG_AUTHENTICATION_URL = 'http://services-ext-stg.dnb.com/rest/Authentication';

    var promise = $http.get(STG_AUTHENTICATION_URL, AUTHENTICATION_REQUEST_CONFIG);

	promise.then(
	  function(payload) {
		console.log("headers = " + payload.headers('authorization'));
		return payload.headers('authorization');
	  },
	  function(errorPayload) {
		//TODO handle this
	  });
}






