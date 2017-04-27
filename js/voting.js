if (! document.cookie.includes("votingId")) {
  document.cookie = "votingId=" + Math.random().toString(36).substring(2);
}

var votingId = document.cookie.replace(/(?:(?:^|.*;\s*)votingId\s*\=\s*([^;]*).*$)|^.*$/, "$1");

var votingSocket = null;

var openSocket = function() {
  votingSocket = new WebSocket("wss://votes.spaceappsexeter.org/vote");

  votingSocket.onopen = function (event) {
    console.log("Connected to voting service")
    votingSocket.send(JSON.stringify({
      "type": "sync",
      "voter": votingId
    }));
    votingSocket.send(JSON.stringify({
      "type": "own",
      "voter": votingId
    }));
  };

  votingSocket.onmessage = function (event) {
    var msg = JSON.parse(event.data);
    console.log(msg);
    var type = msg["type"];
    var response = msg["response"];
    if (type == "vote") {
      for (var key in response) {
        updateVotes(key, response[key]);
      }
    } else if (type == "own") {
      for (var key in response) {
        toggleActive(document.getElementById(response[key]));
        toggleActive(document.getElementById("contents-"+response[key]));
      }
    } else if (type == "sync") {
      for (var key in response) {
        updateVotes(key, response[key]);
      }
    }
  }

  votingSocket.onclose = function (event) {
    votingSocket = null;
    openSocket();
  }
}
openSocket();

var classname = document.getElementsByClassName("voting-button");

var vote = function() {
    var slug = this.getAttribute("id");
    ga('send', 'event', 'Vote', 'vote', slug);
    toggleActive(this);
    toggleActive(document.getElementById("contents-"+slug));
    votingSocket.send(JSON.stringify({
      "type": "vote",
      "challenge": slug,
      "voter": votingId
    }));
};

var toggleActive = function(element) {
  if (element.classList.contains("active")){
    element.classList.remove("active");
  } else {
    element.classList.add("active");
  }
}

var updateVotes = function(slug, number) {
  counter = document.getElementById("counter-"+slug);
  counter.innerHTML = number;
}

for (var i = 0; i < classname.length; i++) {
    classname[i].addEventListener('click', vote, false);
}
