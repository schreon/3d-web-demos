'use strict';
var app = angular.module("x3domdemo", ["ui.bootstrap"]);
// app.config(function($httpProvider){
//         delete $httpProvider.defaults.headers.common['X-Requested-With'];
// 	$httpProvider.defaults.useXDomain = true;﻿
// });

function jsonFlickrFeed(data) {
    var el = document.getElementById('ctl');
    var scope = angular.element(el).scope();
    scope.updateData(data);
}

function details(obj) {
	var el = document.getElementById('ctl');
    el = angular.element(el);
	console.log(el);
	console.log("click!");
}

function StatusConroller($scope, $http) {
	$scope.search = "hockey";
	$scope.Math = window.Math;
	$scope.data = [];

	$scope.updateData = function(data) {
		console.log("found.")
		console.log(data);
		// add x, y, z position, width and height
		for (var i=0; i < data.items.length; i++) {
			data.items[i].x = Math.random()*10-5;
			data.items[i].y = Math.random()*6-3;
			data.items[i].z = Math.random()*4-2;
		}
        $scope.data = data;
        $scope.$apply();
	}

	$scope.dosearch = function() {
		console.log("doing search!");
		$http.jsonp('http://www.flickr.com/services/feeds/photos_public.gne?tags='+$scope.search+'&format=json');
	}

};
