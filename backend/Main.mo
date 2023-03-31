import Array "mo:base/Array";
import Debug "mo:base/Debug";
import Int "mo:base/Int";
import Iter "mo:base/Iter";
import Principal "mo:base/Principal";
import Text "mo:base/Text";
import Time "mo:base/Time";
import Prelude "mo:base/Prelude";

actor {

  type HeaderField = (Text, Text);

  type HttpResponse = {
    status_code : Nat16;
    headers : [HeaderField];
    body : Blob;
  };

  type HttpRequest = {
    method : Text;
    url : Text;
    headers : [HeaderField];
    body : Blob;
  };

  type LogItem = {
    timestamp : Int;
    principal : Text;
  };

  var emptyLogItem = {
    timestamp = 0;
    principal = "";
  };
  
  stable var counter = 0;
  stable var log: [var LogItem] = Array.init<LogItem>(50, emptyLogItem);
  stable var currentIndex : Nat = 0;


  // Get the current count
  public query func get() : async Nat {
    counter;
  };

  // Increment the count by one
  public shared(msg) func inc() {
    Debug.print(debug_show(msg.caller));
    assert ( not Principal.isAnonymous(msg.caller) );

    counter += 1;

    log[currentIndex] := {
      timestamp = Time.now();
      principal = Principal.toText(msg.caller);
    };
    
    if (currentIndex < 50) {
      currentIndex += 1;
    } else {
      currentIndex := 0;
    }

  };

  // Add `n` to the current count
  public func add(n : Nat) {
    counter += n;
  };

  // Entry point for HTTP requests
  public query func http_request(req : HttpRequest) : async HttpResponse {
    var log_as_text: Text = ""; 
    for (item in Iter.fromArrayMut<LogItem>(log)) {
      if (item.timestamp != 0) {
        log_as_text := log_as_text # Int.toText(item.timestamp) # " " # item.principal #  "\n"
      };
    };

    {
      status_code = 200;
      headers = [( "Content-Type", "text/plain" )];
      body = Text.encodeUtf8(log_as_text);
    }
  };
};
