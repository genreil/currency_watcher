Currency Watcher Applet
=======================

Applet shows current exchange rate for given currencies.

Currently, given fromCurrency and toCurrency are set in applet.js file.

One can change the refresh frequency on the following line:

Mainloop.timeout_add_seconds(2, Lang.bind(this, function()...

