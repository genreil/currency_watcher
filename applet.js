const Lang = imports.lang;
const Applet = imports.ui.applet;
const GLib = imports.gi.GLib;
const Gettext = imports.gettext.domain('cinnamon-applets');
const _ = Gettext.gettext;

const PopupMenu = imports.ui.popupMenu;
const Main = imports.ui.main;
const Util = imports.misc.util;
const Mainloop = imports.mainloop;

const Json = imports.gi.Json;
// http://developer.gnome.org/libsoup/stable/libsoup-client-howto.html
const Soup = imports.gi.Soup;
// Soup session (see https://bugzilla.gnome.org/show_bug.cgi?id=661323#c64)
const _httpSession = new Soup.SessionAsync();
Soup.Session.prototype.add_feature.call(_httpSession, new Soup.ProxyResolverDefault());

const AppletDirectory = imports.ui.appletManager.appletMeta["currency-watcher@gr"].path;
imports.searchPath.push(AppletDirectory);

function MyApplet(orientation) {
    this._init(orientation);
}

current_rate = '0';
previous_rate = '0';

MyApplet.prototype = {
    __proto__: Applet.TextIconApplet.prototype,

    _init: function(orientation) {
        Applet.TextIconApplet.prototype._init.call(this, orientation);

        try {
            this.menuManager = new PopupMenu.PopupMenuManager(this);
            this.menu = new Applet.AppletPopupMenu(this, orientation);
            this.menuManager.addMenu(this.menu);

            this.fromCurrency = "USD";
            this.toCurrency = "ILS";

            this.monitoringCurrencyMenuItem = new PopupMenu.PopupMenuItem("Monitoring: " + this.fromCurrency + "/" + this.toCurrency, { reactive: false });
            this.menu.addMenuItem(this.monitoringCurrencyMenuItem);

            // this.fromCurrencyMenu = new PopupMenu.PopupSubMenuMenuItem(_("From Currency"));
            // setCurrencyMenuItems(this, this.fromCurrencyMenu, this.fromCurrency);
            // this.menu.addMenuItem(this.fromCurrencyMenu);

            // this.toCurrencyMenu = new PopupMenu.PopupSubMenuMenuItem(_("To Currency"));
            // setCurrencyMenuItems(this, this.toCurrencyMenu, this.toCurrency);
            // this.menu.addMenuItem(this.toCurrencyMenu);

            this.set_applet_icon_name("invest-applet");
            this.set_applet_label(this.fromCurrency + "/" + this.toCurrency);
            this.monitoringCurrencyMenuItem.label.text = "Monitoring: " + this.fromCurrency + "/" + this.toCurrency;
            this.set_applet_tooltip(_("Currency Watcher"));

            this.refreshCurrency();
        }
        catch (e) {
            global.logError(e);
        }
     },

    on_applet_clicked: function(event) {
        this.menu.toggle();
    },

    load_json_async: function(url, fun) {
        let here = this;
        let message = Soup.Message.new('GET', this.convertion_url());
        try{
            _httpSession.queue_message(message, function(session, message) {
                fun.call(here, message.response_body.data);
            });
        }
        catch(error) {
            this.notifyMsg('(ERROR) ' + error.toString());
        }
    },

    convertion_url: function(){
        return "http://rate-exchange.appspot.com/currency?from=" + this.fromCurrency + "&to=" + this.toCurrency;
    },

    refreshCurrency: function(){
        this.load_json_async(this.convertion_url(), function(body) {
            current_rate = body.toString().replace( /^\D+/g, '').replace( /\D+$/g, '').substring(0,6);
            if ( current_rate != previous_rate ){
                var up_down = (current_rate < previous_rate) ? 'down' : 'up';
                this.set_applet_icon_path(AppletDirectory + '/icons/arrow_' + up_down + '.png');
                this.set_applet_label(current_rate);
                previous_rate = current_rate;
            }
        });
        Mainloop.timeout_add_seconds(2, Lang.bind(this, function() {
            this.refreshCurrency();
        }));
    },

    notifyMsg: function(rate){
        Util.spawnCommandLine("notify-send -i dialog-information 'Currency Watcher: " + rate + "'" );
    }

    // currencies: function(event) {
    //     return ["AED","ANG","ARS","AUD","BDT","BGN","BHD","BND","BOB","BRL","BWP","CAD","CHF",
    //         "CLP","CNY","COP","CRC","CZK","DKK","DOP","DZD","EEK","EGP","EUR","FJD","GBP",
    //         "HKD","HNL","HRK","HUF","IDR","ILS","INR","JMD","JOD","JPY","KES","KRW","KWD",
    //         "KYD","KZT","LBP","LKR","LTL","LVL","MAD","MDL","MKD","MUR","MVR","MXN","MYR",
    //         "NAD","NGN","NIO","NOK","NPR","NZD","OMR","PEN","PGK","PHP","PKR","PLN","PYG",
    //         "QAR","RON","RSD","RUB","SAR","SCR","SEK","SGD","SKK","SLL","SVC","THB","TND",
    //         "TRY","TTD","TWD","TZS","UAH","UGX","USD","UYU","UZS","VEF","VND","XOF","YER",
    //         "ZAR","ZMK"];
    // },
};

function main(metadata, orientation) {
    let myApplet = new MyApplet(orientation);
    return myApplet;
}