#zcal

zcal is a jQuery plugin to create responsive HTML5 calendars with appointments.

## Usage

After jQuery has been included in your project, include `jquery-zcal.js`.  To initialize a DOM element
with zcal, simple call the zcal plugin with one of `initWeek` (for a week view), `initDay` (for a single
day view), or `initMonth` (for a month view).  Example:

```
<div id="zcalWeek"></div>
<div id="zcalDay"></div>
<div id="zcalMonth"></div>
<script>
	$('#zcalWeek').zcal( 'initWeek' );
	$('#zcalDay').zcal( 'initDay' );
	$('#zcalMonth').zcal( 'initMonth' );
</script>
```

To add an appointment to any initialized zcal element, simply call zcal with `addAppointment`:

```
	$('#zcalWeek').zcal( 'addAppointment', 2, 1015, 1330, 'foo' );
```

This adds an apointment on Tue (Sun=0, Mon=1, Tue=2, etc.) from 10:15a to 1:30p (1330 hours) called "foo".
