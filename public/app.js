/*globals accessToken:true setupGraph:true*/

// The URL of the Singly API endpoint
var apiBaseUrl = 'https://api.singly.com';

// A small wrapper for getting data from the Singly API
var singly = {
  get: function(url, options, callback) {
    if (options === undefined ||
      options === null) {
      options = {};
    }

    options.access_token = accessToken;

    $.getJSON(apiBaseUrl + url, options, callback);
  }
};

function cleanGraph(graph) {
  var stripped = graph;
  var i;

  for (i = 0; i < 2; i++) {
    var start;
    var j;

    for (j = 0; j < stripped.length; j++) {
      start = j;

      if (stripped[j] !== 'WAKE' &&
        stripped[j] !== 'UNDEFINED') {
        break;
      }
    }

    stripped = _.rest(stripped, start).reverse();
  }

  return stripped;
}

var NUMBERS = {
  UNDEFINED: 0,
  WAKE: 1,
  REM: 2,
  LIGHT: 3,
  DEEP: 4
};

function toNumbers(graph) {
  return _.map(graph, function(interval) {
    return NUMBERS[interval];
  });
}

// Runs after the page has loaded
$(function() {
  // If there was no access token defined then return
  if (accessToken === 'undefined' ||
    accessToken === undefined) {
    return;
  }

  $('#access-token').val(accessToken);
  $('#access-token-wrapper').show();

  // Get the user's profiles
  singly.get('/profiles', null, function(profiles) {
    _.each(profiles.all, function(profile) {
      $('#profiles').append(sprintf('<li><strong>Linked profile:</strong> %s</li>', profile));
    });
  });

  var graphs = [];

  singly.get('/services/zeo/sleep_records', { limit: 250 }, function(sleepRecords) {
    _.each(sleepRecords, function(sleepRecord) {
      graphs.push(toNumbers(cleanGraph(sleepRecord.data.sleepGraph)));
    });

    var max = _.max(graphs, function(graph) {
      return graph.length;
    }).length;

    // Clamp to hour boundary
    max -= max % 12;

    var probabilities = [[], [], [], [], []];

    for (var i = 0; i < max; i++) {
      var count = 0;

      // The five sleep stages Zeo tracks
      var stages = [0, 0, 0, 0, 0];

      _.each(graphs, function(graph) {
        if (graph[i] !== undefined) {
          stages[graph[i]]++;

          count++;
        }
      });

      for (var j = 0; j < 5; j++) {
        probabilities[j].push([i, stages[j] / count]);
      }
    }

    setupGraph([
      {
        color: '#046d8b',
        key: 'Deep',
        values: probabilities[4]
      },
      {
        color: '#309292',
        key: 'Light',
        values: probabilities[3]
      },
      {
        color: '#2fb8ac',
        key: 'REM',
        values: probabilities[2]
      },
      {
        color: '#93a42a',
        key: 'Awake',
        values: probabilities[1]
      },
      {
        color: '#ecbe13',
        key: 'Undefined',
        values: probabilities[0]
      }
    ]);
  });
});
