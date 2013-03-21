// zcal
// copyright 2013 Ethan Brown <ethan@philomathics.com>

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
	// convenience), and returns the contents of the <div>
	function addTimeBlocks( $elt, startTime, endTime, timeIncrement, fnContent ) {
		if( !fnContent ) fnContent = function() {return '';};
		for( var t=startTime; t<endTime-1; t+=timeIncrement ) {
			var m = t%100;
			if( m===60 ) {
				// it's generally a bad idea to modify the loop variable, but since we're dealing
				// with time, we don't really have a good option...we use the same technique
				// throught this library, so buckle up.
				m = 0;
				t += 40;	// advance to the next hour
			}
			// TODO: formatting options for 12h/24h time
			var label = m===0 ? formatTime( t, true ) : '';
			var extraClasses = '';
			switch( m ) {
				case 0: extraClasses = ' hour'; break;
				case 15: extraClasses = ' hour15'; break;
				case 30: extraClasses = ' hour30'; break;
				case 45: extraClasses = ' hour45'; break;
			}
			$elt.append( '<div class="time-block' + extraClasses + '">' + fnContent(t,m) + '</div>' );
		}
	}

	$.fn.zcalWeek = function() {

		// TODO: allow day to start on something other than Mon
		// TODO: provide mappings to single-letter, short, and long day names
		// TODO: i18n
		var days = [ 'mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun' ];
		// TODO: allow a way to specify startTime, endTime, and timeIncrement
		var startTime = 900;
		var endTime = 2100;
		var timeIncrement = 15;

		// create "week" div, which will hold "day" divs
		var dataAttrs = 'data-starttime="' + startTime + '" data-endtime="' + endTime + '"';
		this.append( '<div class="week" ' + dataAttrs + '></div>' );
		var $week = this.find('.week');

		// create a "day" div wthin "week" for each day of the week
		for( var day=0; day<days.length; day++ ) {
			var dataAttrs = 'data-day="' + day + '"';
			// create a vertical header column for the day and populate.  using media queries, the
			// header column can be turned off for all but the first day for fullscreen
			$week.append( '<div class="vheader' + (day===0?' first':'') + '"' + dataAttrs +'><div class="header"></div></div>' );
			addTimeBlocks( $week.children().last(), startTime, endTime, timeIncrement, 
				function(t,m) { return m===0 ? formatTime( t, true ) : ''; } );

			// create the "day" column and populate
			$week.append( '<div class="day"' + dataAttrs + '><div class="header">' + days[day] + '</div></div>' );
			addTimeBlocks( $week.children().last(), startTime, endTime, timeIncrement );
		}

	}

	function timeToMinutesPastMidnight( time ) {
		var h = Math.floor( time/100 );
		var m = time % 100;
		return h*60+m;
	}

	$.fn.zcalAddAppointment = function(day,startTime,endTime,content) {
		// TODO: all the time calculations need to be...more flexible & consistent
		var $week = this.find( '.week' );
		var $day = $week.find( '.day[data-day=' + day + ']' );
		var $dayHeader = $day.find( '.header' );
		var dayStart = timeToMinutesPastMidnight( $week.data( 'starttime' ) );
		var m1 = timeToMinutesPastMidnight( startTime );
		var m2 = timeToMinutesPastMidnight( endTime );
		var timeBlockHeight = 12/15;	// TODO: make height and block time configurable
		console.log( 'm1=' + m1 );
		console.log( 'm2=' + m2 );
		var style = 'margin-top:' + (m1-dayStart)*timeBlockHeight + 'px;' +
			'height:' + (m2-m1)*timeBlockHeight + 'px;';
		$dayHeader.after( '<div class="appt" style="' + style + '">' + content + '</div>' );
	}

})(jQuery);
