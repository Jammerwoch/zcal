// zcal
// copyright 2013 Ethan Brown <ethan@philomathics.com>


(function($){
	"use strict";

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
			if( h === 0 ) h = 12;
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

	// TODO: allow day to start on something other than Mon
	// TODO: provide mappings to single-letter, short, and long day names
	// TODO: i18n
	// we go with the Javascript convention of 0=Sun,1=Mon,etc
	var days = [
		{letter:'U',name:'Sunday',abbr:'Sun',abbr2:'Su'},
		{letter:'M',name:'Monday',abbr:'Mon',abbr2:'Mo'},
		{letter:'T',name:'Tuesday',abbr:'Tue',abbr2:'Tu'},
		{letter:'W',name:'Wednesday',abbr:'Wed',abbr2:'We'},
		{letter:'R',name:'Thursday',abbr:'Thu',abbr2:'Th'},
		{letter:'F',name:'Friday',abbr:'Fri',abbr2:'Fr'},
		{letter:'S',name:'Saturday',abbr:'Sat',abbr2:'Sa'}
	];

	function isLeapYear( y ) {
		if( y % 400 === 0 ) return true;
		else if( y % 100 === 0 ) return false;
		else if( y % 4 === 0 ) return true;
		return false;
	}

	var daysInMonth = [ 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31 ];
	var daysInMonthLeapYear = [ 31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31 ];

	// returns a Date object representing zero hundred hours on the PREVIOUS day of the given argument
	function getPreviousDay( date ) {
		if( date.getDate() > 1 ) return new Date( date.getFullYear(), date.getMonth(), date.getDate() - 1 );
		if( date.getMonth() === 1 ) return new Date( date.getFullYear()-1, 11, 31 );
		return new Date( date.getFullYear(), date.getMonth()-1,
			isLeapYear( date.getFullYear() ) ? daysInMonthLeapYear[date.getMonth()-1] : daysInMonth[date.getMonth()-1] );
	}

	// returns a Date object representing zero hundre hours on the NEXT day of the given argument
	function getNextDay( date ) {
		if( date.getDate() < (isLeapYear( date.getFullYear() ) ? daysInMonthLeapYear[date.getMonth()] : daysInMonth[date.getMonth()]) )
			return new Date( date.getFullYear(), date.getMonth(), date.getDate() + 1 );
		if( date.getMonth() === 11 ) return new Date( date.getFullYear()+1, 1, 1 );
		return new Date( date.getFullYear(), date.getMonth()+1, 1 );
	}

	// returns the next day of the week following the given day of the week; Sun=0,Mon=1,etc
	function getNextDayOfWeek( day ) {
		if( day < 6 ) return day + 1;
		return 1;
	}

	// returns the day of the week offset by some number.  Sun=0,Mon=1,etc
	// offset must be non-negative
	function getDayOfWeek( day, offset ) {
		return (day + offset) % 7;
	}

	var methods = {

		initWeek : function( options ) {

			var settings = $.extend( {
				'startTime': 900,
				'endTime': 1700,
				'timeIncrement': 15,
				'timeBlockHeight': 12,
				'use24hour': true,
				'weekStartsOn': 0
			}, options );

			// create "week" div, which will hold "day" divs
			var dataAttrs = 'data-starttime="' + settings['startTime'] + '" data-endtime="' + settings['endTime'] + '"';
			var $week = $('<div class="week" ' + dataAttrs + '></div>').appendTo(this);

			// this is the function we'll use to populate the content of time blocks.  it only adds the time to
			// a time block at the top of the hour (m===0).
			var fnContents = function(t,m) { return m===0 ? formatTime( t, true ) : ''; };

			// create a "day" div wthin "week" for each day of the week
			// TODO: allow weeks to start on day other than Monday, but make
			// sure Mon is allways numbered 1
			for( var i=0; i<days.length; i++ ) {
				var dow = getDayOfWeek( settings.weekStartsOn, i );
				var day = days[dow];
				dataAttrs = 'data-dayofweek="' + dow + '"';
				// create a vertical header column for the day and populate.  using media queries, the
				// header column can be turned off for all but the first day for fullscreen
				var $dayHeader = $('<div class="vheader' + (i===0?' first':'') + '"' + dataAttrs +'><div class="header"></div></div>')
					.appendTo($week);
				addTimeBlocks( $dayHeader, settings, fnContents );

				// create the "day" column and populate
				var $day = $('<div class="day"' + dataAttrs + '><div class="header">' + day.abbr + '</div></div>')
					.appendTo($week);
				addTimeBlocks( $day, settings );
			}

			// set the height for the zcal element for proper sizing; notice the 5% fudge factor
			// TODO: make this better...i dislike fudge factors
			this.height( $week.find('.vheader').height() * 1.05 );

			return this;
		},

		initDay: function( options ) {

			var settings = $.extend( {
				'dayOfWeek': 1,
				'startTime': 900,
				'endTime': 1700,
				'timeIncrement': 15,
				'timeBlockHeight': 12,
				'use24hour': true
			}, options );

			var dataAttrs = '';
			// create a vertical header column for the day and populate.  using media queries, the
			// header column can be turned off for all but the first day for fullscreen
			var $dayHeader = $('<div class="vheader first"' + dataAttrs +'><div class="header"></div></div>')
				.appendTo(this);
			addTimeBlocks( $dayHeader, settings,
				function(t,m) { return m===0 ? formatTime( t, true ) : ''; } );

			// create the "day" column and populate
			var $day = $('<div class="day"' + dataAttrs + '><div class="header">' + days[settings.dayOfWeek].abbr + '</div></div>')
				.appendTo(this);
			addTimeBlocks( $day, settings );

			// set the height for the zcal element for proper sizing; notice the 5% fudge factor
			this.height( $dayHeader.height() * 1.05 );

			return this;
		},

		initMonth: function( options ) {

			var now = new Date();

			var settings = $.extend( {
				'year': now.getFullYear(),
				'month': now.getMonth(),
				'use24hour': true,
				'weekStartsOn': 0
			}, options );

			var d = new Date( settings.year, settings.month, 1 );

			// back up until we find what day to start on
			while( d.getDay() !== settings.weekStartsOn ) d = getPreviousDay( d );

			var dow, i;

			var $monthHeader = $('<div class="month-header"></div>').appendTo( this );
			for( i=0; i<7; i++ ) {
				dow = getDayOfWeek( settings.weekStartsOn, i );
				$('<div class="day">' + days[dow].abbr2 + '</div>').appendTo( $monthHeader );
			}

			do {
				var $week = $('<div class="week"></div>').appendTo(this);
				for( i=0; i<7; i++ ) {
					dow = getDayOfWeek( settings.weekStartsOn, i );
					$('<div class="day">' + d.getDate() + '</div>').appendTo( $week );
					d = getNextDay( d );
				}
			} while( d.getMonth() === settings.month );

			return this;
		},

		// TODO: allow adding appoint by specific day, not just day of week
		addAppointment: function( dayOfWeek, startTime, endTime, content, id ) {
			// TODO: all the time calculations need to be...more flexible & consistent
			var $week = this.find( '.week' );
			var $day = $week.find( '.day[data-dayofweek=' + dayOfWeek + ']' );
			var $dayHeader = $day.find( '.header' );
			var dayStart = timeToMinutesPastMidnight( $week.data( 'starttime' ) );
			var m1 = timeToMinutesPastMidnight( startTime );
			var m2 = timeToMinutesPastMidnight( endTime );
			var timeBlockHeight = 12/15;	// TODO: make height and block time configurable
			var dataAttrs =
				' data-dayofweek="' + dayOfWeek + '"' +
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
		}

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
	};


})(jQuery);
