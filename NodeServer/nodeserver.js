var express = require( 'express' );
var app = express();
app.use( express.static(__dirname));

var server = require( 'http' ).Server( app );
var io = require( 'socket.io' )( server );

// Store data
var stats = {
  connections: 0,
  touch: 0,
  video: 0,
  pages: {}
};

// Map of Socket.id to Socket object
var socketData = {};

// Namespace use when capturing data
var capture = io.of('/capture');
//var capture2 = io.of('/capture2');

//capture2.on('connection', function (socket) {
//    console.log("Caaaaaputure 2222222");
//    socket.on('status-updated', function (data) {
//        console.log("Emitting to consumer from Capture2222");
//        consumer.emit('stats-updated', stats);
//    });
//});

capture.on( 'connection', function( socket ) {
  ++stats.connections;

  socket.on( 'client-data', function( data ) {
    socketData[ socket.id ] = data;
    stats.touch += ( data.touch? 1 : 0 );
    stats.video += ( data.video? 1 : 0 );

    var pageCount = stats.pages[ data.url ] || 0;
    stats.pages[ data.url ] = ++pageCount;

    console.log( stats );
    consumer.emit( 'stats-updated', stats );
    consumer.emit( 'create', stats );
  } );

  socket.on( 'disconnect', function() {
    // Clear down stats for lost socket
    // comment this line if you want to see more grid rows
    --stats.connections;

    stats.touch -= ( socketData[ socket.id ].touch? 1 : 0 );
    stats.video -= ( socketData[ socket.id ].video? 1 : 0 );
    --stats.pages[ socketData[ socket.id ].url ];
    delete socketData[ socket.id ];

    console.log( stats );
    consumer.emit( 'stats-updated', stats );
  } );

} );

var consumer = io.of( '/consumer' );
consumer.on( 'connection', function( socket ) {
  // Send an update to the newly connected consumer socket
  socket.emit( 'stats-updated', stats );
  socket.emit( 'create', stats );
} );

server.listen( 3000, function(){
  console.log( 'listening on *:3000' );
} );
