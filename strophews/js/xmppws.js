var xmppws = xmppws||{};

xmppws.demo = {
  connection: null,
  jid: "",
  appName: 'demo',
  domainName: '192.168.1.179',
//  WS: "ws://192.168.1.179:5000/",
  WS: "ws://192.168.1.179:5288/ws-xmpp",
  BOSH: "http://192.168.1.179:5280/http-bind/",

  init: function() {
    xmppws.demo.setup_namespaces();
    $("#signin").click(function(ev) {
       if (xmppws.demo.connection) {
         xmppws.demo.disconnect();
         $("#signin").html("Sign in");
       } else {
         var chatjid = $("#jid").val();
         var password = $("#pass").val();
         xmppws.demo.connect(chatjid, password);
       }
    });

    $("#send").click(function(ev) {
      var chatwith = $("#chatwith").val();
      var msg = $("#msg").val();
      xmppws.demo.send_chat_message(chatwith, msg);
    });
  },

  setup_namespaces: function() {
    Strophe.addNamespace('PUBSUB', 'http://jabber.org/protocol/pubsub');
    Strophe.addNamespace('PEP', 'http://jabber.org/protocol/pubsub#event');
    Strophe.addNamespace('TUNE', 'http://jabber.org/protocol/tune');
    Strophe.addNamespace('CAPS', 'http://jabber.org/protocol/caps');
    Strophe.addNamespace('CLIENT', 'jabber:client');
    Strophe.addNamespace('ROSTER', 'jabber:iq:roster');
    Strophe.addNamespace('CHATSTATES', 'http://jabber.org/protocol/chatstates');
    Strophe.addNamespace('MUC', 'http://jabber.org/protocol/muc');
    Strophe.addNamespace('MUC_USER', 'http://jabber.org/protocol/muc#user');
    Strophe.addNamespace('MUC_OWNER', 'http://jabber.org/protocol/muc#owner');
    Strophe.addNamespace("GEOLOC","http://jabber.org/protocol/geoloc");

    xmppws.demo.NS={
      "CHAT":"convo_chat",
      "COMMAND":'lissn_command',
      "INFO":"lissn_infomation"
    };

  },//end setup_namespaces

  addHandlers:function() {
    xmppws.demo.connection.addHandler(xmppws.demo.on_message, null, "message", "chat");

  },

  connect: function(chatjid, password) {
// mod_websocket
    var conn = new Strophe.Connection(xmppws.demo.WS, {protocol: "ws"});
// jabsocket proxy
//    var conn = new Strophe.Connection("ws://192.168.1.179:5000/", {protocol: "ws"});
    xmppws.demo.jid = chatjid+"@"+xmppws.demo.domainName;
    console.log(chatjid + ":" + password);
    conn.connect(xmppws.demo.jid, password, function (status) {
      if (status === Strophe.Status.CONNECTED) {
        $("#signin").html("Sign out");
        xmppws.demo.send_available_presence();
        xmppws.demo.addHandlers();
      } else if (status === Strophe.Status.DISCONNECTED || status===Strophe.Status.AUTHFAIL) {
        console.log("DISCONNECTED | AUTHFAIL");
        xmppws.demo.connection=null;
      } else {
        console.log("connect = " + status);
      }
    });

    xmppws.demo.connection=conn;
  },

  send_available_presence: function() {
    var availablePresence = $pres()
            .c('show').t('chat').up()
            .c('status').t('online');
    xmppws.demo.connection.send(availablePresence);
  },

  send_unavailable_presence: function() {
    var unavailablePresence = $pres({type:"unavailable"})
        .c('show').t('gone');

    xmppws.demo.connection.send(unavailablePresence);
  },

  send_chat_message: function(name, body) {
    var jid = name + "@" + xmppws.demo.domainName;
    var message = $msg({to: jid, "type": "chat"})
        .c('body').t(body).up()
        .c('active', {xmlns: Strophe.NS.CHATSTATES});
    xmppws.demo.connection.send(message);
  },

  on_message: function(message) {
    console.log("message --->");
    var full_jid = $(message).attr('from');
    var node = Strophe.getNodeFromJid(full_jid);
    var body = $(message).find('body');
    if (body.length === 0) {
      body = null;
    } else {
      console.log("@@ incoming");
      body = body.text();
    }
    if (body) {
      var inc = "<div>" + node + ": " + body + "</div>"
      $('#incomming').append(inc);
    }

    return true;
  },

  disconnect: function() {
    xmppws.demo.send_unavailable_presence();
    xmppws.demo.connection.sync=true;
    xmppws.demo.connection.flush();
    xmppws.demo.connection.disconnect();
  }
};

$(document).ready(function(){
  xmppws.demo.init();
});

window.onbeforeunload=function(){
  xmppws.demo.disconnect();
};
