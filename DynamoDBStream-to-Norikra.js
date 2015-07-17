var async = require('async');
var request = require('request');

var norikraApi = 'http://norikra.example.com:26578/api/';
var openTargetApi = norikraApi + 'open';
var sendEventApi = norikraApi + 'send';

var formatRecord = function (record, callback) {
  const string = 'S';
  const number = 'N';
  const stringSet = 'SS';
  const numberSet = 'NS';

  var cast = function (item) {
    var type = Object.keys(item)[0]
    if (type == string || type == stringSet) {return item[type];}
    else if (type == number) {return parseFloat(item[type]);}
    else if (type == numberSet) {return item[type].map(parseFloat);}
    else return null;
  };

  var formattedRecord = {};
  for (var i in record) {
    if (i == 'dynamodb') {
      formattedRecord[i] = {};
      for (var j in record[i]) {
        if (j == 'Keys' || j == 'NewImage' || j == 'OldImage') {
          formattedRecord[i][j] = {};
          for (var k in record[i][j]) {
            formattedRecord[i][j][k] = cast(record[i][j][k]);
          }
        }
        else {
          formattedRecord[i][j] = record[i][j];
        }
      }
    }
    else if (i == 'eventSourceARN'){
      formattedRecord[i] = record[i];
      formattedRecord['table'] = record[i].match(/arn:aws:dynamodb:[^:]+:\d+:table\/([^\/]+)\/stream/)[1];
    }
    else {
      formattedRecord[i] = record[i];
    }
  }
  return formattedRecord;
};

exports.handler = function(event, context) {
  console.log("Event: %j", event);

  var formatedRecords = event.Records.map(formatRecord);
  var targets = formatedRecords.map(function (record) { return record.table; }).
                  filter(function (x, i, self) { return self.indexOf(x) === i; });
  async.series(
    [
      // create Norikra target
      function (callback) {
        async.each(targets,
          function (target, cb) {
            var options = {
              uri: openTargetApi,
              method: 'POST',
              json: {target: target, fields: null, auto_field: true}
            };
            request(options, function (err, res, body) {
              if (!err && res.statusCode == 200) {
                console.log('create target:' + target);
                cb();
              }
              else {
                cb(err);
              }
            });
          },
          function (err) {
            if (err) {callback(err);}
            else {callback(null, 'created targets');}
          }
        )
      },
      // send events to Norikra
      function (callback) {
        async.each(targets,
          function (target, cb) {
            var events = formatedRecords.filter(function (record) {return record.table == target;});
            var options = {
              uri: sendEventApi,
              method: 'POST',
              json: {target: target, events: events}
            };
            request(options, function (err, res, body) {
              if (!err && res.statusCode == 200) {
                console.log('sends ' + events.length + ' events to ' + target);
                cb();
              }
              else {
                cb(err);
              }
            });
          },
          function (err) {
            if (err) {callback(err);}
            else {callback(null, 'sent events');}
          }
        )
      }
    ],
    function (err, results) {
      if (err) {context.done('error', err);}
      else {context.done(null, results);}
    }
  );
}

// exports.handler(event, {done: function(){process.exit();}});
