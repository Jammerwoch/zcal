// zcal
// copyright 2013 Ethan Brown <ethan@philomathics.com>

"use strict";

(function($){

	function zeroPad(num,width) {
	    var s = num + '';
	    while( s.length < width ) s = '0' + s;
	    return s;			
	}

	function formatTime(time,is24hour) {
		if( is24hour ) {
		    return zeroPad( time, 4 );			
		} else {
			var suffix = time < 1200 ? "a" : "p";
			if( time >= 1300 ) time -= 1200;
			var h = Math.floor( time/100 );
			if( h == 0 ) h = 12;
			var m = time%100;
			return h + ':' + zeroPad( m, 2 ) + suffix;
		}
	}

	// adds <div class="time-block"></div> elements to parent element; this is how you fill up a "day" or a label column
	// fnContent is a function that takes the integer time (0=midnight, 1200=noon, etc.), the minute past the hour (for
	// convenience), and returns the contents of the <div>.
	function addTimeBlocks( $elt, settings, fnContent ) {
		if( !fnContent ) fnContent = function() {return '';};
		for( var t=settings['startTime']; t<settings['endTime']-1; t+=settings['timeIncrement'] ) {
			var m = t%100;
			if( m===60 ) {
				// it's generally a bad idea to modify the loop variable, but since we're dealing
				// with time, we don't really have a good option...we use the same technique
				// throught this library, so buckle up.
				m = 0;
				t += 40;	// advance to the next hour
			}
			var label = m===0 ? formatTime( t, settings['use24hour'] ) : '';
			var extraClasses = '';
			switch( m ) {
				case 0: extraClasses = ' hour'; break;
				case 15: extraClasses = ' hour15'; break;
				case 30: extraClasses = ' hour30'; break;
				case 45: extraClasses = ' hour45'; break;
			}
			$elt.append( '<div class="time-block' + extraClasses + '" data-time="' + t + '">' + fnContent(t,m) + '</div>' );
		}
	}

	function timeToMinutesPastMidnight( time ) {
		var h = Math.floor( time/100 );
		var m = time % 100;
		return h*60+m;
	}


	var methods = {

		initWeek : function( options ) {

			var settings = $.extend( {
				'startTime': 900,
				'endTime': 1700,
				'timeIncrement': 15,
				'timeBlockHeight': 12,	
				'use24hour': true,
			}, options );

			// TODO: allow day to start on something other than Mon
			// TODO: provide mappings to single-letter, short, and long day names
			// TODO: i18n
			var days = [
				{letter:'M',name:'Monday',abbr:'Mon',num:1},
				{letter:'T',name:'Tuesday',abbr:'Tue',num:2},
				{letter:'W',name:'Wednesday',abbr:'Wed',num:3},
				{letter:'R',name:'Thursday',abbr:'Thu',num:4},
				{letter:'F',name:'Friday',abbr:'Fri',num:5},
				{letter:'S',name:'Saturday',abbr:'Sat',num:6},
				{letter:'U',name:'Sunday',abbr:'Sun',num:7},
			];

			// create "week" div, which will hold "day" divs
			var dataAttrs = 'data-starttime="' + settings['startTime'] + '" data-endtime="' + settings['endTime'] + '"';
			var $week = $('<div class="week" ' + dataAttrs + '></div>').appendTo(this);

			// create a "day" div wthin "week" for each day of the week
			// TODO: allow weeks to start on day other than Monday, but make
			// sure Mon is allways numbered 1
			for( var i=0; i<days.length; i++ ) {
				var day = days[i];
				var dataAttrs = 'data-day="' + day.num + '"';
				// create a vertical header column for the day and populate.  using media queries, the
				// header column can be turned off for all but the first day for fullscreen
				var $dayHeader = $('<div class="vheader' + (i===0?' first':'') + '"' + dataAttrs +'><div class="header"></div></div>')
					.appendTo($week);
				addTimeBlocks( $dayHeader, settings, 
					function(t,m) { return m===0 ? formatTime( t, true ) : ''; } );

				// create the "day" column and populate
				var $day = $('<div class="day"' + dataAttrs + '><div class="header">' + day.abbr + '</div></div>')
					.appendTo($week);
				addTimeBlocks( $day, settings );
			}

			return this;
		},

		addAppointment : function( day, startTime, endTime, content, id ) {
			// TODO: all the time calculations need to be...more flexible & consistent
			console.log( 'adding "' + content + '" on day ' + day + ' from ' + startTime + ' to ' + endTime );
			var $week = this.find( '.week' );
			var $day = $week.find( '.day[data-day=' + day + ']' );
			var $dayHeader = $day.find( '.header' );
			var dayStart = timeToMinutesPastMidnight( $week.data( 'starttime' ) );
			var m1 = timeToMinutesPastMidnight( startTime );
			var m2 = timeToMinutesPastMidnight( endTime );
			var timeBlockHeight = 12/15;	// TODO: make height and block time configurable
			var dataAttrs = 
				' data-day="' + day + '"' +
				' data-start="' + startTime + '"' +
				' data-end="' + endTime + '"';
			if( id )	
				dataAttrs += ' data-id="' + id + '"';
			// TODO: take into account appt borders
			var style = 'margin-top:' + (m1-dayStart)*timeBlockHeight + 'px;' +
				'height:' + (m2-m1)*timeBlockHeight + 'px;';
			var $appt = $('<div class="appt" style="' + style + '"' + dataAttrs + '><div class="appt-contents">' + content + '</div></div>')
				.insertAfter( $dayHeader );

			// draggable support
			// TODO: allow for disabling draggable support
			//$appt.draggable({ snap: '.time-block' });

			return this;
		},

	};

	$.fn.zcal = function( method ) {
		if( methods[method] ) {
			return methods[ method ].apply( this, Array.prototype.slice.call( arguments, 1 ) );
		} else if( typeof method === 'object' || !method ) {
			// for now, we're defaulting to initWeek; this may change in the future
			return methods.initWeek.apply( this, arguments );
		} else {
			$.error( 'Method ' +  method + ' does not exist on jQuery.zcal' );
		} 
	}


})(jQuery);
